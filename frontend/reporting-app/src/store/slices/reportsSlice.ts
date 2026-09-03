import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { WeeklyReport, ProjectCategory, ActivityFeedItem } from '../../types';
import { apiClient } from '../../services/api';

interface ReportsState {
  reports: WeeklyReport[];
  projects: ProjectCategory[];
  activities: ActivityFeedItem[];
  selectedWeek: string;
  availableWeeks: string[];
  loading: boolean;
  error: string | null;
}

const initialState: ReportsState = {
  reports: [],
  projects: [],
  activities: [],
  selectedWeek: 'Week 36 (Aug 31 - Sep 06, 2026)',
  availableWeeks: [
    'Week 36 (Aug 31 - Sep 06, 2026)',
    'Week 35 (Aug 24 - Aug 30, 2026)',
    'Week 34 (Aug 17 - Aug 23, 2026)',
  ],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchReports = createAsyncThunk('reports/fetchReports', async () => {
  return await apiClient.reports.getAll();
});

export const fetchProjects = createAsyncThunk('reports/fetchProjects', async () => {
  return await apiClient.projects.getAll();
});

export const fetchActivities = createAsyncThunk('reports/fetchActivities', async () => {
  return await apiClient.activities.getAll();
});

export const saveDraftAsync = createAsyncThunk(
  'reports/saveDraft',
  async (reportData: Partial<WeeklyReport>) => {
    return await apiClient.reports.saveDraft(reportData);
  }
);

export const submitReportAsync = createAsyncThunk(
  'reports/submitReport',
  async (reportData: Partial<WeeklyReport>) => {
    const report = await apiClient.reports.submit(reportData);
    // Refresh activities after submit
    const updatedActivities = await apiClient.activities.getAll();
    return { report, updatedActivities };
  }
);

export const approveReportAsync = createAsyncThunk(
  'reports/approveReport',
  async ({
    reportId,
    author,
    comment,
  }: {
    reportId: string;
    author: { id: string; name: string; role: string };
    comment?: string;
  }) => {
    const report = await apiClient.reports.approve(reportId, author, comment);
    const updatedActivities = await apiClient.activities.getAll();
    return { report, updatedActivities };
  }
);

export const requestChangesAsync = createAsyncThunk(
  'reports/requestChanges',
  async ({
    reportId,
    author,
    comment,
  }: {
    reportId: string;
    author: { id: string; name: string; role: string };
    comment: string;
  }) => {
    const report = await apiClient.reports.requestChanges(reportId, author, comment);
    const updatedActivities = await apiClient.activities.getAll();
    return { report, updatedActivities };
  }
);

export const createProjectAsync = createAsyncThunk(
  'reports/createProject',
  async (project: Omit<ProjectCategory, 'id' | 'createdAt'>) => {
    return await apiClient.projects.create(project);
  }
);

export const updateProjectAsync = createAsyncThunk(
  'reports/updateProject',
  async ({ id, updates }: { id: string; updates: Partial<ProjectCategory> }) => {
    return await apiClient.projects.update(id, updates);
  }
);

export const deleteProjectAsync = createAsyncThunk('reports/deleteProject', async (id: string) => {
  await apiClient.projects.delete(id);
  return id;
});

export const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setSelectedWeek: (state, action: PayloadAction<string>) => {
      state.selectedWeek = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Reports
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload || [];
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch reports';
      });

    // Fetch Projects
    builder.addCase(fetchProjects.fulfilled, (state, action) => {
      state.projects = action.payload || [];
    });

    // Fetch Activities
    builder.addCase(fetchActivities.fulfilled, (state, action) => {
      state.activities = action.payload || [];
    });

    // Save Draft
    builder.addCase(saveDraftAsync.fulfilled, (state, action) => {
      const idx = state.reports.findIndex((r) => r.id === action.payload.id);
      if (idx >= 0) {
        state.reports[idx] = action.payload;
      } else {
        state.reports.unshift(action.payload);
      }
    });

    // Submit Report
    builder.addCase(submitReportAsync.fulfilled, (state, action) => {
      const idx = state.reports.findIndex((r) => r.id === action.payload.report.id);
      if (idx >= 0) {
        state.reports[idx] = action.payload.report;
      } else {
        state.reports.unshift(action.payload.report);
      }
      if (action.payload.updatedActivities) {
        state.activities = action.payload.updatedActivities;
      }
    });

    // Approve Report
    builder.addCase(approveReportAsync.fulfilled, (state, action) => {
      const idx = state.reports.findIndex((r) => r.id === action.payload.report.id);
      if (idx >= 0) {
        state.reports[idx] = action.payload.report;
      }
      if (action.payload.updatedActivities) {
        state.activities = action.payload.updatedActivities;
      }
    });

    // Request Changes
    builder.addCase(requestChangesAsync.fulfilled, (state, action) => {
      const idx = state.reports.findIndex((r) => r.id === action.payload.report.id);
      if (idx >= 0) {
        state.reports[idx] = action.payload.report;
      }
      if (action.payload.updatedActivities) {
        state.activities = action.payload.updatedActivities;
      }
    });

    // Project CRUD
    builder.addCase(createProjectAsync.fulfilled, (state, action) => {
      state.projects.push(action.payload);
    });

    builder.addCase(updateProjectAsync.fulfilled, (state, action) => {
      const idx = state.projects.findIndex((p) => p.id === action.payload.id);
      if (idx >= 0) {
        state.projects[idx] = action.payload;
      }
    });

    builder.addCase(deleteProjectAsync.fulfilled, (state, action) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
    });
  },
});

export const { setSelectedWeek } = reportsSlice.actions;
export default reportsSlice.reducer;
