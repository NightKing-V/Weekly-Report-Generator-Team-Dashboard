import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../context/ReportContext';
import { apiClient } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { Pagination } from '../components/common/Pagination';
import type { WeeklyReport } from '../types';
import { Search, ChevronRight, Users as UsersIcon } from 'lucide-react';
import type { TeamPageProps } from '../props';

export const TeamPage: React.FC<TeamPageProps> = ({ onOpenMemberProfile }) => {
  const { users, fetchUsers } = useAuth();
  const { selectedWeek } = useReports();
  const [weekReports, setWeekReports] = useState<WeeklyReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    let isCancelled = false;
    apiClient.reports.getAll({ week: selectedWeek }).then((res) => {
      if (!isCancelled) setWeekReports(res);
    }).catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [selectedWeek]);

  const departments = ['all', ...Array.from(new Set(users.map((u) => u.department).filter(Boolean)))];

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'all' || u.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((validPage - 1) * pageSize, validPage * pageSize);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">Team Directory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse all team contributors, review submission activity, and inspect weekly reports.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or role title..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => {
            setDepartmentFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
        >
          {departments.map((d) => (
            <option key={d} value={d}>
              {d === 'all' ? 'All Departments' : d}
            </option>
          ))}
        </select>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedUsers.map((member) => {
          const currentWeekReport = weekReports.find((r) => r.userId === member.id);

          return (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-sm text-indigo-700">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        (member.name || member.email).charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{member.name}</h3>
                      <p className="text-[11px] text-slate-500">{member.title}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {member.role.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px]">Active Week:</span>
                    {currentWeekReport ? (
                      <StatusBadge status={currentWeekReport.status} size="sm" />
                    ) : (
                      <StatusBadge status="Not Started" size="sm" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px]">Department:</span>
                    <span className="font-semibold text-slate-800">{member.department || 'Engineering'}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenMemberProfile(member.id)}
                  className="flex-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>View Profile & Reports</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalItems > 0 && (
        <Pagination
          currentPage={validPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[6, 9, 18]}
        />
      )}
    </div>
  );
};