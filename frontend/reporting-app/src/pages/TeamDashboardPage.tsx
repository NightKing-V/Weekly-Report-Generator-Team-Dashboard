import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../context/ReportContext';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { AnalyticsCharts } from '../components/dashboard/AnalyticsCharts';
import { ReportsFilterBar } from '../components/dashboard/ReportsFilterBar';
import { SideBySideComparison } from '../components/dashboard/SideBySideComparison';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { ReviewActionModal } from '../components/reports/ReviewActionModal';
import { formatDate } from '../utils/formatters';
import {
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';

import type { TeamDashboardPageProps } from '../props';
import { useFetch } from '../hooks/useFetch';

export const TeamDashboardPage: React.FC<TeamDashboardPageProps> = ({
  onOpenReportDetail,
  onOpenMemberProfile,
}) => {
  const { users } = useAuth();
  const {
    reports,
    projects,
    activities,
    selectedWeek,
    getDashboardMetrics,
    approveReport,
    requestChanges,
  } = useReports();
  const { execute } = useFetch();

  const handleApprove = async (id: string, comment?: string) => {
    await execute(
      async () => approveReport(id, comment),
      {
        showSuccessSnackbar: true,
        successMessage: 'Report approved successfully!',
      }
    );
  };

  const handleRequestChanges = async (id: string, comment: string) => {
    await execute(
      async () => requestChanges(id, comment),
      {
        showSuccessSnackbar: true,
        successMessage: 'Requested revisions sent to contributor.',
      }
    );
  };

  const metrics = getDashboardMetrics();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Review modal state
  const [reviewReportId, setReviewReportId] = useState<string | null>(null);

  // Active view tab: 'table' vs 'charts' vs 'side-by-side'
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'reports' | 'side-by-side'>('overview');

  // Filtered reports for active week and filters
  const teamMembers = users.filter((u) => u.role === 'team_member');

  const filteredReports = reports.filter((report) => {
    if (report.weekLabel !== selectedWeek) return false;
    if (selectedMemberId !== 'all' && report.userId !== selectedMemberId) return false;
    if (selectedProjectId !== 'all' && report.projectId !== selectedProjectId) return false;
    if (selectedStatus !== 'All' && report.status !== selectedStatus) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = report.userName.toLowerCase().includes(q);
      const matchProject = report.projectName.toLowerCase().includes(q);
      const matchTask = report.tasksCompleted?.some((t) => t.taskName.toLowerCase().includes(q));
      if (!matchName && !matchProject && !matchTask) return false;
    }
    return true;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMemberId('all');
    setSelectedProjectId('all');
    setSelectedStatus('All');
  };

  const selectedReviewReport = reports.find((r) => r.id === reviewReportId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manager Team Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated reports, velocity metrics, and compliance tracking for <strong>{selectedWeek}</strong>.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setDashboardTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              dashboardTab === 'overview'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview & Charts
          </button>
          <button
            type="button"
            onClick={() => setDashboardTab('reports')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              dashboardTab === 'reports'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Reports ({filteredReports.length})
          </button>
          <button
            type="button"
            onClick={() => setDashboardTab('side-by-side')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              dashboardTab === 'side-by-side'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Side-by-Side</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Metrics (Section 6 Requirements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Reports Submitted"
          value={`${metrics.totalSubmittedThisWeek} / ${metrics.totalTeamMembers}`}
          subtitle={`Across ${teamMembers.length} active contributors`}
          icon={<FileCheck className="h-5 w-5" />}
          trend={{ value: `${metrics.submissionComplianceRate}% compliance`, isPositive: metrics.submissionComplianceRate >= 80 }}
          highlight={true}
        />

        <MetricCard
          title="Approved Submissions"
          value={metrics.approvedCount}
          subtitle={`${metrics.pendingReviewCount} report(s) awaiting review`}
          icon={<CheckCircle className="h-5 w-5" />}
          trend={{ value: 'Review flow healthy', isPositive: true }}
        />

        <MetricCard
          title="Needs Correction"
          value={metrics.needsCorrectionCount}
          subtitle="Sent back with manager feedback"
          icon={<Clock className="h-5 w-5" />}
        />

        <MetricCard
          title="Open Team Blockers"
          value={metrics.openBlockersCount}
          subtitle="Impediments across active projects"
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={{ value: '1 key issue flagged', isPositive: false }}
        />
      </div>

      {/* Filter Bar */}
      <ReportsFilterBar
        users={teamMembers}
        projects={projects}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedMemberId={selectedMemberId}
        onMemberChange={setSelectedMemberId}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onReset={resetFilters}
      />

      {/* Tab 1: Overview & Visual Insights */}
      {dashboardTab === 'overview' && (
        <div className="space-y-6">
          <AnalyticsCharts reports={filteredReports} projects={projects} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Reports Snapshot Table */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Contributor Submissions ({selectedWeek})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Click a member to inspect their profile and historical metrics
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDashboardTab('reports')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View Full Table →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100 text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Team Member</th>
                      <th className="py-2.5 px-3">Project</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Tasks</th>
                      <th className="py-2.5 px-3">Total Hours</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamMembers.map((member) => {
                      const report = reports.find(
                        (r) => r.userId === member.id && r.weekLabel === selectedWeek
                      );
                      const totalHrs = report
                        ? (report.hoursWorked?.development || 0) +
                          (report.hoursWorked?.testing || 0) +
                          (report.hoursWorked?.meetings || 0) +
                          (report.hoursWorked?.documentation || 0)
                        : 0;

                      return (
                        <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => onOpenMemberProfile(member.id)}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-left"
                            >
                              {member.name}
                              <span className="block text-[10px] text-slate-500 font-normal">
                                {member.title}
                              </span>
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {report ? report.projectName : '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={report ? report.status : 'Not Started'} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {report ? `${report.tasksCompleted?.length || 0} tasks` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {report ? `${totalHrs} hrs` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {report ? (
                              <button
                                type="button"
                                onClick={() => onOpenReportDetail(report.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                              >
                                View
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="lg:col-span-1">
              <ActivityFeed activities={activities} onSelectReport={onOpenReportDetail} />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Detailed Reports Table */}
      {dashboardTab === 'reports' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                All Reports Submissions Table
              </h4>
              <p className="text-[11px] text-slate-500">
                Displaying {filteredReports.length} reports matching current criteria
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-3">Team Member</th>
                  <th className="py-3 px-3">Project / Category</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Tasks Delivered</th>
                  <th className="py-3 px-3">Blockers Flagged</th>
                  <th className="py-3 px-3">Total Hours</th>
                  <th className="py-3 px-3">Submitted At</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic text-xs">
                      No reports match the selected filters for this week.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const totalHours =
                      (report.hoursWorked?.development || 0) +
                      (report.hoursWorked?.testing || 0) +
                      (report.hoursWorked?.meetings || 0) +
                      (report.hoursWorked?.documentation || 0);

                    return (
                      <tr key={report.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => onOpenMemberProfile(report.userId)}
                            className="font-bold text-slate-900 hover:text-indigo-600 text-left"
                          >
                            {report.userName}
                            <span className="block text-[10px] text-slate-500 font-normal">
                              {report.userTitle}
                            </span>
                          </button>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-700">{report.projectName}</span>
                        </td>

                        <td className="py-3 px-3">
                          <StatusBadge status={report.status} size="sm" />
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900">
                            {report.tasksCompleted?.length || 0} tasks
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`font-semibold ${
                              (report.blockers?.length || 0) > 0 ? 'text-amber-700' : 'text-slate-600'
                            }`}
                          >
                            {report.blockers?.length || 0} issues
                          </span>
                        </td>

                        <td className="py-3 px-3 font-semibold text-slate-900">{totalHours} hrs</td>

                        <td className="py-3 px-3 text-slate-500">
                          {report.submittedAt ? formatDate(report.submittedAt) : 'Draft'}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenReportDetail(report.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            >
                              Open
                            </button>
                            {report.status === 'Submitted' && (
                              <button
                                type="button"
                                onClick={() => setReviewReportId(report.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                              >
                                Review
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Side-by-Side Comparison Bonus */}
      {dashboardTab === 'side-by-side' && (
        <SideBySideComparison reports={reports} selectedWeek={selectedWeek} />
      )}

      {/* Review Action Modal */}
      {selectedReviewReport && (
        <ReviewActionModal
          isOpen={!!reviewReportId}
          onClose={() => setReviewReportId(null)}
          reportId={selectedReviewReport.id}
          reportAuthor={selectedReviewReport.userName}
          weekLabel={selectedReviewReport.weekLabel}
          onApprove={handleApprove}
          onRequestChanges={handleRequestChanges}
        />
      )}
    </div>
  );
};
