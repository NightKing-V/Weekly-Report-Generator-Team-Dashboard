import type { CompletedTask, HoursWorkedBreakdown } from '../types';

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(dateString);
}

export function calculateTotalHours(hours: HoursWorkedBreakdown): number {
  return (
    (hours.development || 0) +
    (hours.testing || 0) +
    (hours.meetings || 0) +
    (hours.documentation || 0) +
    (hours.other || 0)
  );
}

export function calculateTaskMetrics(tasks: CompletedTask[]): {
  totalPlannedHours: number;
  totalSpentHours: number;
  averageCompletion: number;
  completedCount: number;
} {
  if (!tasks || tasks.length === 0) {
    return {
      totalPlannedHours: 0,
      totalSpentHours: 0,
      averageCompletion: 0,
      completedCount: 0,
    };
  }

  const totalPlannedHours = tasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0);
  const totalSpentHours = tasks.reduce((sum, t) => sum + (t.spentHours || 0), 0);
  const averageCompletion = Math.round(
    tasks.reduce((sum, t) => sum + (t.actualPercent || 0), 0) / tasks.length
  );
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;

  return {
    totalPlannedHours,
    totalSpentHours,
    averageCompletion,
    completedCount,
  };
}

export function getStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'Approved':
      return {
        bg: 'bg-emerald-50 text-emerald-700',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'Submitted':
      return {
        bg: 'bg-blue-50 text-blue-700',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'Needs Correction':
      return {
        bg: 'bg-amber-50 text-amber-800',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'Draft':
      return {
        bg: 'bg-slate-100 text-slate-700',
        text: 'text-slate-700',
        border: 'border-slate-300',
        dot: 'bg-slate-400',
      };
    default:
      return {
        bg: 'bg-gray-100 text-gray-600',
        text: 'text-gray-600',
        border: 'border-gray-200',
        dot: 'bg-gray-400',
      };
  }
}

export function getPriorityColor(priority: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (priority) {
    case 'Urgent':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    case 'High':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
      };
    case 'Medium':
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
      };
    case 'Low':
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-200',
      };
  }
}
