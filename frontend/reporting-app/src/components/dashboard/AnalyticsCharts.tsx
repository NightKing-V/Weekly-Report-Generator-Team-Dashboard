import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import type { AnalyticsChartsProps } from '../../props';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ reports, projects }) => {
  // 1. Chart Data: Time Spent by Task Type across team
  const timeByType = reports.reduce(
    (acc, r) => {
      acc.development += r.hoursWorked?.development || 0;
      acc.testing += r.hoursWorked?.testing || 0;
      acc.meetings += r.hoursWorked?.meetings || 0;
      acc.documentation += r.hoursWorked?.documentation || 0;
      return acc;
    },
    { development: 0, testing: 0, meetings: 0, documentation: 0 }
  );

  const timeBreakdownData = [
    { name: 'Development', hours: timeByType.development, color: '#3b82f6' },
    { name: 'Testing & QA', hours: timeByType.testing, color: '#10b981' },
    { name: 'Meetings', hours: timeByType.meetings, color: '#8b5cf6' },
    { name: 'Documentation', hours: timeByType.documentation, color: '#f59e0b' },
  ].filter((d) => d.hours > 0);

  // 2. Chart Data: Workload & Task Distribution by Project
  const projectTaskMap: { [key: string]: { name: string; taskCount: number; hours: number } } = {};
  projects.forEach((p) => {
    projectTaskMap[p.id] = { name: p.name, taskCount: 0, hours: 0 };
  });

  reports.forEach((r) => {
    if (!projectTaskMap[r.projectId]) {
      projectTaskMap[r.projectId] = { name: r.projectName, taskCount: 0, hours: 0 };
    }
    const completedTasksCount = r.tasksCompleted?.length || 0;
    const spent = r.tasksCompleted?.reduce((sum, t) => sum + (t.spentHours || 0), 0) || 0;
    projectTaskMap[r.projectId].taskCount += completedTasksCount;
    projectTaskMap[r.projectId].hours += spent;
  });

  const projectDistributionData = Object.values(projectTaskMap).filter((d) => d.taskCount > 0);

  // 3. Chart Data: Report Submission & Review Status by Team Member
  const memberStatusData = reports.map((r) => {
    const totalPlannedHours = r.tasksCompleted?.reduce((sum, t) => sum + (t.plannedHours || 0), 0) || 0;
    const totalSpentHours = r.tasksCompleted?.reduce((sum, t) => sum + (t.spentHours || 0), 0) || 0;
    return {
      name: r.userName.split(' ')[0], // First name for clean axis
      fullName: r.userName,
      status: r.status,
      plannedHours: totalPlannedHours,
      spentHours: totalSpentHours,
      tasksDone: r.tasksCompleted?.filter((t) => t.status === 'Completed').length || 0,
      tasksInProgress: r.tasksCompleted?.filter((t) => t.status === 'In Progress').length || 0,
    };
  });

  // 4. Chart Data: Tasks Trend Over Time (simulated multi-week trend)
  const trendData = [
    { week: 'W33', completed: 14, planned: 16 },
    { week: 'W34', completed: 19, planned: 20 },
    { week: 'W35', completed: 22, planned: 24 },
    { week: 'W36', completed: 26, planned: 25 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Tasks Completed Trend Over Time */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Tasks Completed Trend
            </h4>
            <p className="text-[11px] text-slate-500">Planned vs. Actual completed tasks over time</p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            +18% velocity
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="planned"
                name="Planned Tasks"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="Completed Tasks"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Hours Planned vs Spent by Team Member */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Hours Logged by Member
            </h4>
            <p className="text-[11px] text-slate-500">Planned vs Spent hours per contributor</p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={memberStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="plannedHours" name="Planned (hrs)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spentHours" name="Spent (hrs)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Workload Distribution by Project */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Workload by Project
            </h4>
            <p className="text-[11px] text-slate-500">Total deliverables per category</p>
          </div>
        </div>
        <div className="h-64 w-full flex items-center justify-center">
          {projectDistributionData.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No project data for active week</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="taskCount"
                  nameKey="name"
                >
                  {projectDistributionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: string | number | readonly (string | number)[] | undefined) => [`${val} tasks`, 'Deliverables']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 4: Time Spent by Task Type Team-wide */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Team Time Allocation
            </h4>
            <p className="text-[11px] text-slate-500">Development vs Testing vs Meetings</p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timeBreakdownData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} unit="h" />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={90} />
              <Tooltip
                formatter={(val: string | number | readonly (string | number)[] | undefined) => [`${val} hours`, 'Logged']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="hours" name="Hours" fill="#10b981" radius={[0, 4, 4, 0]}>
                {timeBreakdownData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
