import React, { useState } from 'react';
import type {
  WeeklyReport,
  CompletedTask,
  PlannedTask,
  BlockerItem,
  AchievementItem,
  HoursWorkedBreakdown,
  PriorityLevel,
} from '../../types';
import { useReports } from '../../context/ReportContext';
import { TaskTable } from './TaskTable';
import { HoursBreakdown } from './HoursBreakdown';
import {
  Save,
  Send,
  AlertTriangle,
  Award,
  Plus,
  Trash2,
  Star,
  Flag,
  Calendar,
  Folder,
  Link2,
  FileText,
  ListTodo,
} from 'lucide-react';
import type { ReportFormProps } from '../../props';

export const ReportForm: React.FC<ReportFormProps> = ({
  initialReport,
  onSaveDraft,
  onSubmit,
  isSubmitting = false,
}) => {
  const { projects, selectedWeek } = useReports();

  // Fixed fields according to Section 2:
  const [weekLabel, setWeekLabel] = useState(initialReport?.weekLabel || selectedWeek);
  const [weekStartDate, setWeekStartDate] = useState(initialReport?.weekStartDate || '2026-08-31');
  const [weekEndDate, setWeekEndDate] = useState(initialReport?.weekEndDate || '2026-09-06');
  const [projectId, setProjectId] = useState(
    initialReport?.projectId || (projects[0] ? projects[0].id : '')
  );

  // 1. Tasks completed table
  const [tasksCompleted, setTasksCompleted] = useState<CompletedTask[]>(
    initialReport?.tasksCompleted && initialReport.tasksCompleted.length > 0
      ? initialReport.tasksCompleted
      : [
          {
            id: 'task-init-1',
            taskName: '',
            priority: 'Medium',
            plannedPercent: 100,
            actualPercent: 100,
            status: 'Completed',
            plannedHours: 6,
            spentHours: 6,
            outputDeliverable: '',
          },
        ]
  );

  // 2. Tasks planned for next week
  const [tasksPlanned, setTasksPlanned] = useState<PlannedTask[]>(
    initialReport?.tasksPlannedNextWeek && initialReport.tasksPlannedNextWeek.length > 0
      ? initialReport.tasksPlannedNextWeek
      : [
          {
            id: 'plan-init-1',
            taskName: '',
            priority: 'Medium',
            estimatedHours: 8,
          },
        ]
  );

  // 3. Blockers / Challenges (with key issue flag)
  const [blockers, setBlockers] = useState<BlockerItem[]>(
    initialReport?.blockers || []
  );

  // 4. Achievements / Highlights (with key achievement flag)
  const [achievements, setAchievements] = useState<AchievementItem[]>(
    initialReport?.achievements || []
  );

  // 5. Hours worked breakdown
  const [hoursWorked, setHoursWorked] = useState<HoursWorkedBreakdown>(
    initialReport?.hoursWorked || {
      development: 20,
      testing: 5,
      meetings: 5,
      documentation: 3,
    }
  );

  // 6. Optional notes or links
  const [notesOrLinks, setNotesOrLinks] = useState(initialReport?.notesOrLinks || '');

  // Validation state
  const [validationError, setValidationError] = useState('');

  // Next week task actions
  const addPlannedTask = () => {
    setTasksPlanned([
      ...tasksPlanned,
      {
        id: `plan-${Date.now()}`,
        taskName: '',
        priority: 'Medium',
        estimatedHours: 4,
      },
    ]);
  };

  const removePlannedTask = (id: string) => {
    setTasksPlanned(tasksPlanned.filter((t) => t.id !== id));
  };

  const updatePlannedTask = (id: string, updates: Partial<PlannedTask>) => {
    setTasksPlanned(tasksPlanned.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  // Blocker actions
  const addBlocker = () => {
    setBlockers([
      ...blockers,
      {
        id: `blocker-${Date.now()}`,
        description: '',
        isKeyIssue: blockers.length === 0, // default first one to key issue
      },
    ]);
  };

  const removeBlocker = (id: string) => {
    setBlockers(blockers.filter((b) => b.id !== id));
  };

  const updateBlocker = (id: string, updates: Partial<BlockerItem>) => {
    if (updates.isKeyIssue) {
      // Only one blocker can be flagged as key issue
      setBlockers(
        blockers.map((b) =>
          b.id === id ? { ...b, ...updates, isKeyIssue: true } : { ...b, isKeyIssue: false }
        )
      );
    } else {
      setBlockers(blockers.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    }
  };

  // Achievement actions
  const addAchievement = () => {
    setAchievements([
      ...achievements,
      {
        id: `achieve-${Date.now()}`,
        description: '',
        isKeyAchievement: achievements.length === 0,
      },
    ]);
  };

  const removeAchievement = (id: string) => {
    setAchievements(achievements.filter((a) => a.id !== id));
  };

  const updateAchievement = (id: string, updates: Partial<AchievementItem>) => {
    if (updates.isKeyAchievement) {
      // Only one achievement can be flagged as key achievement
      setAchievements(
        achievements.map((a) =>
          a.id === id ? { ...a, ...updates, isKeyAchievement: true } : { ...a, isKeyAchievement: false }
        )
      );
    } else {
      setAchievements(achievements.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    }
  };

  const gatherReportData = (): Partial<WeeklyReport> => ({
    id: initialReport?.id,
    weekLabel,
    weekStartDate,
    weekEndDate,
    projectId,
    tasksCompleted: tasksCompleted.filter((t) => t.taskName.trim().length > 0),
    tasksPlannedNextWeek: tasksPlanned.filter((t) => t.taskName.trim().length > 0),
    blockers: blockers.filter((b) => b.description.trim().length > 0),
    achievements: achievements.filter((a) => a.description.trim().length > 0),
    hoursWorked,
    notesOrLinks,
  });

  const handleSaveDraft = () => {
    onSaveDraft(gatherReportData());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const validTasks = tasksCompleted.filter((t) => t.taskName.trim().length > 0);
    if (validTasks.length === 0) {
      setValidationError('Please enter at least one completed task before submitting.');
      return;
    }

    onSubmit(gatherReportData());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Needs Correction Feedback Banner (Section 3 Requirement) */}
      {initialReport?.status === 'Needs Correction' && initialReport.latestManagerComment && (
        <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50 shadow-xs space-y-1.5 animate-pulse-once">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>Manager Requested Corrections on this Report:</span>
          </div>
          <p className="text-xs text-amber-800 font-medium pl-7 leading-relaxed">
            "{initialReport.latestManagerComment}"
          </p>
          <p className="text-[11px] text-amber-700 pl-7">
            Please make the necessary edits below and click <strong>Resubmit for Manager Review</strong>.
          </p>
        </div>
      )}

      {/* Header Controls: Week Range & Project Selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Standardized Weekly Report Form
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fixed structure identical for all team members
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Save className="h-3.5 w-3.5 text-slate-500" />
              Save Draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              {initialReport?.status === 'Needs Correction' ? 'Resubmit Report' : 'Submit for Review'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Week Label */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" /> Week / Date Range
            </label>
            <input
              type="text"
              value={weekLabel}
              onChange={(e) => setWeekLabel(e.target.value)}
              placeholder="e.g. Week 36 (Aug 31 - Sep 06, 2026)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Project or Category Tag */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Folder className="h-3.5 w-3.5 text-slate-400" /> Project / Category Tag
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:ring-1 focus:ring-indigo-500"
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Date range helpers */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500">Start Date</label>
              <input
                type="date"
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500">End Date</label>
              <input
                type="date"
                value={weekEndDate}
                onChange={(e) => setWeekEndDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Tasks Completed (Task-level Table) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Tasks Completed This Week
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">
            {tasksCompleted.length} task row(s) entered
          </span>
        </div>
        <TaskTable tasks={tasksCompleted} onChange={setTasksCompleted} />
      </div>

      {/* Section 2: Tasks Planned for Next Week */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Tasks Planned for Next Week
            </h4>
          </div>
          <button
            type="button"
            onClick={addPlannedTask}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
          >
            <Plus className="h-3 w-3" /> Add Planned Task
          </button>
        </div>

        <div className="space-y-2">
          {tasksPlanned.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No planned tasks added yet.</p>
          ) : (
            tasksPlanned.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
              >
                <input
                  type="text"
                  placeholder="Task title or milestone for next week..."
                  value={task.taskName}
                  onChange={(e) => updatePlannedTask(task.id, { taskName: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:ring-1 focus:ring-indigo-500"
                />
                <select
                  value={task.priority}
                  onChange={(e) =>
                    updatePlannedTask(task.id, { priority: e.target.value as PriorityLevel })
                  }
                  className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs w-28"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Est."
                    value={task.estimatedHours}
                    onChange={(e) =>
                      updatePlannedTask(task.id, { estimatedHours: Number(e.target.value) })
                    }
                    className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-center font-medium"
                  />
                  <span className="text-[11px] text-slate-500">hrs</span>
                </div>
                <button
                  type="button"
                  onClick={() => removePlannedTask(task.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section 3: Blockers / Challenges & Achievements side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blockers / Challenges */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Blockers & Challenges
              </h4>
            </div>
            <button
              type="button"
              onClick={addBlocker}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
            >
              <Plus className="h-3 w-3" /> Add Blocker
            </button>
          </div>

          <div className="space-y-2.5">
            {blockers.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No active blockers or impediments reported.
              </p>
            ) : (
              blockers.map((b) => (
                <div
                  key={b.id}
                  className={`p-3 rounded-xl border transition-all ${
                    b.isKeyIssue
                      ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-400'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <textarea
                      rows={2}
                      placeholder="Describe the impediment or delay..."
                      value={b.description}
                      onChange={(e) => updateBlocker(b.id, { description: e.target.value })}
                      className="flex-1 p-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeBlocker(b.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={b.isKeyIssue}
                        onChange={(e) => updateBlocker(b.id, { isKeyIssue: e.target.checked })}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <Flag
                        className={`h-3.5 w-3.5 ${
                          b.isKeyIssue ? 'text-amber-600 fill-amber-600' : 'text-slate-400'
                        }`}
                      />
                      <span className={b.isKeyIssue ? 'font-bold text-amber-900' : 'font-normal'}>
                        Flag as Key Issue for the Week
                      </span>
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Achievements / Highlights */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                4. Achievements & Highlights
              </h4>
            </div>
            <button
              type="button"
              onClick={addAchievement}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
            >
              <Plus className="h-3 w-3" /> Add Highlight
            </button>
          </div>

          <div className="space-y-2.5">
            {achievements.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No key achievements entered yet.
              </p>
            ) : (
              achievements.map((a) => (
                <div
                  key={a.id}
                  className={`p-3 rounded-xl border transition-all ${
                    a.isKeyAchievement
                      ? 'border-emerald-400 bg-emerald-50/60 ring-1 ring-emerald-400'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <textarea
                      rows={2}
                      placeholder="Major win, performance improvement, or launch..."
                      value={a.description}
                      onChange={(e) => updateAchievement(a.id, { description: e.target.value })}
                      className="flex-1 p-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeAchievement(a.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={a.isKeyAchievement}
                        onChange={(e) =>
                          updateAchievement(a.id, { isKeyAchievement: e.target.checked })
                        }
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <Star
                        className={`h-3.5 w-3.5 ${
                          a.isKeyAchievement ? 'text-emerald-600 fill-emerald-600' : 'text-slate-400'
                        }`}
                      />
                      <span
                        className={
                          a.isKeyAchievement ? 'font-bold text-emerald-900' : 'font-normal'
                        }
                      >
                        Flag as Key Achievement for the Week
                      </span>
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Hours Worked Breakdown */}
      <HoursBreakdown hours={hoursWorked} onChange={setHoursWorked} />

      {/* Section 5: Optional Notes or Links */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Link2 className="h-4 w-4 text-slate-400" />
          5. Optional Notes or Links
        </label>
        <textarea
          rows={3}
          placeholder="Include any PR links, Figma links, Loom videos, or general notes for the reviewer..."
          value={notesOrLinks}
          onChange={(e) => setNotesOrLinks(e.target.value)}
          className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Error display */}
      {validationError && (
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Bottom Submission Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
        >
          Save as Draft
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-100 flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {initialReport?.status === 'Needs Correction'
            ? 'Resubmit Report for Review'
            : 'Submit Report for Manager Review'}
        </button>
      </div>
    </form>
  );
};
