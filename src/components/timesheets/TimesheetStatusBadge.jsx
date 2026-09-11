import React from 'react';
import { cn } from '@/lib/utils';

const VARIANTS = {
  pending: 'bg-warning/15 text-warning border-warning/40',
  approved: 'bg-success/15 text-success border-success/40',
  rejected: 'bg-destructive/15 text-destructive border-destructive/40',
};

const LABELS = { pending: 'Pending Approval', approved: 'Approved', rejected: 'Rejected' };

export default function TimesheetStatusBadge({ status, className }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
      VARIANTS[status] || VARIANTS.pending,
      className
    )}>
      {LABELS[status] || status}
    </span>
  );
}