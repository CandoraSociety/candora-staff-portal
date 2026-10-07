import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Hourglass, Link2, Check, CalendarClock, ArrowDownAZ, Phone, Mail, Pencil, BellRing } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/dateUtils';
import { WAITLIST_STATUS_OPTIONS } from '@/lib/empoweruConstants';
import WaitlistEntryDialog from '@/components/empoweru/WaitlistEntryDialog';

const todayISO = () => new Date().toISOString().slice(0, 10);

function StatusChip({ status }) {
  const opt = WAITLIST_STATUS_OPTIONS.find((o) => o.value === status) || WAITLIST_STATUS_OPTIONS[0];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-foreground">
      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
      {opt.label}
    </span>
  );
}

// EmpowerU waitlist — every registration with status 'waitlisted', ordered by
// date added (oldest first) with an alphabetical toggle. Light contact tracking:
// status chip, last contact note/date and follow-up date on each entry, plus a
// personal registration link whose first/last name is pre-filled and locked.
export default function EmpowerUWaitlist() {
  const [sortMode, setSortMode] = useState('date'); // 'date' = oldest first, 'alpha' = A→Z
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading } = useQuery({ queryKey: ['empoweru-registrations'], queryFn: () => base44.entities.EmpowerURegistration.list() });
  const { data: participants = [] } = useQuery({ queryKey: ['empoweru-participants'], queryFn: () => base44.entities.EmpowerUParticipant.list() });
  const { data: cohorts = [] } = useQuery({ queryKey: ['empoweru-cohorts'], queryFn: () => base44.entities.EmpowerUCohort.list() });

  const waitlisted = registrations.filter(r => r.status === 'waitlisted').map(r => {
    const participant = participants.find(p => p.id === r.participant_id);
    const nameParts = (r.participant_name || '').trim().split(/\s+/).filter(Boolean);
    const first = participant?.first_name || nameParts[0] || '';
    const last = participant?.last_name || nameParts.slice(1).join(' ') || '';
    return {
      id: r.id,
      first_name: first,
      last_name: last,
      full_name: `${first} ${last}`.trim() || 'Unknown',
      cohort_id: r.cohort_id,
      cohort_name: cohorts.find(c => c.id === r.cohort_id)?.name || r.cohort_name || '',
      date_added: r.registration_date || null,
      phone: participant?.phone,
      email: participant?.email,
      waitlist_status: r.waitlist_status || 'waiting',
      last_contact_note: r.last_contact_note,
      last_contacted_date: r.last_contacted_date,
      follow_up_date: r.follow_up_date,
      participant,
    };
  });

  const counts = Object.fromEntries(WAITLIST_STATUS_OPTIONS.map(o => [o.value, waitlisted.filter(w => (w.waitlist_status || 'waiting') === o.value).length]));

  const byDate = [...waitlisted].sort((a, b) => new Date(a.date_added || 0) - new Date(b.date_added || 0));
  const positionById = new Map(byDate.map((w, i) => [w.id, i + 1]));

  let visible = statusFilter === 'all' ? waitlisted : waitlisted.filter(w => (w.waitlist_status || 'waiting') === statusFilter);
  visible = [...visible].sort((a, b) =>
    sortMode === 'alpha'
      ? a.full_name.localeCompare(b.full_name)
      : new Date(a.date_added || 0) - new Date(b.date_added || 0)
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['empoweru-registrations'] });

  const copyLink = async (entry) => {
    if (!entry.cohort_id) {
      toast({ title: 'This waitlist entry has no cohort — link unavailable', variant: 'destructive' });
      return;
    }
    // Personal link: everything already on file is pre-filled on the form, and
    // the name is locked so a forwarded link can only ever be used by this
    // person. The wl token ties the submission back to this waitlist entry.
    const p = entry.participant || {};
    const params = new URLSearchParams();
    params.set('first', entry.first_name);
    params.set('last', entry.last_name);
    params.set('wl', entry.id);
    const prefillFields = [
      ['dob', p.date_of_birth], ['gender', p.gender], ['marital', p.marital_status],
      ['identify', p.self_identification], ['citizen', p.citizenship], ['arrival', p.arrival_canada],
      ['origin', p.country_of_origin], ['language', p.family_language], ['hs', p.high_school_completed],
      ['address', p.address], ['phone', p.phone], ['email', p.email], ['emergency', p.emergency_contact],
    ];
    prefillFields.forEach(([key, value]) => { if (value) params.set(key, value); });
    const url = `${window.location.origin}/empoweru-apply/${entry.cohort_id}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: 'Personal registration link copied', description: 'Their name is pre-filled and locked on the form — the link can only be used by them.' });
    } catch {
      toast({ title: 'Could not copy the link — please copy it manually', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Waitlist</h1>
          <p className="text-muted-foreground text-sm mt-1">People waiting for a spot in an EmpowerU cohort, oldest first. Track contact status and follow-ups here; the registration link copies with their name pre-filled and locked.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Button size="sm" variant={sortMode === 'date' ? 'default' : 'ghost'} onClick={() => setSortMode('date')}><CalendarClock className="h-3.5 w-3.5" /> Date Added</Button>
          <Button size="sm" variant={sortMode === 'alpha' ? 'default' : 'ghost'} onClick={() => setSortMode('alpha')}><ArrowDownAZ className="h-3.5 w-3.5" /> Alphabetical</Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => setStatusFilter('all')} className={cn('rounded-full border px-3 py-1 text-xs', statusFilter === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted')}>
          All ({waitlisted.length})
        </button>
        {WAITLIST_STATUS_OPTIONS.map((o) => (
          <button key={o.value} onClick={() => setStatusFilter(o.value)} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs', statusFilter === o.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted')}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: o.color }} />
            {o.label} ({counts[o.value]})
          </button>
        ))}
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : visible.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2"><Hourglass className="h-5 w-5" /> No one is on the waitlist right now.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {visible.map((entry) => {
            const overdue = entry.follow_up_date && entry.follow_up_date < todayISO();
            return (
              <Card key={entry.id}><CardContent className="p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-foreground truncate">{entry.full_name}</p>
                      <span className="text-xs text-muted-foreground">#{positionById.get(entry.id)}</span>
                      <StatusChip status={entry.waitlist_status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.cohort_name || 'No cohort'}{entry.date_added ? ` · Added ${formatDate(entry.date_added)}` : ''}
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
                    <Button size="sm" variant="ghost" onClick={() => setEditing(entry)}><Pencil className="h-3.5 w-3.5" /> Update</Button>
                    <Button size="sm" variant="outline" onClick={() => copyLink(entry)} disabled={!entry.first_name || !entry.cohort_id} className={cn(copiedId === entry.id && 'text-success border-success')}>
                      {copiedId === entry.id ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                      {copiedId === entry.id ? 'Copied' : 'Copy Registration Link'}
                    </Button>
                  </div>
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}

      {editing && <WaitlistEntryDialog entry={editing} open onClose={() => setEditing(null)} onSaved={refresh} />}
    </div>
  );
}