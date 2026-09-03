import React from 'react';
import type { PriorityLevel } from '../../types';
import { getPriorityColor } from '../../utils/formatters';

interface PriorityBadgeProps {
  priority: PriorityLevel;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const colors = getPriorityColor(priority);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {priority}
    </span>
  );
};
