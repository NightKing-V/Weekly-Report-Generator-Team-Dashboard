import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import {
  Calendar,
  Sparkles,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import type { NavbarProps } from '../../props';

export const Navbar: React.FC<NavbarProps> = ({ onOpenAiAssistant }) => {
  const { currentUser, logout } = useAuth();
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
