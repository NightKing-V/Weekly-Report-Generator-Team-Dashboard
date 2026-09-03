import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { ReportStatus } from '../../types';
import type { ReportsFilterBarProps } from '../../props';

export const ReportsFilterBar: React.FC<ReportsFilterBarProps> = ({
  users,
  projects,
  searchQuery,
  onSearchChange,
  selectedMemberId,
  onMemberChange,
  selectedProjectId,
  onProjectChange,
  selectedStatus,
  onStatusChange,
  onReset,
}) => {
  const statuses: (ReportStatus | 'All')[] = [
    'All',
    'Submitted',
    'Needs Correction',
    'Approved',
    'Draft',
  ];

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedMemberId !== 'all' ||
    selectedProjectId !== 'all' ||
    selectedStatus !== 'All';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks, deliverables, or authors..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Team Member Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={selectedMemberId}
              onChange={(e) => onMemberChange(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Team Members</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={selectedProjectId}
              onChange={(e) => onProjectChange(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Pill Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-indigo-900 bg-indigo-50/60 focus:ring-1 focus:ring-indigo-500"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
