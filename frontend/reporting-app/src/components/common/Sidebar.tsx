import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import {
  FileEdit,
  History,
  LayoutDashboard,
  ClipboardCheck,
  FolderKanban,
  Users,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

export type NavigationTab =
  | 'personal-report'
  | 'report-history'
  | 'report-detail'
  | 'team-dashboard'
  | 'manager-review'
  | 'member-profile'
  | 'projects'
  | 'users';

interface SidebarProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onNavigate }) => {
  const { currentUser } = useAuth();
  const { reports } = useReports();

  if (!currentUser) return null;

  const isManager = currentUser.role === 'manager' || currentUser.role === 'admin';

  // Calculate pending counts
  const pendingReviewCount = reports.filter((r) => r.status === 'Submitted').length;
  const userNeedsCorrectionCount = reports.filter(
    (r) => r.userId === currentUser.id && r.status === 'Needs Correction'
  ).length;

  const navItems = isManager
    ? [
        {
          id: 'team-dashboard' as NavigationTab,
          label: 'Team Dashboard',
          icon: LayoutDashboard,
          description: 'Metrics, charts & cross-team view',
        },
        {
          id: 'manager-review' as NavigationTab,
          label: 'Review Reports',
          icon: ClipboardCheck,
          description: 'Approval & correction workflow',
          badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
          badgeColor: 'bg-indigo-600 text-white',
        },
        {
          id: 'projects' as NavigationTab,
          label: 'Projects & Categories',
          icon: FolderKanban,
          description: 'Manage work categories',
        },
        {
          id: 'users' as NavigationTab,
          label: 'User Management',
          icon: Users,
          description: 'Manage team & roles',
        },
        // Managers can also create their own personal report!
        {
          id: 'personal-report' as NavigationTab,
          label: 'My Weekly Report',
          icon: FileEdit,
          description: 'Create / edit personal report',
        },
        {
          id: 'report-history' as NavigationTab,
          label: 'My Report History',
          icon: History,
          description: 'List of historical reports',
        },
      ]
    : [
        {
          id: 'personal-report' as NavigationTab,
          label: 'Weekly Report',
          icon: FileEdit,
          description: 'Create & edit weekly submission',
          badge: userNeedsCorrectionCount > 0 ? 'Needs Fix' : undefined,
          badgeColor: 'bg-amber-500 text-white',
          badgeIcon: userNeedsCorrectionCount > 0 ? AlertCircle : undefined,
        },
        {
          id: 'report-history' as NavigationTab,
          label: 'Report History',
          icon: History,
          description: 'Review your past weekly submissions',
        },
        {
          id: 'projects' as NavigationTab,
          label: 'Projects & Tags',
          icon: FolderKanban,
          description: 'View active team projects',
        },
      ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {isManager ? 'Management Hub' : 'Member Workspace'}
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="truncate text-sm">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Workflow Quick Helper Banner */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <span>Review Cycle Status</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {isManager
              ? 'Managers review submitted reports and can either Approve or Request Changes.'
              : 'Submit weekly report before Friday. Reports needing changes can be edited & resubmitted.'}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400">Weekly Report Generator v1.0</p>
        <p className="text-[10px] text-slate-400">Role: {currentUser.role.replace('_', ' ')}</p>
      </div>
    </aside>
  );
};
