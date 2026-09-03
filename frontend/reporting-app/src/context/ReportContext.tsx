/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import type {
  WeeklyReport,
  ProjectCategory,
  ActivityFeedItem,
  DashboardMetrics,
} from '../types';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  setSelectedWeek as setSelectedWeekAction,
  saveDraftAsync,
  submitReportAsync,
  approveReportAsync,
  requestChangesAsync,
  createProjectAsync,
  updateProjectAsync,
  deleteProjectAsync,
} from '../store/slices/reportsSlice';
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

const ReportContext = React.createContext<ReportContextType | undefined>(undefined);

export const ReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { currentUser } = useAuth();
  const { reports, projects, activities, selectedWeek, availableWeeks } = useAppSelector(
    (state) => state.reports
  );
  const { users } = useAppSelector((state) => state.auth);

  const setSelectedWeek = (week: string) => {
    dispatch(setSelectedWeekAction(week));
  };

  const getReportById = (id: string) => reports.find((r) => r.id === id);

  const getUserReports = (userId: string) =>
    reports
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));

  const saveDraft = (reportData: Partial<WeeklyReport>): WeeklyReport => {
    if (!currentUser) throw new Error('User must be logged in to save draft');
    const project = projects.find((p) => p.id === reportData.projectId);
    const enrichedData = {
      ...reportData,
      userId: currentUser.id,
      userName: currentUser.name,
      userTitle: currentUser.title,
      userDepartment: currentUser.department,
      projectName: project ? project.name : 'General Project',
    };
    dispatch(saveDraftAsync(enrichedData));
    return enrichedData as WeeklyReport;
  };

  const submitReport = (reportData: Partial<WeeklyReport>): WeeklyReport => {
    if (!currentUser) throw new Error('User must be logged in to submit report');
    const project = projects.find((p) => p.id === reportData.projectId);
    const enrichedData = {
      ...reportData,
      userId: currentUser.id,
      userName: currentUser.name,
      userTitle: currentUser.title,
      userDepartment: currentUser.department,
      projectName: project ? project.name : 'General Project',
      weekLabel: reportData.weekLabel || selectedWeek,
    };
    dispatch(submitReportAsync(enrichedData));
    return enrichedData as WeeklyReport;
  };

  const approveReport = (reportId: string, comment?: string) => {
    if (!currentUser) return;
    dispatch(
      approveReportAsync({
        reportId,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        },
        comment,
      })
    );
  };

  const requestChanges = (reportId: string, comment: string) => {
    if (!currentUser) return;
    dispatch(
      requestChangesAsync({
        reportId,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        },
        comment,
      })
    );
  };

  const addProject = (projectData: Omit<ProjectCategory, 'id' | 'createdAt'>): ProjectCategory => {
    const newProj: ProjectCategory = {
      ...projectData,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    dispatch(createProjectAsync(projectData));
    return newProj;
  };

  const updateProject = (id: string, updateData: Partial<ProjectCategory>) => {
    dispatch(updateProjectAsync({ id, updates: updateData }));
  };

  const deleteProject = (id: string) => {
    dispatch(deleteProjectAsync(id));
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
  };

  const resetToInitialData = () => {
    // Reserved if local reset is requested
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
  const context = React.useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};
