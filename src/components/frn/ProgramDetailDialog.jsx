import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Pencil, Users, CalendarDays, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/frn/StatusBadge';
import ProgramDocuments from '@/components/programs/ProgramDocuments';
import { FRN_PROGRAM_CATEGORY_LABELS, FRN_PROGRAM_STATUS_OPTIONS, enrolledReferralsForProgram, todayISO } from '@/lib/frnPrograms';

const fmtDate = (str) => str ? new Date(str + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export default function ProgramDetailDialog({ open, onOpenChange, program, onEdit, onAddSession, onChanged }) {
  const { data: referrals = [] } = useQuery({
    queryKey: ['frn-referrals'],
    queryFn: () => base44.entities.FRNReferral.list('-referral_date', 500),
    enabled: open,
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ['frn-sessions'],
    queryFn: () => base44.entities.FRNSession.list('session_date', 500),
    enabled: open,
  });

  const [documents, setDocuments] = useState(program?.documents || []);

  useEffect(() => {
    setDocuments(program?.documents || []);
  }, [program?.id, program?.updated_date]);

  if (!program) return null;

  const saveDocuments = async (next) => {
    setDocuments(next);
    await base44.entities.FRNProgram.update(program.id, { documents: next });
    onChanged?.();
  };

  const enrolled = enrolledReferralsForProgram(referrals, program);
  const programSessions = sessions.filter(s => (s.program_name || '').toLowerCase() === program.name.toLowerCase());
  const upcoming = programSessions.filter(s => s.session_date >= todayISO()).slice(0, 5);

  const details = [
    ['Category', FRN_PROGRAM_CATEGORY_LABELS[program.category] || '—'],
    ['Coordinator', program.coordinator_name || '—'],
    ['Coordinator email', program.coordinator_email || '—'],
    ['Schedule', program.schedule_description || '—'],
    ['Location', program.location || '—'],
    ['Capacity', program.capacity ? `${program.capacity} participants` : '—'],
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-6">
              <div>
                <DialogTitle className="text-xl">{program.name}</DialogTitle>
                <div className="mt-1"><StatusBadge status={program.status} options={FRN_PROGRAM_STATUS_OPTIONS} /></div>
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

          {program.notes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-foreground whitespace-pre-line">{program.notes}</p>
            </div>
          )}

          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5"><Users className="h-4 w-4" /> Enrolled participants ({enrolled.length})</p>
            </div>
            {enrolled.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one is enrolled in this program yet — referrals that are accepted or enrolled show here.</p>
            ) : (
              <div className="space-y-1">
                {enrolled.map(r => (
                  <Link
                    key={r.id}
                    to={`/frn/participants/${r.participant_id}`}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/60"
                  >
                    <span className="text-sm text-foreground">{r.participant_name || 'Unnamed participant'}</span>
                    <StatusBadge status={r.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Sessions ({programSessions.length})</p>
              <Button size="sm" variant="outline" onClick={() => onAddSession?.(program)}><Plus className="h-3.5 w-3.5" /> New Session</Button>
            </div>
            {programSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions scheduled for this program yet.</p>
            ) : (
              <div className="space-y-1">
                {(upcoming.length ? upcoming : programSessions.slice(0, 5)).map(s => (
                  <div key={s.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm">
                    <span className="text-foreground">{fmtDate(s.session_date)}{s.start_time ? ` · ${s.start_time}` : ''}</span>
                    <span className="text-xs text-muted-foreground">{s.facilitator_name || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border pt-3">
            <ProgramDocuments
              documents={documents}
              onChange={saveDocuments}
              emptyText="No course documents yet — upload the curriculum, handouts or forms for this program."
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}