import type {
  CompletedTask,
  HoursWorkedBreakdown,
  WeeklyReport,
} from '../types';

export interface TaskTableProps {
  tasks: CompletedTask[];
  onChange: (tasks: CompletedTask[]) => void;
  readOnly?: boolean;
}

export interface HoursBreakdownProps {
  hours: HoursWorkedBreakdown;
  onChange: (hours: HoursWorkedBreakdown) => void;
  readOnly?: boolean;
}

export interface ReportFormProps {
  initialReport?: Partial<WeeklyReport>;
  onSaveDraft: (data: Partial<WeeklyReport>) => void;
  onSubmit: (data: Partial<WeeklyReport>) => void;
  isSubmitting?: boolean;
}

export interface VersionHistoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  report: WeeklyReport;
}

export interface ReviewActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportAuthor: string;
  weekLabel: string;
  initialAction?: 'approve' | 'request_changes';
  onApprove: (reportId: string, comment?: string) => void;
  onRequestChanges: (reportId: string, comment: string) => void;
}
