import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../context/ReportContext';
import { ReportForm } from '../components/reports/ReportForm';
import { StatusBadge } from '../components/common/StatusBadge';
import type { WeeklyReport } from '../types';
import type { PersonalReportPageProps } from '../props';
import { useFetch } from '../hooks/useFetch';
import { CheckCircle2, FileEdit, History } from 'lucide-react';

export const PersonalReportPage: React.FC<PersonalReportPageProps> = ({
  onViewHistory,
  onViewDetails,
}) => {
  const { currentUser } = useAuth();
  const { reports, selectedWeek, saveDraft, submitReport } = useReports();
  const { execute } = useFetch();

  if (!currentUser) return null;

  // Find user's current report for the active selected week
  const currentReport = reports.find(
    (r) => r.userId === currentUser.id && r.weekLabel === selectedWeek
  );

  const handleSaveDraft = async (data: Partial<WeeklyReport>) => {
    await execute(
      async () => saveDraft(data),
      {
        showSuccessSnackbar: true,
        successMessage: `Draft saved successfully for ${data.weekLabel || selectedWeek}.`,
      }
    );
  };

  const handleSubmit = async (data: Partial<WeeklyReport>) => {
    await execute(
      async () => submitReport(data),
      {
        showSuccessSnackbar: true,
        successMessage: 'Weekly report submitted for manager review!',
      }
    );
  };

  const isSubmittedOrApproved =
    currentReport?.status === 'Submitted' || currentReport?.status === 'Approved';

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Personal Weekly Report</h1>
            {currentReport ? (
              <StatusBadge status={currentReport.status} size="md" />
            ) : (
              <StatusBadge status="Not Started" size="md" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, manage and submit your structured work report for <strong>{selectedWeek}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentReport && (
            <button
              type="button"
              onClick={() => onViewDetails(currentReport.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
            >
              <FileEdit className="h-3.5 w-3.5" />
              <span>View Read-Only Summary</span>
            </button>
          )}
          <button
            type="button"
            onClick={onViewHistory}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <History className="h-3.5 w-3.5" />
            <span>My Report History</span>
          </button>
        </div>
      </div>

      {/* If already submitted or approved, show info card with option to view */}
      {isSubmittedOrApproved && (
        <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/70 text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold">
                Report is currently {currentReport.status.toUpperCase()}
              </p>
              <p className="text-[11px] text-blue-800 mt-0.5">
                {currentReport.status === 'Approved'
                  ? 'Your manager has approved this weekly submission. No further changes are required.'
                  : 'Your submission is pending manager review. If revisions are requested, the report will unlock with reviewer comments.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onViewDetails(currentReport.id)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 cursor-pointer"
          >
            Open Full Submission
          </button>
        </div>
      )}

      {/* The Core Report Form */}
      <ReportForm
        initialReport={currentReport}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
