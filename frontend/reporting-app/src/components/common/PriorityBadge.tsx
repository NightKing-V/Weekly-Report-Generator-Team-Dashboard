import React from 'react';
import { getPriorityColor } from '../../utils/formatters';
import type { PriorityBadgeProps } from '../../props';

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
