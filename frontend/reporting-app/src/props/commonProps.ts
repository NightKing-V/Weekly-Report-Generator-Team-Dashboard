import type React from 'react';
import type { ReportStatus, PriorityLevel } from '../types';

export type NavigationTab =
  | 'personal-report'
  | 'report-history'
  | 'report-detail'
  | 'team-dashboard'
  | 'manager-review'
  | 'member-profile'
  | 'projects'
  | 'users';

export interface StatusBadgeProps {
  status: ReportStatus | 'Not Started';
  size?: 'sm' | 'md' | 'lg';
}

export interface PriorityBadgeProps {
  priority: PriorityLevel;
  size?: 'sm' | 'md';
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export interface NavbarProps {
  onOpenAiAssistant: () => void;
}

export interface SidebarProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
}

