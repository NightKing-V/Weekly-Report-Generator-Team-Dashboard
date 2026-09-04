import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../context/ReportContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { TaskTable } from '../components/reports/TaskTable';
import { HoursBreakdown } from '../components/reports/HoursBreakdown';
import { VersionHistoryViewer } from '../components/reports/VersionHistoryViewer';
import { ReviewActionModal } from '../components/reports/ReviewActionModal';
import { formatDate } from '../utils/formatters';
import { apiClient } from '../services/api';
import type { WeeklyReport } from '../types';
import {
  ArrowLeft,
  Calendar,
  Folder,
  History,
  CheckCircle2,
  AlertTriangle,
  Award,
  Link2,
  User as UserIcon,
  MessageSquare,
  ShieldCheck,
  Flag,
  Star,
  Loader2,
} from 'lucide-react';

import type { ReportDetailPageProps } from '../props';
import { useFetch } from '../hooks/useFetch';

export const ReportDetailPage: React.FC<ReportDetailPageProps> = ({
  reportId,
  onBack,
  onEditReport,
}) => {
  const { currentUser } = useAuth();
  const { getReportById, approveReport, requestChanges } = useReports();
  const { execute } = useFetch();

  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewActionType, setReviewActionType] = useState<'approve' | 'request_changes'>('approve');

  const storeReport = getReportById(reportId);
  const [report, setReport] = useState<WeeklyReport | null>(storeReport || null);
  const [loading, setLoading] = useState<boolean>(!storeReport);

  useEffect(() => {
    let isMounted = true;
    const fetchReport = async () => {
      try {
        const data = await apiClient.reports.getById(reportId);
        if (isMounted) {
          setReport(data);
        }
      } catch (err) {
        console.error('Failed to fetch report details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchReport();
    return () => {
      isMounted = false;
    };
  }, [reportId]);

  const handleApprove = async (id: string, comment?: string) => {
    await execute(
      async () => {
        const updated = await approveReport(id, comment);
        setReport(updated);
        return updated;
      },
      {
        showSuccessSnackbar: true,
        successMessage: 'Report successfully approved!',
      }
    );
  };

  const handleRequestChanges = async (id: string, comment: string) => {
    await execute(
      async () => {
        const updated = await requestChanges(id, comment);
        setReport(updated);
        return updated;
      },
      {
        showSuccessSnackbar: true,
        successMessage: 'Revisions requested and sent to contributor.',
      }
    );
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-600">Loading report details...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-700">Report not found</p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>
    );
  }

  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';
  const isAuthor = currentUser?.id === report.userId;
  const canEdit = isAuthor && (report.status === 'Draft' || report.status === 'Needs Correction');
  const canReview = isManager && report.status === 'Submitted';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to List
        </button>

        <div className="flex items-center gap-2">
          {/* Version History Button (Core Section 3 requirement) */}
          <button
            type="button"
            onClick={() => setIsVersionModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
            <span>Version History (v{report.currentVersion})</span>
          </button>

          {canEdit && onEditReport && (
            <button
              type="button"
              onClick={() => onEditReport(report.id)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              Edit & Resubmit
            </button>
          )}

          {canReview && (
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Take Review Action
            </button>
          )}
        </div>
      </div>

      {/* Header Info Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900">{report.weekLabel}</h2>
              <StatusBadge status={report.status} size="lg" />
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <UserIcon className="h-3.5 w-3.5" />
                <strong className="text-slate-700">{report.userName}</strong> ({report.userTitle})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Folder className="h-3.5 w-3.5" />
                <span>{report.projectName}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Submitted: {report.submittedAt ? formatDate(report.submittedAt) : 'Not submitted'}
                </span>
              </span>
            </div>
          </div>

          {canReview && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setReviewActionType('approve');
                  setIsReviewModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => {
                  setReviewActionType('request_changes');
                  setIsReviewModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
              >
                Request Correction
              </button>
            </div>
          )}
        </div>

        {/* Manager Correction Banner if in Needs Correction */}
        {report.status === 'Needs Correction' && report.latestManagerComment && (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>Manager Feedback Requiring Attention:</span>
            </div>
            <p className="text-xs text-amber-900 pl-6 leading-relaxed italic">
              "{report.latestManagerComment}"
            </p>
          </div>
        )}
      </div>

      {/* Section 1: Tasks Completed Table (Read-Only) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          1. Tasks Completed ({report.tasksCompleted?.length || 0})
        </h4>
        <TaskTable tasks={report.tasksCompleted} onChange={() => { }} readOnly={true} />
      </div>

      {/* Section 2: Tasks Planned for Next Week */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          2. Tasks Planned for Next Week ({report.tasksPlannedNextWeek?.length || 0})
        </h4>
        <div className="space-y-2">
          {report.tasksPlannedNextWeek && report.tasksPlannedNextWeek.length > 0 ? (
            report.tasksPlannedNextWeek.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-900">{t.taskName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-semibold">{t.priority} Priority</span>
                </div>
                <span className="text-slate-700 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {t.estimatedHours} hrs est.
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No tasks planned for next week.</p>
          )}
        </div>
      </div>

      {/* Section 3 & 4: Blockers & Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blockers */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Blockers & Challenges
            </h4>
          </div>
          <div className="space-y-2">
            {report.blockers && report.blockers.length > 0 ? (
              report.blockers.map((b) => (
                <div
                  key={b.id}
                  className={`p-3 rounded-xl border text-xs ${b.isKeyIssue
                    ? 'border-amber-400 bg-amber-50/80 text-amber-900 ring-1 ring-amber-300'
                    : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                >
                  <div className="flex items-start gap-2">
                    {b.isKeyIssue && (
                      <Flag className="h-3.5 w-3.5 text-amber-600 fill-amber-600 shrink-0 mt-0.5" />
                    )}
                    <p className="leading-relaxed">{b.description}</p>
                  </div>
                  {b.isKeyIssue && (
                    <span className="mt-1.5 inline-block text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      Key Blocker of the Week
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No blockers logged.</p>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              4. Achievements & Highlights
            </h4>
          </div>
          <div className="space-y-2">
            {report.achievements && report.achievements.length > 0 ? (
              report.achievements.map((a) => (
                <div
                  key={a.id}
                  className={`p-3 rounded-xl border text-xs ${a.isKeyAchievement
                    ? 'border-emerald-400 bg-emerald-50/80 text-emerald-900 ring-1 ring-emerald-300'
                    : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                >
                  <div className="flex items-start gap-2">
                    {a.isKeyAchievement && (
                      <Star className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <p className="leading-relaxed">{a.description}</p>
                  </div>
                  {a.isKeyAchievement && (
                    <span className="mt-1.5 inline-block text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Key Highlight of the Week
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No key highlights logged.</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 5: Hours Breakdown */}
      <HoursBreakdown hours={report.hoursWorked} onChange={() => { }} readOnly={true} />

      {/* Section 6: Notes or Links */}
      {report.notesOrLinks && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Link2 className="h-4 w-4 text-slate-400" />
            6. Notes & Resource Links
          </h4>
          <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
            {report.notesOrLinks}
          </p>
        </div>
      )}

      {/* Review Comments Audit Trail (Section 3 Bonus) */}
      {report.reviewHistory && report.reviewHistory.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-indigo-600" />
            Review Comments & Approval Log
          </h4>
          <div className="space-y-2.5">
            {report.reviewHistory.map((rev) => (
              <div
                key={rev.id}
                className={`p-3 rounded-xl border text-xs space-y-1 ${rev.action === 'approve'
                  ? 'border-emerald-200 bg-emerald-50/50 text-emerald-950'
                  : 'border-amber-200 bg-amber-50/50 text-amber-950'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    {rev.action === 'approve' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    )}
                    {rev.authorName} ({rev.authorRole}) — Version {rev.versionNumber}
                  </span>
                  <span className="text-[11px] text-slate-500">{formatDate(rev.createdAt)}</span>
                </div>
                <p className="italic pl-5">"{rev.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Version History Modal */}
      <VersionHistoryViewer
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        report={report}
      />

      {/* Manager Review Modal */}
      <ReviewActionModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        reportId={report.id}
        reportAuthor={report.userName}
        weekLabel={report.weekLabel}
        initialAction={reviewActionType}
        onApprove={handleApprove}
        onRequestChanges={handleRequestChanges}
      />
    </div>
  );
};
