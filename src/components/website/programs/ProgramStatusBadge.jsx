import React from 'react';
import { statusMeta } from '@/lib/websitePrograms';
import { cn } from '@/lib/utils';

// The one place a program's status is drawn, so the list, the editor and the
// program page all read the same words in the same colour.
export default function ProgramStatusBadge({ status, className }) {
  const meta = statusMeta(status);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        meta.tone,
        className
      )}
    >
      {meta.label}
    </span>
  );
}