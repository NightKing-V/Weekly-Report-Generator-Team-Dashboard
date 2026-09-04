import { create } from 'zustand';
import type {
  WeeklyReport,
  ProjectCategory,
  ActivityFeedItem,
  DashboardMetrics,
} from '../types';
import { apiClient } from '../services/api';
import { useAuthStore } from './useAuthStore';
import {
  getIsoWeek,
  getRecentWeeks,
  getAdjacentWeek,
  parseDateToWeek,
  type WeekInfo,
} from '../utils/dateUtils';

interface ReportState {
  reports: WeeklyReport[];
  projects: ProjectCategory[];
  activities: ActivityFeedItem[];
  selectedWeek: string;
  availableWeeks: string[];
  currentWeekInfo: WeekInfo;
  loading: boolean;

  setSelectedWeek: (week: string) => void;
  selectDate: (date: string | Date) => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;

  fetchReports: () => Promise<WeeklyReport[]>;
  fetchProjects: (force?: boolean) => Promise<ProjectCategory[]>;
  fetchActivities: () => Promise<ActivityFeedItem[]>;

  saveDraft: (reportData: Partial<WeeklyReport>) => Promise<WeeklyReport>;
  submitReport: (reportData: Partial<WeeklyReport>) => Promise<WeeklyReport>;
  approveReport: (reportId: string, comment?: string) => Promise<WeeklyReport>;
  requestChanges: (reportId: string, comment: string) => Promise<WeeklyReport>;

  addProject: (projectData: Omit<ProjectCategory, 'id' | 'createdAt'>) => Promise<ProjectCategory>;
  updateProject: (id: string, updates: Partial<ProjectCategory>) => Promise<ProjectCategory>;
  deleteProject: (id: string) => Promise<void>;

  getReportById: (id: string) => WeeklyReport | undefined;
  getUserReports: (userId: string) => WeeklyReport[];
  getDashboardMetrics: () => DashboardMetrics;
  resetToInitialData: () => void;
}

const initialWeek = getIsoWeek();
const recentWeeks = getRecentWeeks(12);

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  projects: [],
  activities: [],
  selectedWeek: initialWeek.weekLabel,
  availableWeeks: recentWeeks.map((w) => w.weekLabel),
  currentWeekInfo: initialWeek,
  loading: false,

  setSelectedWeek: (week) => {
    const weekInfo = getIsoWeek(week);
    set((state) => {
      const exists = state.availableWeeks.includes(week);
      return {
        selectedWeek: week,
        currentWeekInfo: weekInfo,
        availableWeeks: exists ? state.availableWeeks : [week, ...state.availableWeeks],
      };
    });
  },

  selectDate: (dateInput) => {
    const weekInfo = parseDateToWeek(dateInput);
    set((state) => {
      const exists = state.availableWeeks.includes(weekInfo.weekLabel);
      return {
        selectedWeek: weekInfo.weekLabel,
        currentWeekInfo: weekInfo,
        availableWeeks: exists ? state.availableWeeks : [weekInfo.weekLabel, ...state.availableWeeks],
      };
    });
  },

  goToPreviousWeek: () => {
    const prev = getAdjacentWeek(get().selectedWeek, -1);
    get().selectDate(prev.weekStartDate);
  },

  goToNextWeek: () => {
    const next = getAdjacentWeek(get().selectedWeek, 1);
    get().selectDate(next.weekStartDate);
  },

  fetchReports: async () => {
    set({ loading: true });
    try {
      const reports = await apiClient.reports.getAll();
      set({ reports, loading: false });
      return reports;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  fetchProjects: async (force = false) => {
    if (!force && get().projects.length > 0) {
      return get().projects;
    }
    const projects = await apiClient.projects.getAll();
    set({ projects });
    return projects;
  },

  fetchActivities: async () => {
    const activities = await apiClient.activities.getAll();
    set({ activities });
    return activities;
  },

  saveDraft: async (reportData) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) throw new Error('User must be logged in to save draft');

    const effectiveWeek = reportData.weekLabel || get().selectedWeek;
    const weekInfo = getIsoWeek(reportData.weekStartDate || effectiveWeek);

    const project = get().projects.find((p) => p.id === reportData.projectId);
    const enrichedData = {
      ...reportData,
      userId: currentUser.id,
      userName: currentUser.name,
      userTitle: currentUser.title,
      userDepartment: currentUser.department,
      projectName: project ? project.name : 'General Project',
      weekLabel: effectiveWeek,
      weekStartDate: weekInfo.weekStartDate,
      weekEndDate: weekInfo.weekEndDate,
    };

    const saved = await apiClient.reports.saveDraft(enrichedData);
    set((state) => {
      const idx = state.reports.findIndex((r) => r.id === saved.id);
      const reports = idx >= 0
        ? state.reports.map((r, i) => (i === idx ? saved : r))
        : [saved, ...state.reports];
      return { reports };
    });
    return saved;
  },

  submitReport: async (reportData) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) throw new Error('User must be logged in to submit report');

    const effectiveWeek = reportData.weekLabel || get().selectedWeek;
    const weekInfo = getIsoWeek(reportData.weekStartDate || effectiveWeek);

    const project = get().projects.find((p) => p.id === reportData.projectId);
    const enrichedData = {
      ...reportData,
      userId: currentUser.id,
      userName: currentUser.name,
      userTitle: currentUser.title,
      userDepartment: currentUser.department,
      projectName: project ? project.name : 'General Project',
      weekLabel: effectiveWeek,
      weekStartDate: weekInfo.weekStartDate,
      weekEndDate: weekInfo.weekEndDate,
    };

    const submitted = await apiClient.reports.submit(enrichedData);
    const updatedActivities = await apiClient.activities.getAll().catch(() => get().activities);

    set((state) => {
      const idx = state.reports.findIndex((r) => r.id === submitted.id);
      const reports = idx >= 0
        ? state.reports.map((r, i) => (i === idx ? submitted : r))
        : [submitted, ...state.reports];
      return { reports, activities: updatedActivities };
    });

    return submitted;
  },

  approveReport: async (reportId, comment) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) throw new Error('User must be logged in to approve report');

    const approved = await apiClient.reports.approve(
      reportId,
      {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      },
      comment
    );

    const updatedActivities = await apiClient.activities.getAll().catch(() => get().activities);

    set((state) => ({
      reports: state.reports.map((r) => (r.id === reportId ? approved : r)),
      activities: updatedActivities,
    }));

    return approved;
  },

  requestChanges: async (reportId, comment) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) throw new Error('User must be logged in to request changes');

    const updated = await apiClient.reports.requestChanges(
      reportId,
      {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      },
      comment
    );

    const updatedActivities = await apiClient.activities.getAll().catch(() => get().activities);

    set((state) => ({
      reports: state.reports.map((r) => (r.id === reportId ? updated : r)),
      activities: updatedActivities,
    }));

    return updated;
  },

  addProject: async (projectData) => {
    const created = await apiClient.projects.create(projectData);
    set((state) => ({
      projects: [...state.projects, created],
    }));
    return created;
  },

  updateProject: async (id, updates) => {
    const updated = await apiClient.projects.update(id, updates);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
    return updated;
  },

  deleteProject: async (id) => {
    await apiClient.projects.delete(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    }));
  },

  getReportById: (id) => get().reports.find((r) => r.id === id),

  getUserReports: (userId) =>
    get()
      .reports.filter((r) => r.userId === userId)
      .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate)),

  getDashboardMetrics: (): DashboardMetrics => {
    const { reports, selectedWeek } = get();
    const users = useAuthStore.getState().users;

    const weekReports = reports.filter((r) => r.weekLabel === selectedWeek);
    const teamMembers = users.filter((u) => u.role === 'team_member');
    const totalTeamMembers = teamMembers.length;

    const submittedCount = weekReports.filter(
      (r) => r.status === 'Submitted' || r.status === 'Approved'
    ).length;

    const approvedCount = weekReports.filter((r) => r.status === 'Approved').length;
    const needsCorrectionCount = weekReports.filter((r) => r.status === 'Needs Correction').length;
    const pendingReviewCount = weekReports.filter((r) => r.status === 'Submitted').length;

    const openBlockersCount = weekReports.reduce(
      (sum, r) => sum + (r.blockers ? r.blockers.length : 0),
      0
    );

    const complianceRate =
      totalTeamMembers > 0
        ? Math.round(((submittedCount + needsCorrectionCount) / totalTeamMembers) * 100)
        : 0;

    return {
      totalSubmittedThisWeek: submittedCount,
      submissionComplianceRate: complianceRate,
      needsCorrectionCount,
      openBlockersCount,
      totalTeamMembers,
      approvedCount,
      pendingReviewCount,
    };
  },

  resetToInitialData: () => {},
}));
