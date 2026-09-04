import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { apiClient, getAuthToken, setAuthToken } from '../services/api';

const STORAGE_KEY = 'team_dashboard_current_user';

const getInitialCurrentUser = (): User | null => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && (parsed.id || parsed.email)) {
        const email = parsed.email || 'user@team.com';
        const fallbackName = email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase());
        return {
          id: parsed.id || 'user-default',
          name: parsed.name || fallbackName || 'Team Member',
          email,
          role: parsed.role || 'team_member',
          title: parsed.title || 'Software Engineer',
          department: parsed.department || 'Engineering',
          avatarUrl: parsed.avatarUrl || null,
          createdAt: parsed.createdAt || null,
        };
      }
    } catch {
      // ignore
    }
  }
  return null;
};

interface AuthState {
  currentUser: User | null;
  token: string | null;
  users: User[];
  loading: boolean;

  fetchUsers: (force?: boolean) => Promise<User[]>;
  login: (email: string, password?: string, role?: UserRole) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    password?: string,
    role?: UserRole,
    title?: string,
    department?: string
  ) => Promise<User>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  addUser: (userData: Omit<User, 'id' | 'createdAt'> & { password?: string }) => Promise<User>;
  switchUser: (userId: string) => void;
  logout: () => void;
  setCurrentUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: getInitialCurrentUser(),
  token: getAuthToken(),
  users: [],
  loading: false,

  fetchUsers: async (force = false) => {
    if (!force && get().users.length > 0) {
      return get().users;
    }
    set({ loading: true });
    try {
      const users = await apiClient.users.getAll();
      set({ users, loading: false });
      return users;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  login: async (email: string, password?: string, role?: UserRole) => {
    set({ loading: true });
    try {
      const response = await apiClient.users.login(email, password, role);
      const user = response.user;
      const token = response.access_token;

      setAuthToken(token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

      set((state) => {
        const exists = state.users.some((u) => u.id === user.id);
        return {
          currentUser: user,
          token,
          users: exists ? state.users : [...state.users, user],
          loading: false,
        };
      });
      return true;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (name, email, password, role = 'team_member', title, department) => {
    set({ loading: true });
    try {
      const response = await apiClient.users.register({
        name,
        email,
        password: password || 'password123',
        role,
        title: title || 'Software Engineer',
        department: department || 'Engineering',
      });
      const created = response.user;
      const token = response.access_token;

      setAuthToken(token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(created));

      set((state) => ({
        currentUser: created,
        token,
        users: [...state.users, created],
        loading: false,
      }));
      return created;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  addUser: async (userData) => {
    set({ loading: true });
    try {
      const created = await apiClient.users.create(userData);
      set((state) => ({
        users: [...state.users, created],
        loading: false,
      }));
      return created;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  updateUserRole: async (userId, newRole) => {
    const updated = await apiClient.users.updateRole(userId, newRole);
    set((state) => {
      const users = state.users.map((u) => (u.id === userId ? updated : u));
      let currentUser = state.currentUser;
      if (currentUser && currentUser.id === userId) {
        currentUser = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return { users, currentUser };
    });
  },

  removeUser: async (userId) => {
    await apiClient.users.delete(userId);
    set((state) => {
      const users = state.users.filter((u) => u.id !== userId);
      let currentUser = state.currentUser;
      if (currentUser && currentUser.id === userId) {
        currentUser = null;
        setAuthToken(null);
        localStorage.removeItem(STORAGE_KEY);
      }
      return { users, currentUser };
    });
  },

  switchUser: (userId) => {
    const user = get().users.find((u) => u.id === userId);
    if (user) {
      set({ currentUser: user });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  },

  logout: () => {
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
    set({ currentUser: null, token: null });
  },

  setCurrentUser: (user) => {
    set({ currentUser: user });
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      setAuthToken(null);
      localStorage.removeItem(STORAGE_KEY);
      set({ token: null });
    }
  },
}));
