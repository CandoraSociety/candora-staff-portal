import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Hourglass, CalendarClock, ArrowDownAZ } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ELLWaitlistCard from '@/components/ell/ELLWaitlistCard';
import ELLWaitlistUpdateDialog from '@/components/ell/ELLWaitlistUpdateDialog';
import { ELL_WAITLIST_STATUS_OPTIONS, ELL_CLB_LABELS } from '@/lib/ellConstants';
import { useCrossWaitlistIndex, findOtherWaitlists } from '@/lib/waitlistCrossRef';

// ELL waitlist — mirrors the EmpowerU waitlist: everyone waiting for a spot,
// ordered oldest first with an alphabetical toggle, light contact tracking with
// status chips and follow-ups, and cross-program waitlist badges. Central
// Registration reads these same records in its Waitlists tab.
export default function ELLWaitlist() {
  const [sortMode, setSortMode] = useState('date'); // 'date' = oldest first, 'alpha' = A→Z
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: learners = [], isLoading } = useQuery({ queryKey: ['ellLearners'], queryFn: () => base44.entities.ELLLearner.filter({ enrollment_status: 'waitlisted' }, { limit: 500 }) });
  const { data: wlIndex = [] } = useCrossWaitlistIndex();

  const waitlisted = (learners.items || learners || []).map((l) => ({
    id: l.id,
    first_name: l.first_name,
    last_name: l.last_name,
    full_name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
    date_of_birth: l.date_of_birth,
    phone: l.phone,
    email: l.email,
    country_of_origin: l.country_of_origin,
    first_language: l.first_language,
    other_languages: l.other_languages,
    clb_label: ELL_CLB_LABELS[l.clb_level] || null,
    interested_course_name: l.interested_course_name,
    date_added: l.waitlist_date || l.intake_date || null,
    intake_date: l.intake_date,
    referral_source: l.referral_source,
    waitlist_status: l.waitlist_status || 'waiting',
    last_contact_note: l.last_contact_note,
    last_contacted_date: l.last_contacted_date,
    follow_up_date: l.follow_up_date,
    notes: l.notes,
    progress_notes: l.progress_notes,
  }));

  const counts = Object.fromEntries(ELL_WAITLIST_STATUS_OPTIONS.map((o) => [o.value, waitlisted.filter((w) => (w.waitlist_status || 'waiting') === o.value).length]));

  const byDate = [...waitlisted].sort((a, b) => new Date(a.date_added || 0) - new Date(b.date_added || 0));
  const positionById = new Map(byDate.map((w, i) => [w.id, i + 1]));

  let visible = statusFilter === 'all' ? waitlisted : waitlisted.filter((w) => (w.waitlist_status || 'waiting') === statusFilter);
  visible = [...visible].sort((a, b) =>
    sortMode === 'alpha'
      ? a.full_name.localeCompare(b.full_name)
      : new Date(a.date_added || 0) - new Date(b.date_added || 0)
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['ellLearners'] });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Waitlist</h1>
          <p className="text-muted-foreground text-sm mt-1">People waiting for a spot in the ELL program, oldest first. Track contact status and follow-ups here; badges show any other program waitlists they're on.</p>
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
        {ELL_WAITLIST_STATUS_OPTIONS.map((o) => (
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
          {visible.map((entry, idx) => (
            <ELLWaitlistCard
              key={entry.id}
              entry={entry}
              shaded={idx % 2 === 1}
              position={positionById.get(entry.id)}
              expanded={expandedId === entry.id}
              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              onEdit={() => setEditing(entry)}
              otherWaitlists={findOtherWaitlists(entry, wlIndex, 'ell')}
            />
          ))}
        </div>
      )}

      {editing && <ELLWaitlistUpdateDialog entry={editing} open onClose={() => setEditing(null)} onSaved={refresh} />}
    </div>
  );
}