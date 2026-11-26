import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, Eye } from 'lucide-react';
import { applicationMeta, formatWhen } from '@/lib/websitePrograms';
import { cn } from '@/lib/utils';

// One volunteer application, with the decisions staff make on it. Nothing is
// approved by the website, so this is where an application moves.
export default function ApplicationRow({ application, busy, onDecide }) {
  const meta = applicationMeta(application.status);

  return (
    <div className="rounded-xl border bg-card p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold leading-tight">{application.full_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {application.email}
            {application.phone ? ` · ${application.phone}` : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {application.role_title}
            {application.created_date ? ` · applied ${formatWhen(application.created_date)}` : ''}
          </p>
        </div>
        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', meta.tone)}>
          {meta.label}
        </span>
      </div>

      <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-1">
        {application.availability && <p><span className="font-semibold text-foreground">Availability:</span> {application.availability}</p>}
        {application.skills && <p><span className="font-semibold text-foreground">Skills:</span> {application.skills}</p>}
        {application.experience && <p><span className="font-semibold text-foreground">Experience:</span> {application.experience}</p>}
        {application.references && <p><span className="font-semibold text-foreground">References:</span> {application.references}</p>}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {application.status === 'submitted' && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onDecide('in_review')}>
            <Eye className="w-3.5 h-3.5 mr-1" /> In review
          </Button>
        )}
        {application.status !== 'approved' && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onDecide('approved')}>
            <Check className="w-3.5 h-3.5 mr-1" /> Approve
          </Button>
        )}
        {application.status !== 'waitlisted' && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onDecide('waitlisted')}>
            <Clock className="w-3.5 h-3.5 mr-1" /> Waitlist
          </Button>
        )}
        {application.status !== 'declined' && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDecide('declined')}>
            <X className="w-3.5 h-3.5 mr-1" /> Decline
          </Button>
        )}
      </div>
    </div>
  );
}