import React from 'react';
import type { ActivityFeedItem } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';
import { CheckCircle2, Send, AlertCircle, Clock } from 'lucide-react';

import type { ActivityFeedProps } from '../../props';

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, onSelectReport }) => {
  const getIcon = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'correction_requested':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case 'submitted':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'draft_saved':
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getBadgeClass = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'correction_requested':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Live Activity Feed
          </h4>
          <p className="text-[11px] text-slate-500">Submissions, reviews & status changes</p>
        </div>
        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
          {activities.length} events
        </span>
      </div>

      <div className="space-y-3">
        {activities.map((act) => (
          <div
            key={act.id}
            onClick={() => onSelectReport && onSelectReport(act.reportId)}
            className={`flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all ${
              onSelectReport ? 'cursor-pointer' : ''
            }`}
          >
            <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">{getIcon(act.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {act.actorName}
                </span>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {formatRelativeTime(act.timestamp)}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{act.message}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded border capitalize ${getBadgeClass(
                    act.type
                  )}`}
                >
                  {act.type.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400">{act.weekLabel}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
