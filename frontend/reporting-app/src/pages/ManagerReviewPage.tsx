import React, { useState } from 'react';
import { useReports } from '../context/ReportContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { ReviewActionModal } from '../components/reports/ReviewActionModal';
import { VersionHistoryViewer } from '../components/reports/VersionHistoryViewer';
import {
  ClipboardCheck,
  CheckCircle2,
  History,
  Eye,
} from 'lucide-react';

import type { ManagerReviewPageProps } from '../props';
import { useFetch } from '../hooks/useFetch';

export const ManagerReviewPage: React.FC<ManagerReviewPageProps> = ({ onOpenReportDetail }) => {
  const { reports, approveReport, requestChanges } = useReports();
  const { execute } = useFetch();

  const handleApprove = async (id: string, comment?: string) => {
    await execute(
      async () => approveReport(id, comment),
      {
        showSuccessSnackbar: true,
        successMessage: 'Report successfully approved!',
      }
    );
  };

  const handleRequestChanges = async (id: string, comment: string) => {
    await execute(
      async () => requestChanges(id, comment),
      {
        showSuccessSnackbar: true,
        successMessage: 'Feedback and correction request dispatched.',
      }
    );
  };

  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [versionHistoryReportId, setVersionHistoryReportId] = useState<string | null>(null);

  const pendingReports = reports.filter((r) => r.status === 'Submitted');
  const reviewedReports = reports.filter(
    (r) => r.status === 'Approved' || r.status === 'Needs Correction'
  );

  const displayedReports = activeTab === 'pending' ? pendingReports : reviewedReports;

  const handleOpenReview = (reportId: string) => {
    setSelectedReportId(reportId);
    setIsReviewModalOpen(true);
  };

  const selectedReport = reports.find((r) => r.id === selectedReportId);
  const versionReport = reports.find((r) => r.id === versionHistoryReportId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">Manager Review Workflow</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review submitted weekly reports, request corrections with feedback, or approve submissions.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pending Review</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                pendingReports.length > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {pendingReports.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviewed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'reviewed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Reviewed Reports</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-600">
              {reviewedReports.length}
            </span>
          </button>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-3">
        {displayedReports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">
              {activeTab === 'pending' ? 'All caught up!' : 'No reviewed reports'}
            </h3>
            <p className="text-xs text-slate-500">
              {activeTab === 'pending'
                ? 'There are no submitted reports waiting for manager review.'
                : 'No reports have been reviewed yet.'}
            </p>
          </div>
        ) : (
          displayedReports.map((report) => {
            const totalHours =
              (report.hoursWorked?.development || 0) +
              (report.hoursWorked?.testing || 0) +
              (report.hoursWorked?.meetings || 0) +
              (report.hoursWorked?.documentation || 0);

            return (
              <div
                key={report.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-all space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-xs text-indigo-700">
                      {report.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{report.userName}</h3>
                        <span className="text-[11px] text-slate-500">({report.userTitle})</span>
                        <StatusBadge status={report.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">{report.weekLabel}</span>
                        <span>•</span>
                        <span>{report.projectName}</span>
                        <span>•</span>
                        <span>v{report.currentVersion}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVersionHistoryReportId(report.id)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                      title="View submission versions & previous comments"
                    >
                      <History className="h-3.5 w-3.5 text-slate-500" />
                      <span>v{report.currentVersion} History</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenReportDetail(report.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Inspect</span>
                    </button>

                    {report.status === 'Submitted' && (
                      <button
                        type="button"
                        onClick={() => handleOpenReview(report.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        <span>Review</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Report Highlights Snapshot */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Deliverables Completed
                    </span>
                    <p className="font-bold text-slate-900">
                      {report.tasksCompleted?.length || 0} tasks ({totalHours} hrs)
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {report.tasksCompleted?.[0]?.taskName || 'No task title'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Blockers & Challenges
                    </span>
                    <p
                      className={`font-bold ${
                        (report.blockers?.length || 0) > 0 ? 'text-amber-700' : 'text-slate-900'
                      }`}
                    >
                      {report.blockers?.length || 0} active issue(s)
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {report.blockers?.[0]?.description || 'None reported'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Key Highlights
                    </span>
                    <p className="font-bold text-emerald-700">
                      {report.achievements?.length || 0} achievement(s)
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {report.achievements?.[0]?.description || 'None reported'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Action Modal */}
      {selectedReport && (
        <ReviewActionModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          reportId={selectedReport.id}
          reportAuthor={selectedReport.userName}
          weekLabel={selectedReport.weekLabel}
          onApprove={handleApprove}
          onRequestChanges={handleRequestChanges}
        />
      )}

      {/* Version History Modal */}
      {versionReport && (
        <VersionHistoryViewer
          isOpen={!!versionHistoryReportId}
          onClose={() => setVersionHistoryReportId(null)}
          report={versionReport}
        />
      )}
    </div>
  );
};
