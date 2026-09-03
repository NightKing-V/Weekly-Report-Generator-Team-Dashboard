import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../context/ReportContext';
import { StatusBadge } from '../components/common/StatusBadge';
import type { ReportStatus } from '../types';
import { formatDate } from '../utils/formatters';
import {
  History,
  FileText,
  Calendar,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';

import type { ReportHistoryPageProps } from '../props';

export const ReportHistoryPage: React.FC<ReportHistoryPageProps> = ({
  onOpenReport,
  onCreateNew,
}) => {
  const { currentUser } = useAuth();
  const { getUserReports } = useReports();
  const [filterStatus, setFilterStatus] = useState<string>('All');

  if (!currentUser) return null;

  const userReports = getUserReports(currentUser.id);

  const filteredReports = userReports.filter((r) => {
    if (filterStatus === 'All') return true;
    return r.status === filterStatus;
  });

  const statuses: (ReportStatus | 'All')[] = [
    'All',
    'Submitted',
    'Needs Correction',
    'Approved',
    'Draft',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">Personal Report History</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical weekly submissions for {currentUser.name} ({currentUser.title})
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500"
          >
            {statuses.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Current Week's Report</span>
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white space-y-3">
            <FileText className="h-8 w-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">No reports found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No historical reports match the selected status filter. Click below to start a new weekly submission.
            </p>
            <button
              type="button"
              onClick={onCreateNew}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Go to Report Form
            </button>
          </div>
        ) : (
          filteredReports.map((report) => {
            const totalHours =
              (report.hoursWorked?.development || 0) +
              (report.hoursWorked?.testing || 0) +
              (report.hoursWorked?.meetings || 0) +
              (report.hoursWorked?.documentation || 0);

            return (
              <div
                key={report.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-200 hover:shadow-sm transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{report.weekLabel}</h4>
                      <p className="text-xs text-slate-500">Project: {report.projectName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={report.status} />
                    <button
                      type="button"
                      onClick={() => onOpenReport(report.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      <span>{report.status === 'Needs Correction' ? 'Edit & Resubmit' : 'View Report'}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Manager correction alert snippet if in Needs Correction */}
                {report.status === 'Needs Correction' && report.latestManagerComment && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Correction Feedback:</span> "{report.latestManagerComment}"
                    </div>
                  </div>
                )}

                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Tasks Completed</span>
                    <span className="font-bold text-slate-900">
                      {report.tasksCompleted?.length || 0} tasks
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Total Hours Logged</span>
                    <span className="font-bold text-slate-900">{totalHours} hrs</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Blockers Logged</span>
                    <span
                      className={`font-bold ${
                        (report.blockers?.length || 0) > 0 ? 'text-amber-700' : 'text-slate-900'
                      }`}
                    >
                      {report.blockers?.length || 0} issues
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Submission Date</span>
                    <span className="font-medium text-slate-700">
                      {report.submittedAt ? formatDate(report.submittedAt) : 'In Draft'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
