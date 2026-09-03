import type {
  User,
  UserRole,
  WeeklyReport,
  ProjectCategory,
  ActivityFeedItem,
  DashboardMetrics,
} from '../types';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      // ignore
    }
    throw new Error(errorDetail || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const apiClient = {
  // Users API
  users: {
    getAll: () => request<User[]>('/api/users'),
    getById: (id: string) => request<User>(`/api/users/${id}`),
    login: (email: string, role?: UserRole) =>
      request<User>('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      }),
    create: (user: Omit<User, 'id' | 'createdAt'>) =>
      request<User>('/api/users', {
        method: 'POST',
        body: JSON.stringify(user),
      }),
    updateRole: (id: string, role: UserRole) =>
      request<User>(`/api/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    delete: (id: string) =>
      request<void>(`/api/users/${id}`, {
        method: 'DELETE',
      }),
  },

  // Reports API
  reports: {
    getAll: (filters?: { week?: string; userId?: string; projectId?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (filters?.week && filters.week !== 'all') params.append('week', filters.week);
      if (filters?.userId && filters.userId !== 'all') params.append('user_id', filters.userId);
      if (filters?.projectId && filters.projectId !== 'all') params.append('project_id', filters.projectId);
      if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
      const q = params.toString();
      return request<WeeklyReport[]>(`/api/reports${q ? `?${q}` : ''}`);
    },
    getById: (id: string) => request<WeeklyReport>(`/api/reports/${id}`),
    saveDraft: (reportData: Partial<WeeklyReport>) =>
      request<WeeklyReport>('/api/reports/draft', {
        method: 'POST',
        body: JSON.stringify(reportData),
      }),
    submit: (reportData: Partial<WeeklyReport>) =>
      request<WeeklyReport>('/api/reports/submit', {
        method: 'POST',
        body: JSON.stringify(reportData),
      }),
    approve: (reportId: string, author: { id: string; name: string; role: string }, comment?: string) =>
      request<WeeklyReport>(`/api/reports/${reportId}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          authorId: author.id,
          authorName: author.name,
          authorRole: author.role,
          comment,
        }),
      }),
    requestChanges: (reportId: string, author: { id: string; name: string; role: string }, comment: string) =>
      request<WeeklyReport>(`/api/reports/${reportId}/request-changes`, {
        method: 'POST',
        body: JSON.stringify({
          authorId: author.id,
          authorName: author.name,
          authorRole: author.role,
          comment,
        }),
      }),
    getMetrics: (week: string) =>
      request<DashboardMetrics>(`/api/reports/metrics/summary?week=${encodeURIComponent(week)}`),
  },

  // Projects API
  projects: {
    getAll: () => request<ProjectCategory[]>('/api/projects'),
    create: (project: Omit<ProjectCategory, 'id' | 'createdAt'>) =>
      request<ProjectCategory>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(project),
      }),
    update: (id: string, updates: Partial<ProjectCategory>) =>
      request<ProjectCategory>(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      request<void>(`/api/projects/${id}`, {
        method: 'DELETE',
      }),
  },

  // Activity & Chat API
  activities: {
    getAll: () => request<ActivityFeedItem[]>('/api/activities'),
  },

  chat: {
    ask: (message: string, weekLabel?: string) =>
      request<{ reply: string; sourcesCount: number }>('/api/chat/ask', {
        method: 'POST',
        body: JSON.stringify({ message, weekLabel }),
      }),
  },
};

