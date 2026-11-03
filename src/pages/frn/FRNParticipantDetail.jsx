import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Pencil, Trash2, Phone, Mail, MapPin, Cake, ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/frn/StatusBadge';
import ParticipantFormDialog from '@/components/frn/ParticipantFormDialog';
import ParticipantGoals from '@/components/frn/ParticipantGoals';
import ProgressNoteDialog from '@/components/frn/ProgressNoteDialog';
import ReferralToProgramDialog from '@/components/referrals/ReferralToProgramDialog';
import { PROGRAM_LABELS } from '@/lib/frnConstants';
import { referralProgramName } from '@/lib/frnPrograms';

const NOTE_CATEGORY_LABELS = {
  progress: 'Progress',
  evaluation: 'Evaluation',
  goal_update: 'Goal update',
  contact: 'Contact',
  general: 'General',
};

const RATING_STYLES = {
  excellent: { label: 'Excellent', color: '#16a34a' },
  good: { label: 'Good', color: '#0ea5e9' },
  steady: { label: 'Steady', color: '#6366f1' },
  needs_support: { label: 'Needs support', color: '#f59e0b' },
  at_risk: { label: 'At risk', color: '#ef4444' },
};

const ATTENDANCE_STYLES = {
  present: 'bg-success/10 text-success',
  late: 'bg-warning/10 text-warning',
  absent: 'bg-destructive/10 text-destructive',
  excused: 'bg-muted text-muted-foreground',
};

const fmtDate = (str) => str ? new Date(str.length > 10 ? str : str + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export default function FRNParticipantDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [programRefOpen, setProgramRefOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const participantQ = useQuery({
    queryKey: ['frn-participant', id],
    queryFn: () => base44.entities.FRNParticipant.get(id),
    enabled: !!id,
  });
  const referralsQ = useQuery({
    queryKey: ['frn-referrals'],
    queryFn: () => base44.entities.FRNReferral.list('-referral_date', 500),
  });
  const notesQ = useQuery({
    queryKey: ['frn-progress-notes', id],
    queryFn: () => base44.entities.FRNProgressNote.filter({ participant_id: id }, '-note_date', 200),
    enabled: !!id,
  });
  const sessionsQ = useQuery({
    queryKey: ['frn-sessions'],
    queryFn: () => base44.entities.FRNSession.list('session_date', 500),
  });
  const programsQ = useQuery({
    queryKey: ['frn-programs'],
    queryFn: () => base44.entities.FRNProgram.list('name', 200),
  });

  const participant = participantQ.data;
  const referrals = (referralsQ.data || []).filter(r => r.participant_id === id);
  const notes = [...(notesQ.data || [])].sort((a, b) => (b.note_date || '').localeCompare(a.note_date || ''));
  const programs = programsQ.data || [];

  const attendance = useMemo(() => {
    const rows = [];
    (sessionsQ.data || []).forEach(s => {
      (s.attendance || []).filter(a => a.participant_id === id).forEach(a => {
        rows.push({ id: `${s.id}-${a.date}`, date: a.date || s.session_date, program: s.program_name, status: a.status });
      });
    });
    return rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [sessionsQ.data, id]);

  const invalidateParticipant = () => {
    queryClient.invalidateQueries({ queryKey: ['frn-participant', id] });
    queryClient.invalidateQueries({ queryKey: ['frn-participants'] });
  };

  const saveGoals = async (goals) => {
    await base44.entities.FRNParticipant.update(id, { goals });
    invalidateParticipant();
  };

  const savedNote = () => {
    setNoteOpen(false);
    setEditingNote(null);
    queryClient.invalidateQueries({ queryKey: ['frn-progress-notes', id] });
    queryClient.invalidateQueries({ queryKey: ['frn-assessments'] });
  };

  const deleteNote = async (note) => {
    await base44.entities.FRNProgressNote.delete(note.id);
    queryClient.invalidateQueries({ queryKey: ['frn-progress-notes', id] });
  };

  if (participantQ.isLoading) {
    return <div className="text-center py-10 text-muted-foreground">Loading participant...</div>;
  }

  if (!participant) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-muted-foreground">Participant not found.</p>
        <Button variant="outline" asChild><Link to="/frn/participants">Back to Participants</Link></Button>
      </div>
    );
  }

  const goals = participant.goals || [];
  const achieved = goals.filter(g => g.status === 'achieved').length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/frn/participants"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">{participant.first_name} {participant.last_name}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
              {participant.date_of_birth && <span className="flex items-center gap-1"><Cake className="h-3 w-3" /> {fmtDate(participant.date_of_birth)}</span>}
              {participant.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {participant.phone}</span>}
              {participant.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {participant.email}</span>}
              {(participant.city || participant.address) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {[participant.address, participant.city].filter(Boolean).join(', ')}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setProgramRefOpen(true)}>Refer to a program</Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5" /> Edit Profile</Button>
          <Button size="sm" onClick={() => { setEditingNote(null); setNoteOpen(true); }}><Plus className="h-3.5 w-3.5" /> Add Note</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="py-3"><CardTitle className="text-base">Programs & status</CardTitle></CardHeader>
          <CardContent className="pt-0">
            {referrals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No referrals or enrollments on file for this participant.</p>
            ) : (
              <div className="divide-y divide-border">
                {referrals.map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{referralProgramName(r) || PROGRAM_LABELS[r.program] || 'Program'}</p>
                      <p className="text-xs text-muted-foreground">
                        Referred {fmtDate(r.referral_date)}
                        {r.enrollment_date ? ` · Enrolled ${fmtDate(r.enrollment_date)}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border text-center">
              <div><p className="text-lg font-bold text-foreground">{goals.length}</p><p className="text-xs text-muted-foreground">Goals</p></div>
              <div><p className="text-lg font-bold text-foreground">{achieved}</p><p className="text-xs text-muted-foreground">Achieved</p></div>
              <div><p className="text-lg font-bold text-foreground">{attendance.filter(a => a.status === 'present' || a.status === 'late').length}</p><p className="text-xs text-muted-foreground">Sessions attended</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3"><CardTitle className="text-base">Profile details</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-2 text-sm">
            <div><p className="text-xs text-muted-foreground">Preferred language</p><p className="text-foreground">{participant.preferred_language || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Guardian</p><p className="text-foreground">{participant.guardian_name || '—'}{participant.guardian_phone ? ` · ${participant.guardian_phone}` : ''}</p></div>
            <div><p className="text-xs text-muted-foreground">Emergency contact</p><p className="text-foreground">{participant.emergency_contact_name || '—'}{participant.emergency_contact_phone ? ` · ${participant.emergency_contact_phone}` : ''}</p></div>
            {participant.notes && <div><p className="text-xs text-muted-foreground">Notes</p><p className="text-foreground whitespace-pre-line">{participant.notes}</p></div>}
          </CardContent>
        </Card>
      </div>

      <ParticipantGoals goals={goals} onChange={saveGoals} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base">Progress & evaluations</CardTitle>
          <Button size="sm" variant="outline" onClick={() => { setEditingNote(null); setNoteOpen(true); }}><Plus className="h-3.5 w-3.5" /> Add note</Button>
        </CardHeader>
        <CardContent className="pt-0">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No progress notes yet. Add the first observation or evaluation.</p>
          ) : (
            <div className="space-y-2">
              {notes.map(note => {
                const rating = RATING_STYLES[note.progress_rating];
                return (
                  <div key={note.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-foreground">{NOTE_CATEGORY_LABELS[note.category] || 'Note'}</span>
                          {rating && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: rating.color + '20', color: rating.color }}>{rating.label}</span>}
                          <span className="text-xs text-muted-foreground">{fmtDate(note.note_date)}</span>
                          {note.program_name && <span className="text-xs text-muted-foreground">· {note.program_name}</span>}
                        </div>
                        <p className="text-sm text-foreground mt-1.5 whitespace-pre-line">{note.summary}</p>
                        {note.next_steps && <p className="text-xs text-muted-foreground mt-1.5"><span className="font-medium">Next steps:</span> {note.next_steps}</p>}
                        {note.recorded_by_name && <p className="text-xs text-muted-foreground mt-1">— {note.recorded_by_name}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingNote(note); setNoteOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteNote(note)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Attendance history</CardTitle></CardHeader>
        <CardContent className="pt-0">
          {attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No attendance recorded yet — mark it from a session's Attendance button.</p>
          ) : (
            <div className="divide-y divide-border">
              {attendance.map(a => (
                <div key={a.id} className="flex items-center justify-between py-1.5 text-sm">
                  <div className="min-w-0">
                    <p className="text-foreground">{a.program || 'Session'}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(a.date)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${ATTENDANCE_STYLES[a.status] || 'bg-muted text-muted-foreground'}`}>{a.status || 'marked'}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ParticipantFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        participant={participant}
        onSaved={() => { setEditOpen(false); invalidateParticipant(); }}
      />
      <ProgressNoteDialog
        open={noteOpen}
        onOpenChange={(v) => { setNoteOpen(v); if (!v) setEditingNote(null); }}
        note={editingNote}
        participant={participant}
        programs={programs}
        onSaved={savedNote}
      />
      <ReferralToProgramDialog
        open={programRefOpen}
        onOpenChange={setProgramRefOpen}
        person={{ name: `${participant.first_name} ${participant.last_name}`, rcClientId: participant.linked_rc_client_id, phone: participant.phone, email: participant.email }}
        sourceLabel="FRN"
      />
    </div>
  );
}