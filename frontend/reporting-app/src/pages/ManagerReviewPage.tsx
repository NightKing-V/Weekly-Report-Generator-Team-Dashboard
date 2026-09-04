import React, { useState, useEffect } from 'react';
import { useReports } from '../context/ReportContext';
import { apiClient } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { ReviewActionModal } from '../components/reports/ReviewActionModal';
import { VersionHistoryViewer } from '../components/reports/VersionHistoryViewer';
import { Pagination } from '../components/common/Pagination';
import type { WeeklyReport } from '../types';
import {
  ClipboardCheck,
  CheckCircle2,
  History,
  Eye,
  Search,
  Loader2,
} from 'lucide-react';

import type { ManagerReviewPageProps } from '../props';
import { useFetch } from '../hooks/useFetch';

export const ManagerReviewPage: React.FC<ManagerReviewPageProps> = ({ onOpenReportDetail }) => {
  const { approveReport, requestChanges } = useReports();
  const { execute } = useFetch();

  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [versionHistoryReportId, setVersionHistoryReportId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [pendingPage, setPendingPage] = useState(1);
  const [reviewedPage, setReviewedPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [reviewedCount, setReviewedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const currentPage = activeTab === 'pending' ? pendingPage : reviewedPage;
  const setCurrentPage = activeTab === 'pending' ? setPendingPage : setReviewedPage;

  useEffect(() => {
    let isCancelled = false;
    const loadData = async () => {
      setLoading(true);
      try {
        const statusParam = activeTab === 'pending' ? 'Submitted' : 'Approved,Needs Correction';
        const page = activeTab === 'pending' ? pendingPage : reviewedPage;

        const [listRes, pendingRes, reviewedRes] = await Promise.all([
          apiClient.reports.getPaginated({
            status: statusParam,
            search: searchQuery.trim() || undefined,
            page,
            pageSize,
          }),
          apiClient.reports.getPaginated({ status: 'Submitted', pageSize: 1 }),
          apiClient.reports.getPaginated({ status: 'Approved,Needs Correction', pageSize: 1 }),
        ]);

        if (!isCancelled) {
          setReports(listRes.items);
          setTotalItems(listRes.total);
          setTotalPages(listRes.totalPages || 1);
          setPendingCount(pendingRes.total);
          setReviewedCount(reviewedRes.total);
        }
      } catch (err) {
        console.error('Failed to load manager review reports:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    loadData();
    return () => {
      isCancelled = true;
    };
  }, [activeTab, pendingPage, reviewedPage, pageSize, searchQuery, refreshTrigger]);

  const handleApprove = async (id: string, comment?: string) => {
    await execute(
      async () => approveReport(id, comment),
      {
        showSuccessSnackbar: true,
        successMessage: 'Report successfully approved!',
      }
    );
    setRefreshTrigger((t) => t + 1);
  };

  const handleRequestChanges = async (id: string, comment: string) => {
    await execute(
      async () => requestChanges(id, comment),
      {
        showSuccessSnackbar: true,
        successMessage: 'Feedback and correction request dispatched.',
      }
    );
    setRefreshTrigger((t) => t + 1);
  };

  const validPage = Math.min(currentPage, totalPages);

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

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Submissions */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPendingPage(1);
                setReviewedPage(1);
              }}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 w-44 sm:w-52"
            />
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
                  pendingCount > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {pendingCount}
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
                {reviewedCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Fetching submission queue...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">
              {activeTab === 'pending' ? 'All caught up!' : 'No reviewed reports'}
            </h3>
            <p className="text-xs text-slate-500">
              {activeTab === 'pending'
                ? 'There are no submitted reports matching your search waiting for manager review.'
                : 'No reviewed reports match the selected criteria.'}
            </p>
          </div>
        ) : (
          <>
            {reports.map((report) => {
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
                        {(report.userName || 'U').charAt(0)}
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
            })}

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
              pageSizeOptions={[5, 10, 20]}
            />
          </>
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
