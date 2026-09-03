/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, role?: UserRole) => boolean;
  register: (name: string, email: string, role: UserRole, title?: string, department?: string) => User;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  removeUser: (userId: string) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('team_dashboard_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedId = localStorage.getItem('team_dashboard_current_user_id');
    if (savedId) {
      const found = users.find((u) => u.id === savedId);
      if (found) return found;
    }
    // Default to manager for rich initial dashboard view, or team member
    return users[0] || null;
  });

  useEffect(() => {
    localStorage.setItem('team_dashboard_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('team_dashboard_current_user_id', currentUser.id);
    } else {
      localStorage.removeItem('team_dashboard_current_user_id');
    }
  }, [currentUser]);

  const login = (email: string, role?: UserRole): boolean => {
    let found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      if (role && found.role !== role) {
        found = { ...found, role };
        setUsers((prev) => prev.map((u) => (u.id === found!.id ? found! : u)));
      }
      setCurrentUser(found);
      return true;
    }

    // If email not found, create demo user
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: role || 'team_member',
      title: role === 'manager' ? 'Engineering Lead' : 'Software Engineer',
      department: 'Engineering',
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    return true;
  };

  const register = (
    name: string,
    email: string,
    role: UserRole,
    title: string = 'Software Engineer',
    department: string = 'Engineering'
  ): User => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      title,
      department,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    return newUser;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }
  };

  const removeUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser && currentUser.id === userId) {
      const remaining = users.filter((u) => u.id !== userId);
      setCurrentUser(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        register,
        logout,
        switchUser,
        updateUserRole,
        removeUser,
        addUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
