import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Hourglass, Link2, Check, CalendarClock, ArrowDownAZ, Phone, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/dateUtils';

// EmpowerU waitlist — every registration with status 'waitlisted', ordered by
// date added (oldest first) with an alphabetical toggle. Each entry can copy a
// personal registration link whose first/last name is pre-filled and locked on
// the public form, so the link can't be reused by someone else.
export default function EmpowerUWaitlist() {
  const [sortMode, setSortMode] = useState('date'); // 'date' = oldest first, 'alpha' = A→Z
  const [copiedId, setCopiedId] = useState(null);
  const { toast } = useToast();

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
    };
  });

  const sorted = [...waitlisted].sort((a, b) =>
    sortMode === 'alpha'
      ? a.full_name.localeCompare(b.full_name)
      : new Date(a.date_added || 0) - new Date(b.date_added || 0)
  );

  const copyLink = async (entry) => {
    if (!entry.cohort_id) {
      toast({ title: 'This waitlist entry has no cohort — link unavailable', variant: 'destructive' });
      return;
    }
    const url = `${window.location.origin}/empoweru-apply/${entry.cohort_id}?first=${encodeURIComponent(entry.first_name)}&last=${encodeURIComponent(entry.last_name)}`;
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
          <p className="text-muted-foreground text-sm mt-1">People waiting for a spot in an EmpowerU cohort, oldest first. The registration link copies with their name pre-filled and locked, so it can't be forwarded to someone else.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Button size="sm" variant={sortMode === 'date' ? 'default' : 'ghost'} onClick={() => setSortMode('date')}><CalendarClock className="h-3.5 w-3.5" /> Date Added</Button>
          <Button size="sm" variant={sortMode === 'alpha' ? 'default' : 'ghost'} onClick={() => setSortMode('alpha')}><ArrowDownAZ className="h-3.5 w-3.5" /> Alphabetical</Button>
        </div>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : sorted.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2"><Hourglass className="h-5 w-5" /> No one is on the waitlist right now.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((entry, i) => (
            <Card key={entry.id}><CardContent className="p-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-foreground truncate">{entry.full_name}</p>
                    <span className="text-xs text-muted-foreground">#{i + 1}</span>
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
                </div>
                <Button size="sm" variant="outline" onClick={() => copyLink(entry)} disabled={!entry.first_name || !entry.cohort_id} className={cn('flex-shrink-0', copiedId === entry.id && 'text-success border-success')}>
                  {copiedId === entry.id ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                  {copiedId === entry.id ? 'Copied' : 'Copy Registration Link'}
                </Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}