import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, Ban, UserCheck, UserX, ArrowUp, ArrowDown } from 'lucide-react';
import { registrationMeta, formatWhen } from '@/lib/websitePrograms';
import { cn } from '@/lib/utils';

// One person in a program queue, with the decisions staff make on them. Every
// button calls the server, so a seat is never handed out by the page.
export default function RegistrationRow({ registration, program, busy, onDecide, onMove }) {
  const meta = registrationMeta(registration.status);
  const waitlisted = registration.status === 'waitlisted';

  return (
    <div className="rounded-xl border bg-card p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold leading-tight">
            {registration.full_name}
            {waitlisted && registration.waitlist_position ? (
              <span className="ml-2 text-xs font-bold text-violet-700">#{registration.waitlist_position}</span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {registration.email}
            {registration.phone ? ` · ${registration.phone}` : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {program?.name || registration.program_name}
            {registration.created_date ? ` · asked ${formatWhen(registration.created_date)}` : ''}
          </p>
        </div>
        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', meta.tone)}>
          {meta.label}
        </span>
      </div>

      {(registration.accessibility_needs || registration.notes || registration.preferred_language) && (
        <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
          {registration.preferred_language && <p>Language: {registration.preferred_language}</p>}
          {registration.accessibility_needs && <p>Accessibility: {registration.accessibility_needs}</p>}
          {registration.notes && <p>Notes: {registration.notes}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {registration.status !== 'confirmed' && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onDecide('approve')}>
            <Check className="w-3.5 h-3.5 mr-1" /> Approve
          </Button>
        )}
        {registration.status !== 'declined' && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onDecide('decline')}>
            <X className="w-3.5 h-3.5 mr-1" /> Decline
          </Button>
        )}
        {!waitlisted && registration.status !== 'cancelled' && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onDecide('waitlist')}>
            <Clock className="w-3.5 h-3.5 mr-1" /> Waitlist
          </Button>
        )}
        {waitlisted && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onDecide('promote')}>
            <UserCheck className="w-3.5 h-3.5 mr-1" /> Offer seat
          </Button>
        )}
        {['confirmed', 'attended', 'no_show'].includes(registration.status) && (
          <>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDecide('attended')}>
              <UserCheck className="w-3.5 h-3.5 mr-1" /> Attended
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDecide('no_show')}>
              <UserX className="w-3.5 h-3.5 mr-1" /> No show
            </Button>
          </>
        )}
        {!['cancelled', 'declined'].includes(registration.status) && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDecide('cancel')}>
            <Ban className="w-3.5 h-3.5 mr-1" /> Cancel
          </Button>
        )}
        {waitlisted && (
          <span className="flex items-center gap-1 ml-auto">
            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={busy} onClick={() => onMove(-1)} aria-label="Move up">
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={busy} onClick={() => onMove(1)} aria-label="Move down">
              <ArrowDown className="w-3.5 h-3.5" />
            </Button>
          </span>
        )}
      </div>
    </div>
  );
}