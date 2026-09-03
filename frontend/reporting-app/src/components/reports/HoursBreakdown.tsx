import React from 'react';
import type { HoursWorkedBreakdown } from '../../types';
import { calculateTotalHours } from '../../utils/formatters';
import { Clock } from 'lucide-react';
import type { HoursBreakdownProps } from '../../props';

export const HoursBreakdown: React.FC<HoursBreakdownProps> = ({
  hours,
  onChange,
  readOnly = false,
}) => {
  const total = calculateTotalHours(hours);

  const handleChange = (field: keyof HoursWorkedBreakdown, val: number) => {
    onChange({
      ...hours,
      [field]: Math.max(0, val),
    });
  };

  const fields = [
    { key: 'development' as const, label: 'Development', color: 'bg-blue-500' },
    { key: 'testing' as const, label: 'Testing & QA', color: 'bg-emerald-500' },
    { key: 'meetings' as const, label: 'Meetings & Syncs', color: 'bg-purple-500' },
    { key: 'documentation' as const, label: 'Documentation & Planning', color: 'bg-amber-500' },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Hours Worked Breakdown
          </h4>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
          <span className="text-xs text-slate-500">Total Hours:</span>
          <span className="text-xs font-bold text-slate-900">{total} hrs</span>
        </div>
      </div>

      {/* Visual proportional progress bar */}
      {total > 0 && (
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
          {fields.map(({ key, color }) => {
            const width = total > 0 ? `${((hours[key] || 0) / total) * 100}%` : '0%';
            return (
              <div
                key={key}
                style={{ width }}
                className={`h-full ${color} transition-all`}
                title={`${key}: ${hours[key]}h`}
              />
            );
          })}
        </div>
      )}

      {/* Field inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {fields.map(({ key, label, color }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <label className="text-[11px] font-medium text-slate-600 truncate">{label}</label>
            </div>
            {readOnly ? (
              <p className="text-sm font-semibold text-slate-900 px-1">{hours[key] || 0} hrs</p>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={hours[key] || 0}
                  onChange={(e) => handleChange(key, Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400">hrs</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
