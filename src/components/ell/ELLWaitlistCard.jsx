import React from 'react';
import { Phone, Mail, Pencil, BellRing, ChevronDown, User, BookOpen, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dateUtils';
import CrossWaitlistBadges from '@/components/shared/CrossWaitlistBadges';
import { ELL_WAITLIST_STATUS_OPTIONS, ELL_CLB_LABELS } from '@/lib/ellConstants';

const todayISO = () => new Date().toISOString().slice(0, 10);

export function StatusChip({ status }) {
  const opt = ELL_WAITLIST_STATUS_OPTIONS.find((o) => o.value === status) || ELL_WAITLIST_STATUS_OPTIONS[0];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-foreground">
      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
      {opt.label}
    </span>
  );
}

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p className="text-xs text-foreground mt-0.5 break-words">{value}</p>
    </div>
  );
}

// One ELL waitlist entry — mirrors the EmpowerU WaitlistEntryCard: collapsed
// shows name, status chip, waitlist info, contact info and follow-up; clicking
// the header expands a full profile panel with everything on file.
export default function ELLWaitlistCard({ entry, position, expanded, onToggle, onEdit, otherWaitlists }) {
  const overdue = entry.follow_up_date && entry.follow_up_date < todayISO();

  return (
    <Card><CardContent className="p-3">
      <button type="button" onClick={onToggle} className="w-full text-left" aria-expanded={expanded}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm text-foreground truncate">{entry.full_name}</p>
              <span className="text-xs text-muted-foreground">#{position}</span>
              <StatusChip status={entry.waitlist_status} />
              <CrossWaitlistBadges otherWaitlists={otherWaitlists} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entry.clb_label ? `Level ${entry.clb_label}` : 'Level not assessed'}{entry.date_added ? ` · Waiting since ${formatDate(entry.date_added)}` : ''}
            </p>
            {(entry.phone || entry.email) && (
              <p className="text-xs text-muted-foreground/80 mt-0.5 flex items-center gap-3 flex-wrap">
                {entry.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{entry.phone}</span>}
                {entry.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{entry.email}</span>}
              </p>
            )}
            {(entry.last_contact_note || entry.last_contacted_date) && (
              <p className="text-xs text-muted-foreground/80 mt-0.5 flex items-center gap-1.5 flex-wrap">
                {entry.last_contacted_date && <span className="whitespace-nowrap">Last contact {formatDate(entry.last_contacted_date)}</span>}
                {entry.last_contact_note && <span>· {entry.last_contact_note}</span>}
              </p>
            )}
            {entry.follow_up_date && (
              <p className={cn('text-xs mt-0.5 flex items-center gap-1', overdue ? 'text-destructive font-medium' : 'text-muted-foreground/80')}>
                <BellRing className="h-3 w-3" /> Follow up {formatDate(entry.follow_up_date)}{overdue ? ' — overdue' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /> Update</Button>
            </span>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-4">
          <div>
            <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mb-2"><User className="h-3.5 w-3.5" /> Contact</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Detail label="Phone" value={entry.phone} />
              <Detail label="Email" value={entry.email} />
              <Detail label="Date of birth" value={entry.date_of_birth ? formatDate(entry.date_of_birth) : null} />
              <Detail label="Country of origin" value={entry.country_of_origin} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mb-2"><BookOpen className="h-3.5 w-3.5" /> Language</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Detail label="First language" value={entry.first_language} />
              <Detail label="Other languages" value={(entry.other_languages || []).join(', ')} />
              <Detail label="CLB level" value={entry.clb_label} />
              <Detail label="Referral source" value={entry.referral_source} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mb-2"><CalendarDays className="h-3.5 w-3.5" /> Waitlist details</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Detail label="Waitlist position" value={`#${position}`} />
              <Detail label="Interested level / course" value={entry.interested_course_name} />
              <Detail label="Date added" value={entry.date_added ? formatDate(entry.date_added) : null} />
              <Detail label="Intake date" value={entry.intake_date ? formatDate(entry.intake_date) : null} />
              <Detail label="Follow up on" value={entry.follow_up_date ? formatDate(entry.follow_up_date) : null} />
              <Detail label="Last contacted" value={entry.last_contacted_date ? formatDate(entry.last_contacted_date) : null} />
              <div className="col-span-2 md:col-span-4">
                <Detail label="Also waitlisted for" value={otherWaitlists && otherWaitlists.length ? otherWaitlists.map((m) => m.label).join(', ') : null} />
              </div>
              <div className="col-span-2 md:col-span-4">
                <Detail label="Last contact note" value={entry.last_contact_note} />
              </div>
              <div className="col-span-2 md:col-span-4">
                <Detail label="Progress notes" value={entry.progress_notes} />
              </div>
              <div className="col-span-2 md:col-span-4">
                <Detail label="Notes" value={entry.notes} />
              </div>
            </div>
          </div>
        </div>
      )}
    </CardContent></Card>
  );
}