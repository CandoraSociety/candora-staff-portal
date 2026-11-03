import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Pencil, Trash2, Phone, Mail, MapPin, Cake, ClipboardCheck, Baby } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/phac/StatusBadge';
import ParticipantFormDialog from '@/components/phac/ParticipantFormDialog';
import ProgressNoteDialog, { NOTE_CATEGORY_OPTIONS, NOTE_RATING_OPTIONS } from '@/components/phac/ProgressNoteDialog';
import { PARTICIPANT_STATUS_OPTIONS } from '@/lib/phacConstants';
import ReferralToProgramDialog from '@/components/referrals/ReferralToProgramDialog';

const ATTENDANCE_STYLES = {
  present: 'bg-success/10 text-success',
  late: 'bg-warning/10 text-warning',
  absent: 'bg-destructive/10 text-destructive',
  excused: 'bg-muted text-muted-foreground',
};

const CATEGORY_LABELS = Object.fromEntries(NOTE_CATEGORY_OPTIONS.map(c => [c.value, c.label]));
const RATINGS = Object.fromEntries(NOTE_RATING_OPTIONS.map(r => [r.value, r]));

const fmtDate = (str) => str ? new Date(str.length > 10 ? str : str + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

function monthsOld(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function formatAge(months) {
  if (months == null) return '';
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years} yr` : `${years} yr ${rem} mo`;
}

export default function PHACFamilyDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [programRefOpen, setProgramRefOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const familyQ = useQuery({
    queryKey: ['phac-participant', id],
    queryFn: () => base44.entities.PHACParticipant.get(id),
    enabled: !!id,
  });
  const notesQ = useQuery({
    queryKey: ['phac-progress-notes', id],
    queryFn: () => base44.entities.PHACProgressNote.filter({ participant_id: id }, '-note_date', 200),
    enabled: !!id,
  });
  const sessionsQ = useQuery({
    queryKey: ['phac-sessions'],
    queryFn: () => base44.entities.PHACSession.list('session_date', 500),
  });
  const programsQ = useQuery({
    queryKey: ['phac-programs'],
    queryFn: () => base44.entities.PHACProgram.list('name', 200),
  });

  const family = familyQ.data;
  const notes = [...(notesQ.data || [])].sort((a, b) => (b.note_date || '').localeCompare(a.note_date || ''));

  const attendance = useMemo(() => {
    const rows = [];
    (sessionsQ.data || []).forEach(s => {
      (s.attendance || []).filter(a => a.participant_id === id).forEach(a => {
        rows.push({ id: `${s.id}-${a.date}`, date: a.date || s.session_date, program: s.program_name, status: a.status });
      });
    });
    return rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [sessionsQ.data, id]);

  const invalidateFamily = () => {
    queryClient.invalidateQueries({ queryKey: ['phac-participant', id] });
    queryClient.invalidateQueries({ queryKey: ['phac-participants'] });
  };

  const savedNote = () => {
    setNoteOpen(false);
    setEditingNote(null);
    queryClient.invalidateQueries({ queryKey: ['phac-progress-notes', id] });
  };

  const deleteNote = async (note) => {
    await base44.entities.PHACProgressNote.delete(note.id);
    queryClient.invalidateQueries({ queryKey: ['phac-progress-notes', id] });
  };

  if (familyQ.isLoading) {
    return <div className="text-center py-10 text-muted-foreground">Loading family...</div>;
  }

  if (!family) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-muted-foreground">Family not found.</p>
        <Button variant="outline" asChild><Link to="/phac/participants">Back to Families</Link></Button>
      </div>
    );
  }

  const childName = [family.child_first_name, family.child_last_name].filter(Boolean).join(' ') || 'Family';
  const age = monthsOld(family.child_date_of_birth);
  const attended = attendance.filter(a => a.status === 'present' || a.status === 'late').length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/phac/participants"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">{childName}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
              {age != null && <span className="flex items-center gap-1"><Baby className="h-3 w-3" /> {formatAge(age)} old</span>}
              {family.child_date_of_birth && <span className="flex items-center gap-1"><Cake className="h-3 w-3" /> {fmtDate(family.child_date_of_birth)}</span>}
              {family.parent_guardian_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {family.parent_guardian_phone}</span>}
              {family.parent_guardian_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {family.parent_guardian_email}</span>}
              {(family.city || family.address) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {[family.address, family.city].filter(Boolean).join(', ')}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setProgramRefOpen(true)}>Refer to a program</Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5" /> Edit Family</Button>
          <Button size="sm" onClick={() => { setEditingNote(null); setNoteOpen(true); }}><Plus className="h-3.5 w-3.5" /> Add Note</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="py-3"><CardTitle className="text-base">Family & registration</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Registration status</p>
              <StatusBadge status={family.status || 'registered'} options={PARTICIPANT_STATUS_OPTIONS} />
            </div>
            <div><p className="text-xs text-muted-foreground">Parent / guardian</p><p className="text-foreground">{family.parent_guardian_name || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">First visit</p><p className="text-foreground">{fmtDate(family.first_visit_date) || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Preferred language</p><p className="text-foreground">{family.preferred_language || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Emergency contact</p><p className="text-foreground">{family.emergency_contact_name || '—'}{family.emergency_contact_phone ? ` · ${family.emergency_contact_phone}` : ''}</p></div>
            {family.notes && <div><p className="text-xs text-muted-foreground">Notes</p><p className="text-foreground whitespace-pre-line">{family.notes}</p></div>}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border text-center">
              <div><p className="text-lg font-bold text-foreground">{attended}</p><p className="text-xs text-muted-foreground">Sessions attended</p></div>
              <div><p className="text-lg font-bold text-foreground">{notes.length}</p><p className="text-xs text-muted-foreground">Progress notes</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Attendance history</CardTitle></CardHeader>
          <CardContent className="pt-0">
            {attendance.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No attendance recorded yet — mark it from a session's Attendance button.</p>
            ) : (
              <div className="divide-y divide-border max-h-72 overflow-y-auto">
                {attendance.map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                    <div className="min-w-0">
                      <p className="text-foreground truncate">{a.program || 'Session'}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(a.date)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${ATTENDANCE_STYLES[a.status] || 'bg-muted text-muted-foreground'}`}>{a.status || 'marked'}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base">Progress notes</CardTitle>
          <Button size="sm" variant="outline" onClick={() => { setEditingNote(null); setNoteOpen(true); }}><Plus className="h-3.5 w-3.5" /> Add note</Button>
        </CardHeader>
        <CardContent className="pt-0">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No progress notes yet. Add the first observation or contact.</p>
          ) : (
            <div className="space-y-2">
              {notes.map(note => {
                const rating = RATINGS[note.progress_rating];
                return (
                  <div key={note.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-foreground">{CATEGORY_LABELS[note.category] || 'Note'}</span>
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

      <ParticipantFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        participant={family}
        onSaved={() => { setEditOpen(false); invalidateFamily(); }}
      />
      <ProgressNoteDialog
        open={noteOpen}
        onOpenChange={(v) => { setNoteOpen(v); if (!v) setEditingNote(null); }}
        note={editingNote}
        participant={family}
        programs={programsQ.data || []}
        onSaved={savedNote}
      />
      <ReferralToProgramDialog
        open={programRefOpen}
        onOpenChange={setProgramRefOpen}
        person={{ name: `${family.child_first_name} ${family.child_last_name}`, rcClientId: family.linked_rc_client_id, phone: family.parent_guardian_phone, email: family.parent_guardian_email }}
        sourceLabel="PHAC"
      />
    </div>
  );
}