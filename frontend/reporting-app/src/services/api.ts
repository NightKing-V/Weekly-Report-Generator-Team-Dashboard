import type {
  User,
  UserRole,
  WeeklyReport,
  ProjectCategory,
  ActivityFeedItem,
  DashboardMetrics,
} from '../types';

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const AUTH_TOKEN_KEY = 'team_dashboard_jwt_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = `Request failed with status ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.detail) {
          errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        errorDetail = response.statusText || errorDetail;
      }
      throw new ApiError(response.status, errorDetail);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or offline error
    throw new ApiError(0, 'Network connection failed. Please ensure the backend server is reachable.');
  }
}

export const apiClient = {
  // Users & Authentication API
  users: {
    getAll: () => request<User[]>('/api/users'),
    getById: (id: string) => request<User>(`/api/users/${id}`),
    getMe: () => request<User>('/api/users/me'),
    login: (email: string, password?: string, role?: UserRole) =>
      request<AuthResponse>('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: password || 'password123', role }),
      }),
    register: (payload: {
      name: string;
      email: string;
      password?: string;
      role: UserRole;
      title?: string;
      department?: string;
      avatarUrl?: string;
    }) =>
      request<AuthResponse>('/api/users/register', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          password: payload.password || 'password123',
        }),
      }),
    create: (user: Omit<User, 'id' | 'createdAt'> & { password?: string }) =>
      request<User>('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          ...user,
          password: user.password || 'password123',
        }),
      }),
    updateRole: (userId: string, role: UserRole) =>
      request<User>(`/api/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    delete: (userId: string) =>
      request<null>(`/api/users/${userId}`, {
        method: 'DELETE',
      }),
  },

  // Weekly Reports API
  reports: {
    getAll: (filters?: { week?: string; userId?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (filters?.week) params.append('week', filters.week);
      if (filters?.userId) params.append('user_id', filters.userId);
      if (filters?.status) params.append('status', filters.status);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      return request<WeeklyReport[]>(`/api/reports${queryString}`);
    },
    getById: (id: string) => request<WeeklyReport>(`/api/reports/${id}`),
    saveDraft: (report: Partial<WeeklyReport>) =>
      request<WeeklyReport>('/api/reports/draft', {
        method: 'POST',
        body: JSON.stringify(report),
      }),
    submit: (report: Partial<WeeklyReport>) =>
      request<WeeklyReport>('/api/reports/submit', {
        method: 'POST',
        body: JSON.stringify(report),
      }),
    approve: (id: string, reviewer: { id: string; name: string; role: string }, comment?: string) =>
      request<WeeklyReport>(`/api/reports/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewer, comment: comment || 'Report reviewed and approved.' }),
      }),
    requestChanges: (id: string, reviewer: { id: string; name: string; role: string }, comment: string) =>
      request<WeeklyReport>(`/api/reports/${id}/request-changes`, {
        method: 'POST',
        body: JSON.stringify({ reviewer, comment }),
      }),
    getMetrics: (week?: string) => {
      const qs = week ? `?week=${encodeURIComponent(week)}` : '';
      return request<DashboardMetrics>(`/api/reports/metrics/summary${qs}`);
    },
  },

  // Project Categories API
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
      request<null>(`/api/projects/${id}`, {
        method: 'DELETE',
      }),
  },

  // Activity Feed API
  activities: {
    getAll: (limit: number = 30) => request<ActivityFeedItem[]>(`/api/activities?limit=${limit}`),
  },

  // AI Chat Assistant API
  chat: {
    ask: (message: string, selectedWeek?: string) =>
      request<{ reply: string }>('/api/chat/ask', {
        method: 'POST',
        body: JSON.stringify({ message, selectedWeek }),
      }),
  },
};
