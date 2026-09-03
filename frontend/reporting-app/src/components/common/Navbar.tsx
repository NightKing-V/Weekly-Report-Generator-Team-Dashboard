import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import {
  Calendar,
  Sparkles,
  UserCheck,
  LogOut,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react';
import type { NavbarProps } from '../../props';

export const Navbar: React.FC<NavbarProps> = ({ onOpenAiAssistant }) => {
  const { currentUser, users, switchUser, logout } = useAuth();
  const { selectedWeek, setSelectedWeek, availableWeeks } = useReports();

  if (!currentUser) return null;

  const userName = currentUser?.name || currentUser?.email || 'User';
  const userRole = currentUser?.role || 'team_member';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base">WeeklyPulse</span>
              <span className="hidden sm:inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                Team Dashboard
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">Report Generator & Review Workflow</p>
          </div>
        </div>

        {/* Center: Week Selector */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-100 rounded-lg p-1 text-xs border border-slate-200">
          <Calendar className="h-3.5 w-3.5 text-slate-500 ml-2" />
          <span className="font-medium text-slate-600">Active Week:</span>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="bg-transparent font-semibold text-slate-900 border-none outline-hidden cursor-pointer"
          >
            {availableWeeks.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        {/* Right Section: AI Assistant, Role Switcher, Profile */}
        <div className="flex items-center gap-3">
          {/* AI Summary Trigger */}
          <button
            type="button"
            onClick={onOpenAiAssistant}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/50 text-indigo-700 text-xs font-medium transition-colors cursor-pointer"
            title="Open AI Assistant for team summaries and Q&A"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>

          {/* Role Switcher Pill for Demo / Reviewer Convenience */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span className="capitalize hidden md:inline">
                {userRole === 'manager' ? 'Manager View' : 'Member View'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Dropdown for instant user/role switching */}
            <div className="absolute right-0 mt-1.5 w-64 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-hidden hidden group-hover:block z-50 p-2 border border-slate-200">
              <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Switch User / Role
                </p>
                <p className="text-[11px] text-slate-500">Test different user perspectives</p>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => switchUser(u.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      currentUser?.id === u.id
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate">
                      <p className="font-medium truncate">{u.name || u.email}</p>
                      <p className="text-[10px] text-slate-500 truncate">{u.title || 'Team Member'}</p>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                        u.role === 'manager'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {u.role === 'manager' ? 'Mgr' : 'Dev'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current User Badge & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-indigo-700 border border-slate-300">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={userName}
                  className="h-full w-full object-cover"
                />
              ) : (
                userInitial
              )}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{userName}</p>
              <p className="text-[10px] text-slate-500 leading-tight capitalize">{userRole.replace('_', ' ')}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
