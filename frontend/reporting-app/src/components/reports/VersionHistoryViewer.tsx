import React, { useState } from 'react';
import type { WeeklyReport } from '../../types';
import { Modal } from '../common/Modal';
import { History, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

interface VersionHistoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  report: WeeklyReport;
}

export const VersionHistoryViewer: React.FC<VersionHistoryViewerProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [selectedVersionIdx, setSelectedVersionIdx] = useState<number>(0);

  // Combine current version with archived past versions for a complete timeline
  const allVersions = [
    {
      versionNumber: report.currentVersion,
      label: `Version ${report.currentVersion} (Current)`,
      submittedAt: report.submittedAt || report.updatedAt,
      submittedBy: report.userName,
      isCurrent: true,
      content: {
        tasksCompleted: report.tasksCompleted,
        tasksPlannedNextWeek: report.tasksPlannedNextWeek,
        blockers: report.blockers,
        achievements: report.achievements,
        hoursWorked: report.hoursWorked,
        notesOrLinks: report.notesOrLinks,
      },
      reviewComment: report.reviewHistory && report.reviewHistory.length > 0
        ? report.reviewHistory[report.reviewHistory.length - 1]
        : undefined,
    },
    ...(report.versions || []).map((v) => ({
      versionNumber: v.versionNumber,
      label: `Version ${v.versionNumber}`,
      submittedAt: v.submittedAt,
      submittedBy: v.submittedBy,
      isCurrent: false,
      content: v.content,
      reviewComment: v.reviewComment,
    })),
  ];

  const activeVersion = allVersions[selectedVersionIdx] || allVersions[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Report Version History — ${report.userName}`}
      subtitle={`${report.weekLabel} • Total versions: ${allVersions.length}`}
      maxWidth="3xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Version List Sidebar */}
        <div className="md:col-span-4 space-y-2 border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Submission Timeline
          </p>
          <div className="space-y-1.5">
            {allVersions.map((v, idx) => {
              const isSelected = idx === selectedVersionIdx;
              return (
                <button
                  key={v.versionNumber}
                  type="button"
                  onClick={() => setSelectedVersionIdx(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-indigo-900' : 'text-slate-800'
                      }`}
                    >
                      {v.label}
                    </span>
                    {v.isCurrent && (
                      <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeTime(v.submittedAt)}</span>
                  </div>
                  {v.reviewComment && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      <MessageSquare className="h-2.5 w-2.5" />
                      <span>Has Review Feedback</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Version Snapshot Details */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">{activeVersion.label}</h4>
                <span className="text-xs text-slate-500">
                  Submitted {formatDate(activeVersion.submittedAt)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Author: {activeVersion.submittedBy}</p>
            </div>
            {activeVersion.isCurrent ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Current Version
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-medium">
                <History className="h-3.5 w-3.5" /> Historical Snapshot
              </span>
            )}
          </div>

          {/* Associated Review Comment for this Version */}
          {activeVersion.reviewComment && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-amber-700" />
                  Feedback by {activeVersion.reviewComment.authorName} ({activeVersion.reviewComment.authorRole})
                </span>
                <span className="text-[11px] text-amber-700 font-medium">
                  {formatDate(activeVersion.reviewComment.createdAt)}
                </span>
              </div>
              <p className="text-xs text-amber-900 italic pl-5">
                "{activeVersion.reviewComment.comment}"
              </p>
            </div>
          )}

          {/* Snapshot Content: Completed Tasks */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Completed Tasks Snapshot ({activeVersion.content.tasksCompleted?.length || 0})
            </h5>
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] font-semibold">
                  <tr>
                    <th className="py-2 px-3">Task Name</th>
                    <th className="py-2 px-3">Priority</th>
                    <th className="py-2 px-3">Actual %</th>
                    <th className="py-2 px-3">Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeVersion.content.tasksCompleted && activeVersion.content.tasksCompleted.length > 0 ? (
                    activeVersion.content.tasksCompleted.map((t) => (
                      <tr key={t.id}>
                        <td className="py-2 px-3 font-medium text-slate-900">{t.taskName}</td>
                        <td className="py-2 px-3">{t.priority}</td>
                        <td className="py-2 px-3">{t.actualPercent}%</td>
                        <td className="py-2 px-3">{t.spentHours}h</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-3 px-3 text-center text-slate-400 italic">
                        No tasks recorded in this version.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Snapshot: Blockers & Achievements summary */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="font-semibold text-slate-700 block">Blockers Reported:</span>
              <p className="text-slate-600">
                {activeVersion.content.blockers?.length || 0} issue(s) recorded
              </p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="font-semibold text-slate-700 block">Total Work Hours:</span>
              <p className="text-slate-600 font-bold">
                {(activeVersion.content.hoursWorked?.development || 0) +
                  (activeVersion.content.hoursWorked?.testing || 0) +
                  (activeVersion.content.hoursWorked?.meetings || 0) +
                  (activeVersion.content.hoursWorked?.documentation || 0)}{' '}
                hrs
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
