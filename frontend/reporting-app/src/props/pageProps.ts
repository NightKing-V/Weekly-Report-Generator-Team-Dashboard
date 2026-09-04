export interface PersonalReportPageProps {
  onViewHistory: () => void;
  onViewDetails: (reportId: string) => void;
}

export interface ReportHistoryPageProps {
  onOpenReport: (reportId: string) => void;
  onCreateNew: () => void;
}

export interface ReportDetailPageProps {
  reportId: string;
  onBack: () => void;
  onEditReport?: (reportId?: string) => void;
}

export interface TeamPageProps {
  onOpenMemberProfile: (memberId: string) => void;
  onOpenReportDetail: (reportId: string) => void;
}

export interface TeamDashboardPageProps {
  onOpenReportDetail: (reportId: string) => void;
  onOpenMemberProfile: (memberId: string) => void;
}

export interface ManagerReviewPageProps {
  onOpenReportDetail: (reportId: string) => void;
}

export interface TeamMemberProfilePageProps {
  memberId: string;
  onBack: () => void;
  onOpenReport: (reportId: string) => void;
}
