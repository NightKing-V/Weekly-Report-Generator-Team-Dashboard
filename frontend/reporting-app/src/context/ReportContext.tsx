/* eslint-disable react-refresh/only-export-components */
import type React from 'react';
import { useReportStore } from '../store/useReportStore';

// Direct export of Zustand hook for full reactivity and zero boilerplate
export const useReports = useReportStore;

// Pass-through Provider for backward compatibility
export const ReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
