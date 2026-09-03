import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../context/ReportContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate } from '../utils/formatters';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Folder,
} from 'lucide-react';

import type { TeamMemberProfilePageProps } from '../props';

export const TeamMemberProfilePage: React.FC<TeamMemberProfilePageProps> = ({
  memberId,
  onBack,
  onOpenReport,
}) => {
  const { users } = useAuth();
  const { reports } = useReports();

  const member = users.find((u) => u.id === memberId);
  const memberReports = reports
    .filter((r) => r.userId === memberId)
    .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));

  if (!member) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-700">Team member not found</p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>
    );
  }

  // Calculate member stats
  const totalReports = memberReports.length;
  const approvedReports = memberReports.filter((r) => r.status === 'Approved').length;
  const totalCompletedTasks = memberReports.reduce(
    (sum, r) => sum + (r.tasksCompleted?.filter((t) => t.status === 'Completed').length || 0),
    0
  );
  const totalHoursLogged = memberReports.reduce((sum, r) => {
    return (
      sum +
      (r.hoursWorked?.development || 0) +
      (r.hoursWorked?.testing || 0) +
      (r.hoursWorked?.meetings || 0) +
      (r.hoursWorked?.documentation || 0)
    );
  }, 0);
  const avgHoursPerWeek = totalReports > 0 ? Math.round(totalHoursLogged / totalReports) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-200 overflow-hidden flex items-center justify-center text-xl font-bold text-indigo-700 shadow-sm">
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name || 'Member'}
                  className="h-full w-full object-cover"
                />
              ) : (
                (member.name || member.email || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{member.name}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {member.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {member.title} • {member.department}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {member.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {formatDate(member.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contributor Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <p className="text-xs font-medium text-slate-500">Reports Submitted</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalReports}</p>
          <span className="text-[11px] text-slate-400">Total weekly submissions</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <p className="text-xs font-medium text-slate-500">Approved Reports</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{approvedReports}</p>
          <span className="text-[11px] text-emerald-600 font-medium">
            {totalReports > 0 ? Math.round((approvedReports / totalReports) * 100) : 0}% approval rate
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <p className="text-xs font-medium text-slate-500">Tasks Completed</p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{totalCompletedTasks}</p>
          <span className="text-[11px] text-slate-400">Verified deliverables</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <p className="text-xs font-medium text-slate-500">Avg Weekly Hours</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{avgHoursPerWeek} hrs</p>
          <span className="text-[11px] text-slate-400">{totalHoursLogged} hrs total</span>
        </div>
      </div>

      {/* Historical Reports Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">
            {member.name}'s Weekly Reports Timeline
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete historical record of all submissions and manager reviews
          </p>
        </div>

        <div className="space-y-3">
          {memberReports.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              No historical reports recorded for this team member yet.
            </p>
          ) : (
            memberReports.map((report) => {
              const hours =
                (report.hoursWorked?.development || 0) +
                (report.hoursWorked?.testing || 0) +
                (report.hoursWorked?.meetings || 0) +
                (report.hoursWorked?.documentation || 0);

              return (
                <div
                  key={report.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{report.weekLabel}</span>
                      <StatusBadge status={report.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Folder className="h-3.5 w-3.5 text-slate-400" />
                      <span>{report.projectName}</span>
                      <span>•</span>
                      <span>{report.tasksCompleted?.length || 0} tasks delivered</span>
                      <span>•</span>
                      <span>{hours} hrs logged</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {report.submittedAt ? formatDate(report.submittedAt) : 'Draft'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenReport(report.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                    >
                      Open Report
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
