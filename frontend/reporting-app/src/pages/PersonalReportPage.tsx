import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../context/ReportContext';
import { ReportForm } from '../components/reports/ReportForm';
import { StatusBadge } from '../components/common/StatusBadge';
import type { WeeklyReport } from '../types';
import type { PersonalReportPageProps } from '../props';
import { useFetch } from '../hooks/useFetch';
import { apiClient } from '../services/api';
import { CheckCircle2, FileEdit, History, Loader2 } from 'lucide-react';

export const PersonalReportPage: React.FC<PersonalReportPageProps> = ({
  onViewHistory,
  onViewDetails,
}) => {
  const { currentUser } = useAuth();
  const { selectedWeek, saveDraft, submitReport, projects, fetchProjects } = useReports();
  const { execute } = useFetch();

  const [activeReport, setActiveReport] = useState<WeeklyReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);

  // Ensure projects are available for the dropdown
  useEffect(() => {
    if (projects.length === 0) {
      fetchProjects();
    }
  }, [projects.length, fetchProjects]);

  // Fetch the report for the current user and the selected week on demand
  useEffect(() => {
    let isMounted = true;
    const loadReportForWeek = async () => {
      if (!currentUser) return;
      setLoadingReport(true);
      try {
        const fetched = await apiClient.reports.getAll({
          userId: currentUser.id,
          week: selectedWeek,
        });
        if (isMounted) {
          setActiveReport(fetched && fetched.length > 0 ? fetched[0] : null);
        }
      } catch (err) {
        console.error('Failed to load current week report:', err);
      } finally {
        if (isMounted) setLoadingReport(false);
      }
    };

    loadReportForWeek();
    return () => {
      isMounted = false;
    };
  }, [currentUser, selectedWeek]);

  if (!currentUser) return null;

  const handleSaveDraft = async (data: Partial<WeeklyReport>) => {
    await execute(
      async () => {
        const saved = await saveDraft(data);
        setActiveReport(saved);
        return saved;
      },
      {
        showSuccessSnackbar: true,
        successMessage: `Draft saved successfully for ${data.weekLabel || selectedWeek}.`,
      }
    );
  };

  const handleSubmit = async (data: Partial<WeeklyReport>) => {
    await execute(
      async () => {
        const submitted = await submitReport(data);
        setActiveReport(submitted);
        return submitted;
      },
      {
        showSuccessSnackbar: true,
        successMessage: 'Weekly report submitted for manager review!',
      }
    );
  };

  const isSubmittedOrApproved =
    activeReport?.status === 'Submitted' || activeReport?.status === 'Approved';

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Personal Weekly Report</h1>
            {loadingReport ? (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading status...
              </span>
            ) : activeReport ? (
              <StatusBadge status={activeReport.status} size="md" />
            ) : (
              <StatusBadge status="Not Started" size="md" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, manage and submit your structured work report for <strong>{selectedWeek}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeReport && (
            <button
              type="button"
              onClick={() => onViewDetails(activeReport.id)}
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
      {isSubmittedOrApproved && activeReport && (
        <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/70 text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold">
                Report is currently {activeReport.status.toUpperCase()}
              </p>
              <p className="text-[11px] text-blue-800 mt-0.5">
                {activeReport.status === 'Approved'
                  ? 'Your manager has approved this weekly submission. No further changes are required.'
                  : 'Your submission is pending manager review. If revisions are requested, the report will unlock with reviewer comments.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onViewDetails(activeReport.id)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 cursor-pointer"
          >
            Open Full Submission
          </button>
        </div>
      )}

      {/* The Core Report Form */}
      {loadingReport ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-600">Loading your report for {selectedWeek}...</p>
        </div>
      ) : (
        <ReportForm
          key={`${selectedWeek}-${activeReport?.id || 'new'}`}
          initialReport={activeReport || undefined}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};
