/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import type { User, UserRole } from '../types';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  switchUser,
  logout as logoutAction,
  loginUser,
  registerUser,
  updateUserRoleAsync,
  deleteUserAsync,
} from '../store/slices/authSlice';

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

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { currentUser, users } = useAppSelector((state) => state.auth);

  const login = (email: string, role?: UserRole): boolean => {
    dispatch(loginUser({ email, role }));
    return true;
  };

  const register = (
    name: string,
    email: string,
    role: UserRole,
    title?: string,
    department?: string
  ): User => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      title: title || 'Software Engineer',
      department: department || 'Engineering',
      createdAt: new Date().toISOString(),
    };
    dispatch(registerUser({ name, email, role, title, department }));
    return newUser;
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  const handleSwitchUser = (userId: string) => {
    dispatch(switchUser(userId));
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    dispatch(updateUserRoleAsync({ userId, role: newRole }));
  };

  const removeUser = (userId: string) => {
    dispatch(deleteUserAsync(userId));
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    dispatch(registerUser(userData));
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
        switchUser: handleSwitchUser,
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
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
