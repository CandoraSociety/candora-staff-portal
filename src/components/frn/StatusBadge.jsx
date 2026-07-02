import React from 'react';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/frnConstants';

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  const color = STATUS_COLORS[status] || '#64748b';
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
      style={{ backgroundColor: color + '20', color }}
    >
      {label}
    </span>
  );
}