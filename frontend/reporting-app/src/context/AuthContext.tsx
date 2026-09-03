/* eslint-disable react-refresh/only-export-components */
import type React from 'react';
import { useAuthStore } from '../store/useAuthStore';

// Direct export of Zustand hook for full reactivity and zero boilerplate
export const useAuth = useAuthStore;

// Pass-through Provider for backward compatibility
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
