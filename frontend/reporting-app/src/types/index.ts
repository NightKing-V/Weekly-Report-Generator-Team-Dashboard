export type UserRole = 'team_member' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  title: string;
  department: string;
  createdAt: string;
}

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TaskStatus = 'In Progress' | 'Completed' | 'Blocked';

export interface CompletedTask {
  id: string;
  taskName: string;
  priority: PriorityLevel;
  plannedPercent: number;
  actualPercent: number;
  status: TaskStatus;
  plannedHours: number;
  spentHours: number;
  outputDeliverable: string;
}

export interface PlannedTask {
  id: string;
  taskName: string;
  priority: PriorityLevel;
  estimatedHours: number;
  notes?: string;
}

export interface BlockerItem {
  id: string;
  description: string;
  isKeyIssue: boolean;
  impact?: string;
}

export interface AchievementItem {
  id: string;
  description: string;
  isKeyAchievement: boolean;
}

export interface HoursWorkedBreakdown {
  development: number;
  testing: number;
  meetings: number;
  documentation: number;
  other?: number;
}

export type ReportStatus = 'Draft' | 'Submitted' | 'Needs Correction' | 'Approved';

export interface ReviewComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  comment: string;
  action: 'approve' | 'request_changes';
  createdAt: string;
  versionNumber: number;
}

export interface ReportVersion {
  versionNumber: number;
  submittedAt: string;
  submittedBy: string;
  content: {
    weekStartDate: string;
    weekEndDate: string;
    weekLabel: string;
    projectId: string;
    tasksCompleted: CompletedTask[];
    tasksPlannedNextWeek: PlannedTask[];
    blockers: BlockerItem[];
    achievements: AchievementItem[];
    hoursWorked: HoursWorkedBreakdown;
    notesOrLinks?: string;
  };
  reviewComment?: ReviewComment;
}

export interface WeeklyReport {
  id: string;
  userId: string;
  userName: string;
  userTitle: string;
  userDepartment: string;
  weekStartDate: string;
  weekEndDate: string;
  weekLabel: string;
  projectId: string;
  projectName: string;
  status: ReportStatus;
  tasksCompleted: CompletedTask[];
  tasksPlannedNextWeek: PlannedTask[];
  blockers: BlockerItem[];
  achievements: AchievementItem[];
  hoursWorked: HoursWorkedBreakdown;
  notesOrLinks?: string;
  currentVersion: number;
  versions: ReportVersion[];
  reviewHistory: ReviewComment[];
  latestManagerComment?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'Active' | 'Completed' | 'On Hold';
  color: string;
  assignedMemberIds: string[];
  createdAt: string;
}

export interface ActivityFeedItem {
  id: string;
  type: 'submitted' | 'approved' | 'correction_requested' | 'draft_saved';
  actorName: string;
  actorRole: UserRole;
  reportId: string;
  weekLabel: string;
  message: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalSubmittedThisWeek: number;
  submissionComplianceRate: number; // percentage
  needsCorrectionCount: number;
  openBlockersCount: number;
  totalTeamMembers: number;
  approvedCount: number;
  pendingReviewCount: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
