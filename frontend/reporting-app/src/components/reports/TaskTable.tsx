import React from 'react';
import type { CompletedTask, PriorityLevel, TaskStatus } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import { PriorityBadge } from '../common/PriorityBadge';

interface TaskTableProps {
  tasks: CompletedTask[];
  onChange: (tasks: CompletedTask[]) => void;
  readOnly?: boolean;
}

export const TaskTable: React.FC<TaskTableProps> = ({ tasks, onChange, readOnly = false }) => {
  const addTaskRow = () => {
    const newTask: CompletedTask = {
      id: `task-${Date.now()}`,
      taskName: '',
      priority: 'Medium',
      plannedPercent: 100,
      actualPercent: 100,
      status: 'Completed',
      plannedHours: 4,
      spentHours: 4,
      outputDeliverable: '',
    };
    onChange([...tasks, newTask]);
  };

  const removeTaskRow = (id: string) => {
    onChange(tasks.filter((t) => t.id !== id));
  };

  const updateTask = (id: string, updates: Partial<CompletedTask>) => {
    onChange(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-3 min-w-[200px]">Task Name</th>
              <th className="py-3 px-3 w-28">Priority</th>
              <th className="py-3 px-3 w-32">Planned vs Actual %</th>
              <th className="py-3 px-3 w-32">Status</th>
              <th className="py-3 px-3 w-32">Hours (Plan / Spent)</th>
              <th className="py-3 px-3 min-w-[180px]">Output / Deliverable</th>
              {!readOnly && <th className="py-3 px-3 w-12 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={readOnly ? 6 : 7}
                  className="py-8 text-center text-slate-400 italic text-xs"
                >
                  No completed tasks entered yet. Click "Add Task Row" below.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Task Name */}
                  <td className="py-2.5 px-3">
                    {readOnly ? (
                      <span className="font-medium text-slate-900">{task.taskName}</span>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. Implement user dashboard table"
                        value={task.taskName}
                        onChange={(e) => updateTask(task.id, { taskName: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    )}
                  </td>

                  {/* Priority */}
                  <td className="py-2.5 px-3">
                    {readOnly ? (
                      <PriorityBadge priority={task.priority} />
                    ) : (
                      <select
                        value={task.priority}
                        onChange={(e) =>
                          updateTask(task.id, { priority: e.target.value as PriorityLevel })
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    )}
                  </td>

                  {/* Planned % vs Actual % */}
                  <td className="py-2.5 px-3">
                    {readOnly ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{task.actualPercent}%</span>
                        <span className="text-slate-400 text-[11px]">(plan: {task.plannedPercent}%)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={task.plannedPercent}
                          onChange={(e) =>
                            updateTask(task.id, { plannedPercent: Number(e.target.value) })
                          }
                          title="Planned %"
                          className="w-12 px-1.5 py-1 rounded border border-slate-200 text-center text-xs"
                        />
                        <span className="text-slate-400">/</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={task.actualPercent}
                          onChange={(e) =>
                            updateTask(task.id, { actualPercent: Number(e.target.value) })
                          }
                          title="Actual %"
                          className="w-12 px-1.5 py-1 rounded border border-slate-200 text-center text-xs font-semibold text-indigo-700"
                        />
                        <span className="text-slate-400 text-[10px]">%</span>
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3">
                    {readOnly ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          task.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : task.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {task.status}
                      </span>
                    ) : (
                      <select
                        value={task.status}
                        onChange={(e) =>
                          updateTask(task.id, { status: e.target.value as TaskStatus })
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Completed">Completed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    )}
                  </td>

                  {/* Time Planned vs Spent */}
                  <td className="py-2.5 px-3">
                    {readOnly ? (
                      <span className="text-slate-700 font-medium">
                        {task.spentHours}h{' '}
                        <span className="text-slate-400 text-[11px]">(est. {task.plannedHours}h)</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={task.plannedHours}
                          onChange={(e) =>
                            updateTask(task.id, { plannedHours: Number(e.target.value) })
                          }
                          title="Planned Hours"
                          placeholder="Plan"
                          className="w-12 px-1.5 py-1 rounded border border-slate-200 text-center text-xs"
                        />
                        <span className="text-slate-400">/</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={task.spentHours}
                          onChange={(e) =>
                            updateTask(task.id, { spentHours: Number(e.target.value) })
                          }
                          title="Spent Hours"
                          placeholder="Spent"
                          className="w-12 px-1.5 py-1 rounded border border-slate-200 text-center text-xs font-semibold text-slate-900"
                        />
                        <span className="text-slate-400 text-[10px]">hrs</span>
                      </div>
                    )}
                  </td>

                  {/* Output / Deliverable */}
                  <td className="py-2.5 px-3">
                    {readOnly ? (
                      <span className="text-slate-600 truncate block max-w-xs" title={task.outputDeliverable}>
                        {task.outputDeliverable || '—'}
                      </span>
                    ) : (
                      <input
                        type="text"
                        placeholder="PR link, design artifact, or test suite"
                        value={task.outputDeliverable}
                        onChange={(e) =>
                          updateTask(task.id, { outputDeliverable: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    )}
                  </td>

                  {/* Remove Row Action */}
                  {!readOnly && (
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeTaskRow(task.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove task row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={addTaskRow}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Task Row
        </button>
      )}
    </div>
  );
};
