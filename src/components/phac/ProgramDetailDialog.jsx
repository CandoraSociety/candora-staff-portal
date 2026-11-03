import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Pencil, CalendarDays, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/phac/StatusBadge';
import ProgramDocuments from '@/components/programs/ProgramDocuments';
import {
  PROGRAM_STATUS_OPTIONS, WEEKDAY_LABELS, MONTH_LABELS, formatAgeRange, PHAC_PROGRAM_CATEGORY_LABELS,
} from '@/lib/phacConstants';
import { todayISO } from '@/lib/sessionOccurrences';

const fmtDate = (str) => str ? new Date(str + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export default function ProgramDetailDialog({ open, onOpenChange, program, onEdit, onAddSession, onChanged }) {
  const { data: sessions = [] } = useQuery({
    queryKey: ['phac-sessions'],
    queryFn: () => base44.entities.PHACSession.list('session_date', 500),
    enabled: open,
  });

  const [documents, setDocuments] = useState(program?.documents || []);

  useEffect(() => {
    setDocuments(program?.documents || []);
  }, [program?.id, program?.updated_date]);

  if (!program) return null;

  const saveDocuments = async (next) => {
    setDocuments(next);
    await base44.entities.PHACProgram.update(program.id, { documents: next });
    onChanged?.();
  };

  const programSessions = sessions.filter(s =>
    s.program_id === program.id || (s.program_name || '').toLowerCase() === (program.name || '').toLowerCase()
  );
  const upcoming = programSessions.filter(s => s.session_date >= todayISO()).slice(0, 5);

  const schedule = [
    (program.schedule_days || []).map(d => WEEKDAY_LABELS[d]?.slice(0, 3)).join(', '),
    program.start_time ? `${program.start_time}${program.end_time ? `–${program.end_time}` : ''}` : '',
  ].filter(Boolean).join(' · ');

  const details = [
    ['Category', PHAC_PROGRAM_CATEGORY_LABELS[program.category] || '—'],
    ['Ages', formatAgeRange(program.target_age_min_months, program.target_age_max_months)],
    ['Schedule', schedule || '—'],
    ['Location', program.location || '—'],
    ['Facilitator', program.facilitator || '—'],
    ['Capacity', program.capacity ? `${program.capacity} families` : '—'],
    ['Coordinator', program.coordinator_name || '—'],
    ['Season', `${MONTH_LABELS[program.season_start_month] || '—'} – ${MONTH_LABELS[program.season_end_month] || '—'}`],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="text-xl">{program.name}</DialogTitle>
              <div className="mt-1"><StatusBadge status={program.status} options={PROGRAM_STATUS_OPTIONS} /></div>
            </div>
            <Button size="sm" variant="outline" onClick={() => onEdit?.(program)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
          </div>
        </DialogHeader>

        {program.description && <p className="text-sm text-muted-foreground">{program.description}</p>}

        {program.eligibility && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Eligibility</p>
            <p className="text-sm text-foreground">{program.eligibility}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {details.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-foreground truncate">{value}</p>
            </div>
          ))}
        </div>

        {program.coordinator_email && (
          <p className="text-xs text-muted-foreground">Coordinator email: {program.coordinator_email}</p>
        )}

        {program.notes && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-foreground whitespace-pre-line">{program.notes}</p>
          </div>
        )}

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Sessions ({programSessions.length})</p>
            <Button size="sm" variant="outline" onClick={() => onAddSession?.(program)}><Plus className="h-3.5 w-3.5" /> New Session</Button>
          </div>
          {programSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions scheduled for this program yet.</p>
          ) : (
            <div className="space-y-1">
              {(upcoming.length ? upcoming : programSessions.slice(0, 5)).map(s => {
                const lastDate = [...new Set((s.attendance || []).map(a => a.date))].sort().pop();
                const inCount = (s.attendance || []).filter(a => a.date === lastDate && (a.status === 'present' || a.status === 'late')).length;
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm">
                    <span className="text-foreground">{fmtDate(s.session_date)}{s.start_time ? ` · ${s.start_time}` : ''}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.facilitator || '—'}{inCount ? ` · ${inCount} in` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <ProgramDocuments
            documents={documents}
            onChange={saveDocuments}
            emptyText="No course documents yet — upload the handouts, curriculum or forms for this program."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}