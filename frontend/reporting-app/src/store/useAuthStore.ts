import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { apiClient } from '../services/api';

const STORAGE_KEY = 'team_dashboard_current_user';

const getInitialCurrentUser = (): User | null => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return null;
};

interface AuthState {
  currentUser: User | null;
  users: User[];
  loading: boolean;

  fetchUsers: () => Promise<User[]>;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    role: UserRole,
    title?: string,
    department?: string
  ) => Promise<User>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  switchUser: (userId: string) => void;
  logout: () => void;
  setCurrentUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: getInitialCurrentUser(),
  users: [],
  loading: false,

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const users = await apiClient.users.getAll();
      set((state) => {
        let updatedCurrent = state.currentUser;
        if (state.currentUser) {
          const found = users.find((u) => u.id === state.currentUser?.id);
          if (found) updatedCurrent = found;
        }
        return { users, currentUser: updatedCurrent, loading: false };
      });
      return users;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  login: async (email: string, role?: UserRole) => {
    set({ loading: true });
    try {
      const user = await apiClient.users.login(email, role);
      set((state) => {
        const exists = state.users.some((u) => u.id === user.id);
        return {
          currentUser: user,
          users: exists ? state.users : [...state.users, user],
          loading: false,
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return true;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (name, email, role, title, department) => {
    set({ loading: true });
    try {
      const created = await apiClient.users.create({
        name,
        email,
        role,
        title: title || 'Software Engineer',
        department: department || 'Engineering',
      });
      set((state) => ({
        currentUser: created,
        users: [...state.users, created],
        loading: false,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(created));
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
    set({ currentUser: null });
    localStorage.removeItem(STORAGE_KEY);
  },

  setCurrentUser: (user) => {
    set({ currentUser: user });
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
}));

