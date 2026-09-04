import React, { useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import {
  Calendar,
  Sparkles,
  LogOut,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Menu,
} from 'lucide-react';
import type { NavbarProps } from '../../props';

export const Navbar: React.FC<NavbarProps> = ({ onOpenAiAssistant, onToggleSidebar }) => {
  const { currentUser, logout, login } = useAuth();
  const {
    selectedWeek,
    setSelectedWeek,
    availableWeeks,
    selectDate,
    goToPreviousWeek,
    goToNextWeek,
  } = useReports();
  const dateInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const userName = currentUser?.name || currentUser?.email || 'User';
  const userRole = currentUser?.role || 'team_member';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Title & Mobile Menu Button */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Toggle Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 shrink-0">
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

        {/* Center: Standardized Monday - Sunday Week Selector */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/90 rounded-xl p-1 text-xs border border-slate-200/90 shadow-2xs">
          <button
            type="button"
            onClick={goToPreviousWeek}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
            title="Previous Week (Mon - Sun)"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span className="font-medium text-slate-500 text-[11px] hidden xl:inline">Week:</span>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 border-none outline-hidden cursor-pointer text-xs pr-1"
            >
              {availableWeeks.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={goToNextWeek}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
            title="Next Week (Mon - Sun)"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Real Calendar Date Picker Trigger */}
          <div className="relative">
            <input
              ref={dateInputRef}
              type="date"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                if (e.target.value) {
                  selectDate(e.target.value);
                  e.target.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (dateInputRef.current) {
                  if ('showPicker' in HTMLInputElement.prototype) {
                    try {
                      dateInputRef.current.showPicker();
                    } catch {
                      dateInputRef.current.click();
                    }
                  } else {
                    dateInputRef.current.click();
                  }
                }
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white transition-colors font-medium text-[11px] border border-transparent hover:border-slate-200 cursor-pointer"
              title="Pick any date from calendar to snap to that Monday - Sunday week"
            >
              <CalendarDays className="h-3.5 w-3.5 text-indigo-600" />
              <span>Calendar</span>
            </button>
          </div>
        </div>

        {/* Right Section: Demo Role Switcher, AI Assistant, Profile */}
        <div className="flex items-center gap-2.5">
          {/* 1-Click Quick Demo Role Switcher */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 rounded-xl px-2.5 py-1 text-xs border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400">Demo Role:</span>
            <select
              value={currentUser?.email}
              onChange={async (e) => {
                if (e.target.value && e.target.value !== currentUser?.email) {
                  await login(e.target.value, 'password123');
                }
              }}
              className="bg-transparent font-semibold text-slate-800 border-none outline-hidden cursor-pointer text-xs pr-1"
              title="Switch demo account & role"
            >
              <option value="admin@team.com">Admin (System Admin)</option>
              <option value="alex.rivera@team.com">Manager (Alex Rivera)</option>
              <option value="sarah.chen@team.com">Member (Sarah Chen)</option>
              <option value="michael.scott@team.com">Member (Michael Scott - Needs Correction)</option>
            </select>
          </div>

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
