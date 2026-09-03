import React, { useState } from 'react';
import type { WeeklyReport } from '../../types';
import { AlertTriangle, Award, Flag, Star } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface SideBySideComparisonProps {
  reports: WeeklyReport[];
  selectedWeek: string;
}

export const SideBySideComparison: React.FC<SideBySideComparisonProps> = ({
  reports,
  selectedWeek,
}) => {
  const [section, setSection] = useState<'blockers' | 'achievements'>('blockers');

  const weekReports = reports.filter((r) => r.weekLabel === selectedWeek);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      {/* Header with Section Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cross-Team Section Comparison
            </h4>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Bonus Feature
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Compare all contributors' key challenges or highlights for {selectedWeek}
          </p>
        </div>

        {/* Section Toggle Pill */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setSection('blockers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              section === 'blockers'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle
              className={`h-3.5 w-3.5 ${section === 'blockers' ? 'text-amber-600' : 'text-slate-400'}`}
            />
            <span>Blockers & Impediments</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('achievements')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              section === 'achievements'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award
              className={`h-3.5 w-3.5 ${
                section === 'achievements' ? 'text-emerald-600' : 'text-slate-400'
              }`}
            />
            <span>Achievements & Wins</span>
          </button>
        </div>
      </div>

      {/* Grid of Team Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {weekReports.map((report) => {
          const items = section === 'blockers' ? report.blockers : report.achievements;
          return (
            <div
              key={report.id}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2 mb-2">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{report.userName}</h5>
                    <p className="text-[10px] text-slate-500">{report.projectName}</p>
                  </div>
                  <StatusBadge status={report.status} size="sm" />
                </div>

                {items && items.length > 0 ? (
                  <div className="space-y-2">
                    {section === 'blockers'
                      ? report.blockers.map((b) => (
                          <div
                            key={b.id}
                            className={`p-2.5 rounded-lg text-xs border ${
                              b.isKeyIssue
                                ? 'bg-amber-50/80 border-amber-300 text-amber-900 ring-1 ring-amber-300'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-start gap-1.5">
                              {b.isKeyIssue && (
                                <Flag className="h-3.5 w-3.5 text-amber-600 fill-amber-600 shrink-0 mt-0.5" />
                              )}
                              <p className="leading-relaxed">{b.description}</p>
                            </div>
                            {b.isKeyIssue && (
                              <span className="mt-1 inline-block text-[10px] font-bold text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded">
                                Key Blocker of Week
                              </span>
                            )}
                          </div>
                        ))
                      : report.achievements.map((a) => (
                          <div
                            key={a.id}
                            className={`p-2.5 rounded-lg text-xs border ${
                              a.isKeyAchievement
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 ring-1 ring-emerald-300'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-start gap-1.5">
                              {a.isKeyAchievement && (
                                <Star className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600 shrink-0 mt-0.5" />
                              )}
                              <p className="leading-relaxed">{a.description}</p>
                            </div>
                            {a.isKeyAchievement && (
                              <span className="mt-1 inline-block text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                                Key Win of Week
                              </span>
                            )}
                          </div>
                        ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    {section === 'blockers'
                      ? 'No blockers reported'
                      : 'No specific highlights logged'}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-500">
                <span>{report.tasksCompleted?.length || 0} tasks done</span>
                <span>
                  {(report.hoursWorked?.development || 0) + (report.hoursWorked?.testing || 0)} dev/QA hrs
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
