/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  WeeklyReport,
  ProjectCategory,
  ActivityFeedItem,
  DashboardMetrics,
  ReviewComment,
  ReportVersion,
} from '../types';
import { INITIAL_REPORTS, INITIAL_PROJECTS, INITIAL_ACTIVITY } from '../data/mockData';
import { useAuth } from './AuthContext';

interface ReportContextType {
  reports: WeeklyReport[];
  projects: ProjectCategory[];
  activities: ActivityFeedItem[];
  selectedWeek: string;
  setSelectedWeek: (week: string) => void;
  availableWeeks: string[];
  getReportById: (id: string) => WeeklyReport | undefined;
  getUserReports: (userId: string) => WeeklyReport[];
  saveDraft: (reportData: Partial<WeeklyReport>) => WeeklyReport;
  submitReport: (reportData: Partial<WeeklyReport>) => WeeklyReport;
  approveReport: (reportId: string, comment?: string) => void;
  requestChanges: (reportId: string, comment: string) => void;
  addProject: (project: Omit<ProjectCategory, 'id' | 'createdAt'>) => ProjectCategory;
  updateProject: (id: string, project: Partial<ProjectCategory>) => void;
  deleteProject: (id: string) => void;
  getDashboardMetrics: () => DashboardMetrics;
  resetToInitialData: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users } = useAuth();

  const [reports, setReports] = useState<WeeklyReport[]>(() => {
    const saved = localStorage.getItem('team_dashboard_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [projects, setProjects] = useState<ProjectCategory[]>(() => {
    const saved = localStorage.getItem('team_dashboard_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [activities, setActivities] = useState<ActivityFeedItem[]>(() => {
    const saved = localStorage.getItem('team_dashboard_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY;
  });

  const [selectedWeek, setSelectedWeek] = useState<string>('Week 36 (Aug 31 - Sep 06, 2026)');

  const availableWeeks = [
    'Week 36 (Aug 31 - Sep 06, 2026)',
    'Week 35 (Aug 24 - Aug 30, 2026)',
    'Week 34 (Aug 17 - Aug 23, 2026)',
  ];

  useEffect(() => {
    localStorage.setItem('team_dashboard_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('team_dashboard_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('team_dashboard_activities', JSON.stringify(activities));
  }, [activities]);

  const getReportById = (id: string) => reports.find((r) => r.id === id);

  const getUserReports = (userId: string) =>
    reports.filter((r) => r.userId === userId).sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));

  const addActivity = (item: Omit<ActivityFeedItem, 'id' | 'timestamp'>) => {
    const newActivity: ActivityFeedItem = {
      ...item,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const saveDraft = (reportData: Partial<WeeklyReport>): WeeklyReport => {
    if (!currentUser) throw new Error('User must be logged in to save draft');

    const now = new Date().toISOString();
    const existingIndex = reports.findIndex(
      (r) => r.id === reportData.id || (r.userId === currentUser.id && r.weekLabel === reportData.weekLabel)
    );

    const project = projects.find((p) => p.id === reportData.projectId);

    if (existingIndex >= 0) {
      const existing = reports[existingIndex];
      const updated: WeeklyReport = {
        ...existing,
        ...reportData,
        status: 'Draft',
        projectName: project ? project.name : existing.projectName,
        updatedAt: now,
      };
      setReports((prev) => prev.map((r, idx) => (idx === existingIndex ? updated : r)));
      return updated;
    } else {
      const newReport: WeeklyReport = {
        id: `rep-${currentUser.id}-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userTitle: currentUser.title,
        userDepartment: currentUser.department,
        weekStartDate: reportData.weekStartDate || '2026-08-31',
        weekEndDate: reportData.weekEndDate || '2026-09-06',
        weekLabel: reportData.weekLabel || selectedWeek,
        projectId: reportData.projectId || (projects[0] ? projects[0].id : ''),
        projectName: project ? project.name : 'General Project',
        status: 'Draft',
        tasksCompleted: reportData.tasksCompleted || [],
        tasksPlannedNextWeek: reportData.tasksPlannedNextWeek || [],
        blockers: reportData.blockers || [],
        achievements: reportData.achievements || [],
        hoursWorked: reportData.hoursWorked || { development: 0, testing: 0, meetings: 0, documentation: 0 },
        notesOrLinks: reportData.notesOrLinks || '',
        currentVersion: 1,
        versions: [],
        reviewHistory: [],
        createdAt: now,
        updatedAt: now,
      };
      setReports((prev) => [newReport, ...prev]);
      return newReport;
    }
  };

  const submitReport = (reportData: Partial<WeeklyReport>): WeeklyReport => {
    if (!currentUser) throw new Error('User must be logged in to submit report');

    const now = new Date().toISOString();
    const existingIndex = reports.findIndex(
      (r) => r.id === reportData.id || (r.userId === currentUser.id && r.weekLabel === reportData.weekLabel)
    );

    const project = projects.find((p) => p.id === reportData.projectId);

    if (existingIndex >= 0) {
      const existing = reports[existingIndex];

      // If resubmitting after Needs Correction, archive the previous state into versions
      const newVersions: ReportVersion[] = [...(existing.versions || [])];
      if (existing.status === 'Needs Correction' || existing.status === 'Submitted') {
        newVersions.push({
          versionNumber: existing.currentVersion,
          submittedAt: existing.submittedAt || existing.updatedAt,
          submittedBy: existing.userName,
          content: {
            weekStartDate: existing.weekStartDate,
            weekEndDate: existing.weekEndDate,
            weekLabel: existing.weekLabel,
            projectId: existing.projectId,
            tasksCompleted: existing.tasksCompleted,
            tasksPlannedNextWeek: existing.tasksPlannedNextWeek,
            blockers: existing.blockers,
            achievements: existing.achievements,
            hoursWorked: existing.hoursWorked,
            notesOrLinks: existing.notesOrLinks,
          },
          reviewComment: existing.reviewHistory && existing.reviewHistory.length > 0
            ? existing.reviewHistory[existing.reviewHistory.length - 1]
            : undefined,
        });
      }

      const updated: WeeklyReport = {
        ...existing,
        ...reportData,
        status: 'Submitted',
        currentVersion: existing.status === 'Needs Correction' ? existing.currentVersion + 1 : existing.currentVersion,
        versions: newVersions,
        projectName: project ? project.name : existing.projectName,
        submittedAt: now,
        updatedAt: now,
      };

      setReports((prev) => prev.map((r, idx) => (idx === existingIndex ? updated : r)));

      addActivity({
        type: 'submitted',
        actorName: currentUser.name,
        actorRole: currentUser.role,
        reportId: updated.id,
        weekLabel: updated.weekLabel,
        message:
          existing.status === 'Needs Correction'
            ? `${currentUser.name} resubmitted revised report for ${updated.weekLabel} (v${updated.currentVersion})`
            : `${currentUser.name} submitted weekly report for ${updated.weekLabel}`,
      });

      return updated;
    } else {
      const newReport: WeeklyReport = {
        id: `rep-${currentUser.id}-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userTitle: currentUser.title,
        userDepartment: currentUser.department,
        weekStartDate: reportData.weekStartDate || '2026-08-31',
        weekEndDate: reportData.weekEndDate || '2026-09-06',
        weekLabel: reportData.weekLabel || selectedWeek,
        projectId: reportData.projectId || (projects[0] ? projects[0].id : ''),
        projectName: project ? project.name : 'General Project',
        status: 'Submitted',
        tasksCompleted: reportData.tasksCompleted || [],
        tasksPlannedNextWeek: reportData.tasksPlannedNextWeek || [],
        blockers: reportData.blockers || [],
        achievements: reportData.achievements || [],
        hoursWorked: reportData.hoursWorked || { development: 0, testing: 0, meetings: 0, documentation: 0 },
        notesOrLinks: reportData.notesOrLinks || '',
        currentVersion: 1,
        versions: [],
        reviewHistory: [],
        submittedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      setReports((prev) => [newReport, ...prev]);

      addActivity({
        type: 'submitted',
        actorName: currentUser.name,
        actorRole: currentUser.role,
        reportId: newReport.id,
        weekLabel: newReport.weekLabel,
        message: `${currentUser.name} submitted weekly report for ${newReport.weekLabel}`,
      });

      return newReport;
    }
  };

  const approveReport = (reportId: string, comment?: string) => {
    if (!currentUser || currentUser.role === 'team_member') {
      throw new Error('Only managers can approve reports');
    }

    const now = new Date().toISOString();
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    const reviewComment: ReviewComment = {
      id: `rev-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      comment: comment || 'Approved report without additional changes.',
      action: 'approve',
      createdAt: now,
      versionNumber: report.currentVersion,
    };

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'Approved',
              reviewedAt: now,
              updatedAt: now,
              reviewHistory: [...(r.reviewHistory || []), reviewComment],
            }
          : r
      )
    );

    addActivity({
      type: 'approved',
      actorName: currentUser.name,
      actorRole: currentUser.role,
      reportId,
      weekLabel: report.weekLabel,
      message: `${currentUser.name} approved ${report.userName}'s report for ${report.weekLabel}`,
    });
  };

  const requestChanges = (reportId: string, comment: string) => {
    if (!currentUser || currentUser.role === 'team_member') {
      throw new Error('Only managers can request corrections');
    }
    if (!comment || !comment.trim()) {
      throw new Error('A correction explanation comment is required');
    }

    const now = new Date().toISOString();
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    const reviewComment: ReviewComment = {
      id: `rev-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      comment: comment.trim(),
      action: 'request_changes',
      createdAt: now,
      versionNumber: report.currentVersion,
    };

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'Needs Correction',
              latestManagerComment: comment.trim(),
              reviewedAt: now,
              updatedAt: now,
              reviewHistory: [...(r.reviewHistory || []), reviewComment],
            }
          : r
      )
    );

    addActivity({
      type: 'correction_requested',
      actorName: currentUser.name,
      actorRole: currentUser.role,
      reportId,
      weekLabel: report.weekLabel,
      message: `${currentUser.name} requested changes on ${report.userName}'s report for ${report.weekLabel}`,
    });
  };

  const addProject = (projectData: Omit<ProjectCategory, 'id' | 'createdAt'>): ProjectCategory => {
    const newProject: ProjectCategory = {
      ...projectData,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [...prev, newProject]);
    return newProject;
  };

  const updateProject = (id: string, updateData: Partial<ProjectCategory>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updateData } : p)));
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const getDashboardMetrics = (): DashboardMetrics => {
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

    const complianceRate = totalTeamMembers > 0
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
  };

  const resetToInitialData = () => {
    setReports(INITIAL_REPORTS);
    setProjects(INITIAL_PROJECTS);
    setActivities(INITIAL_ACTIVITY);
    localStorage.removeItem('team_dashboard_reports');
    localStorage.removeItem('team_dashboard_projects');
    localStorage.removeItem('team_dashboard_activities');
  };

  return (
    <ReportContext.Provider
      value={{
        reports,
        projects,
        activities,
        selectedWeek,
        setSelectedWeek,
        availableWeeks,
        getReportById,
        getUserReports,
        saveDraft,
        submitReport,
        approveReport,
        requestChanges,
        addProject,
        updateProject,
        deleteProject,
        getDashboardMetrics,
        resetToInitialData,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};
