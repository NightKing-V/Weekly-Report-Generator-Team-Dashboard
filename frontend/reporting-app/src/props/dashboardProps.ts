import type {
  WeeklyReport,
  ProjectCategory,
  User,
  ActivityFeedItem,
} from '../types';

export interface AnalyticsChartsProps {
  reports: WeeklyReport[];
  projects: ProjectCategory[];
}

export interface SideBySideComparisonProps {
  reports: WeeklyReport[];
  selectedWeek: string;
}

export interface ReportsFilterBarProps {
  users: User[];
  projects: ProjectCategory[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedMemberId: string;
  onMemberChange: (id: string) => void;
  selectedProjectId: string;
  onProjectChange: (id: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onReset: () => void;
}

export interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  onSelectReport?: (reportId: string) => void;
}

