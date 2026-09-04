import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import type { ReviewActionModalProps } from '../../props';

export const ReviewActionModal: React.FC<ReviewActionModalProps> = ({
  isOpen,
  onClose,
  reportId,
  reportAuthor,
  weekLabel,
  initialAction = 'approve',
  onApprove,
  onRequestChanges,
}) => {
  const [prevOpen, setPrevOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'request_changes'>(initialAction);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setAction(initialAction);
      setComment('');
      setError('');
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (action === 'request_changes') {
      if (!comment.trim()) {
        setError('Please provide a comment explaining what needs correction.');
        return;
      }
      onRequestChanges(reportId, comment.trim());
    } else {
      onApprove(reportId, comment.trim() || undefined);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Weekly Report"
      subtitle={`Reviewing ${reportAuthor}'s report for ${weekLabel}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Action Toggle */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setAction('approve');
              setError('');
            }}
            className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-center transition-all ${
              action === 'approve'
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            }`}
          >
            <CheckCircle2
              className={`h-6 w-6 ${action === 'approve' ? 'text-emerald-600' : 'text-slate-400'}`}
            />
            <div>
              <p className="text-xs font-bold">Approve Report</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Satisfied with submission</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setAction('request_changes');
              setError('');
            }}
            className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-center transition-all ${
              action === 'request_changes'
                ? 'border-amber-500 bg-amber-50/50 text-amber-900 ring-2 ring-amber-500/20'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            }`}
          >
            <AlertCircle
              className={`h-6 w-6 ${
                action === 'request_changes' ? 'text-amber-600' : 'text-slate-400'
              }`}
            />
            <div>
              <p className="text-xs font-bold">Request Changes</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Send back for correction</p>
            </div>
          </button>
        </div>

        {/* Comment field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {action === 'request_changes' ? 'Required Correction Feedback:' : 'Optional Note / Kudos:'}
              </span>
            </label>
            {action === 'request_changes' && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                Required
              </span>
            )}
          </div>
          <textarea
            rows={3}
            placeholder={
              action === 'request_changes'
                ? 'Explain clearly what the team member needs to update or clarify before approval...'
                : 'Great work this week! Approved.'
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        </div>

        {/* Impact explanation alert */}
        <div
          className={`p-3 rounded-xl text-xs ${
            action === 'approve'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {action === 'approve' ? (
            <p>
              This report will be marked as <strong>Approved</strong>. The team member will receive
              approval confirmation and no further changes will be required.
            </p>
          ) : (
            <p>
              The status will become <strong>Needs Correction</strong>. The team member will see your
              comment prominently on their page and be able to edit and resubmit their report.
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs ${
              action === 'approve'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {action === 'approve' ? 'Confirm Approval' : 'Send for Correction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
