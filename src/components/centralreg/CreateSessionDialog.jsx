import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { TOPIC_AREA_OPTIONS } from '@/lib/digilitConstants';
import { ROOM_OPTIONS } from '@/lib/centralRegConstants';
import { FRN_TARGETED_PROGRAM_NAMES } from '@/lib/frnConstants';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const CLB_LEVELS = ['mixed', 'clb_1', 'clb_2', 'clb_3', 'clb_4', 'clb_5', 'clb_6', 'clb_7', 'clb_8', 'clb_9', 'clb_10', 'clb_11', 'clb_12'];
const todayStr = () => new Date().toISOString().split('T')[0];

const AREA_LABELS = {
  community: 'Session', phac: 'Session', frn: 'Session', digilit: 'Session', ell: 'Class', empoweru: 'Cohort',
};

// Recurrence parameters shared by session-type creation areas (community, phac, digilit, frn).
function RecurrenceFields({ form, update }) {
  return (
    <>
      <div className="space-y-1.5">
        <Label>Repeats</Label>
        <Select value={form.recurrence_pattern || 'none'} onValueChange={(v) => update('recurrence_pattern', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Does not repeat</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="biweekly">Bi-weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {form.recurrence_pattern && form.recurrence_pattern !== 'none' ? (
        <div className="space-y-1.5"><Label>Repeat Until</Label><Input type="date" value={form.recurrence_end_date || ''} onChange={(e) => update('recurrence_end_date', e.target.value)} /></div>
      ) : <div />}
    </>
  );
}

// Creates a session/class/cohort directly in the program's HOME-PORTAL entity,
// so it appears in both Central Registration and the program's own portal.
// Fields conform to each home portal's own creation form.
export default function CreateSessionDialog({ open, onOpenChange, area, program, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const { data: instructors = [] } = useQuery({ queryKey: ['ell-instructors'], queryFn: () => base44.entities.ELLInstructor.list(), enabled: open && area === 'ell' });

  useEffect(() => {
    if (!open) return;
    if (area === 'community') setForm({ session_date: todayStr(), status: 'scheduled', program_id: program?.id || '', program_name: program?.name || '', title: '', room: '', recurrence_pattern: 'none', recurrence_end_date: '' });
    else if (area === 'phac') setForm({ session_date: todayStr(), status: 'scheduled', program_id: program?.id || '', program_name: program?.name || '', start_time: program?.start_time || '', end_time: program?.end_time || '', location: program?.location || '', facilitator: program?.facilitator || '', room: '', recurrence_pattern: 'none', recurrence_end_date: '' });
    else if (area === 'frn') setForm({ session_date: todayStr(), status: 'scheduled', program_name: program?.name || '', start_time: '', end_time: '', location: '', room: '', recurrence_pattern: 'none', recurrence_end_date: '', facilitator_name: '', notes: '' });
    else if (area === 'ell') setForm({ name: '', clb_level: 'mixed', instructor_id: '', schedule_days: [], start_time: '', end_time: '', location: '', room: '', capacity: 15, start_date: '', end_date: '', description: '', status: 'active' });
    else if (area === 'digilit') setForm({ session_date: todayStr(), status: 'scheduled', title: '', topic_area: 'computer_basics', start_time: '', end_time: '', location: '', room: '', recurrence_pattern: 'none', recurrence_end_date: '', max_participants: 10, facilitator_name: '' });
    else if (area === 'empoweru') setForm({ name: '', start_date: '', end_date: '', delivery_mode: 'virtual', location: '', room: '', facilitator_name: '', facilitator_email: '', facilitator_phone: '', capacity: 15, registration_open: true, status: 'registration_open' });
  }, [open, area, program]);

  const label = AREA_LABELS[area] || 'Session';
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const toggleDay = (d) => setForm(p => ({ ...p, schedule_days: (p.schedule_days || []).includes(d) ? (p.schedule_days || []).filter(x => x !== d) : [...(p.schedule_days || []), d] }));

  const handleSave = async () => {
    if (['community', 'phac', 'frn'].includes(area) && !form.session_date) { toast({ title: 'Session date is required', variant: 'destructive' }); return; }
    if (area === 'frn' && !form.program_name) { toast({ title: 'Program is required', variant: 'destructive' }); return; }
    if (area === 'digilit' && (!form.title || !form.session_date)) { toast({ title: 'Title and date are required', variant: 'destructive' }); return; }
    if (area === 'ell' && !form.name) { toast({ title: 'Class name is required', variant: 'destructive' }); return; }
    if (area === 'empoweru' && !form.name) { toast({ title: 'Cohort name is required', variant: 'destructive' }); return; }
    if (!form.room) { toast({ title: 'Room is required — assign where this will take place', variant: 'destructive' }); return; }

    setSaving(true);
    try {
      const payload = { ...form };
      if (area === 'ell') {
        const instr = instructors.find(i => i.id === form.instructor_id);
        payload.instructor_name = instr ? `${instr.first_name} ${instr.last_name}` : '';
      }
      const entity = { community: 'CommunitySession', phac: 'PHACSession', frn: 'FRNSession', ell: 'ELLClass', digilit: 'DigiLitSession', empoweru: 'EmpowerUCohort' }[area];
      await base44.entities[entity].create(payload);
      toast({ title: `${label} created`, description: 'It now appears in both Central Registration and the program\'s home portal.' });
      onSaved?.();
    } catch (err) {
      toast({ title: `Error creating ${label.toLowerCase()}`, description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create {label}</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground -mt-1">
          {program?.name ? `Program: ${program.name}. ` : ''}This {label.toLowerCase()} is created in the program's home portal too, so both places stay in sync.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(area === 'community' || area === 'phac') && (
            <>
              {area === 'community' && <div className="col-span-2 space-y-1.5"><Label>Session Title</Label><Input value={form.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Weekly Sewing Circle" /></div>}
              <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={form.session_date || ''} onChange={(e) => update('session_date', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Start Time</Label><Input type="time" value={form.start_time || ''} onChange={(e) => update('start_time', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>End Time</Label><Input type="time" value={form.end_time || ''} onChange={(e) => update('end_time', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Room *</Label><Select value={form.room || ''} onValueChange={(v) => update('room', v)}><SelectTrigger><SelectValue placeholder="Select room..." /></SelectTrigger><SelectContent>{ROOM_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
              {area === 'community' && <div className="space-y-1.5"><Label>Facilitator Name</Label><Input value={form.facilitator_name || ''} onChange={(e) => update('facilitator_name', e.target.value)} /></div>}
              {area === 'community' && <div className="space-y-1.5"><Label>Facilitator Email</Label><Input type="email" value={form.facilitator_email || ''} onChange={(e) => update('facilitator_email', e.target.value)} /></div>}
              {area === 'phac' && <div className="space-y-1.5"><Label>Facilitator</Label><Input value={form.facilitator || ''} onChange={(e) => update('facilitator', e.target.value)} /></div>}
              {['community', 'phac', 'frn'].includes(area) && <RecurrenceFields form={form} update={update} />}
              <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
            </>
          )}
          {area === 'ell' && (
            <>
              <div className="col-span-2 space-y-1.5"><Label>Class Name *</Label><Input value={form.name || ''} onChange={(e) => update('name', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>CLB Level</Label><Select value={form.clb_level || 'mixed'} onValueChange={(v) => update('clb_level', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CLB_LEVELS.map(l => <SelectItem key={l} value={l}>{l.replace('_', ' ').toUpperCase()}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Status</Label><Select value={form.status || 'active'} onValueChange={(v) => update('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['planning', 'active', 'completed', 'cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="col-span-2 space-y-1.5"><Label>Instructor</Label><Select value={form.instructor_id || ''} onValueChange={(v) => update('instructor_id', v)}><SelectTrigger><SelectValue placeholder="Select instructor" /></SelectTrigger><SelectContent>{instructors.filter(i => i.status === 'active').map(i => <SelectItem key={i.id} value={i.id}>{i.first_name} {i.last_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="col-span-2 space-y-1.5"><Label>Schedule Days</Label><div className="flex flex-wrap gap-2">{DAYS.map(d => <button key={d} type="button" onClick={() => toggleDay(d)} className={cn('px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors', (form.schedule_days || []).includes(d) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>{d.slice(0, 3)}</button>)}</div></div>
              <div className="space-y-1.5"><Label>Start Time</Label><Input type="time" value={form.start_time || ''} onChange={(e) => update('start_time', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>End Time</Label><Input type="time" value={form.end_time || ''} onChange={(e) => update('end_time', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Room *</Label><Select value={form.room || ''} onValueChange={(v) => update('room', v)}><SelectTrigger><SelectValue placeholder="Select room..." /></SelectTrigger><SelectContent>{ROOM_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" min="1" value={form.capacity ?? 15} onChange={(e) => update('capacity', parseInt(e.target.value) || 0)} /></div>
              <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.start_date || ''} onChange={(e) => update('start_date', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.end_date || ''} onChange={(e) => update('end_date', e.target.value)} /></div>
              <div className="col-span-2 space-y-1.5"><Label>Description</Label><Input value={form.description || ''} onChange={(e) => update('description', e.target.value)} /></div>
            </>
          )}
          {area === 'digilit' && (
            <>
              <div className="col-span-2 space-y-1.5"><Label>Title *</Label><Input value={form.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Email Basics" /></div>
              <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={form.session_date || ''} onChange={(e) => update('session_date', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Topic Area</Label><Select value={form.topic_area || 'computer_basics'} onValueChange={(v) => update('topic_area', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TOPIC_AREA_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Start Time</Label><Input type="time" value={form.start_time || ''} onChange={(e) => update('start_time', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>End Time</Label><Input type="time" value={form.end_time || ''} onChange={(e) => update('end_time', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Room *</Label><Select value={form.room || ''} onValueChange={(v) => update('room', v)}><SelectTrigger><SelectValue placeholder="Select room..." /></SelectTrigger><SelectContent>{ROOM_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Max Participants</Label><Input type="number" min="1" value={form.max_participants ?? 10} onChange={(e) => update('max_participants', parseInt(e.target.value) || 10)} /></div>
              <div className="col-span-2 space-y-1.5"><Label>Facilitator Name</Label><Input value={form.facilitator_name || ''} onChange={(e) => update('facilitator_name', e.target.value)} placeholder="Volunteer facilitator" /></div>
              <RecurrenceFields form={form} update={update} />
            </>
          )}
          {area === 'frn' && (
            <>
              <div className="col-span-2 space-y-1.5"><Label>Program *</Label><Select value={form.program_name || ''} onValueChange={(v) => update('program_name', v)}><SelectTrigger><SelectValue placeholder="Select program..." /></SelectTrigger><SelectContent>{FRN_TARGETED_PROGRAM_NAMES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={form.session_date || ''} onChange={(e) => update('session_date', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Start Time</Label><Input type="time" value={form.start_time || ''} onChange={(e) => update('start_time', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>End Time</Label><Input type="time" value={form.end_time || ''} onChange={(e) => update('end_time', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Facilitator</Label><Input value={form.facilitator_name || ''} onChange={(e) => update('facilitator_name', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Room *</Label><Select value={form.room || ''} onValueChange={(v) => update('room', v)}><SelectTrigger><SelectValue placeholder="Select room..." /></SelectTrigger><SelectContent>{ROOM_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
            </>
          )}
          {area === 'empoweru' && (
            <>
              <div className="col-span-2 space-y-1.5"><Label>Cohort Name *</Label><Input value={form.name || ''} onChange={(e) => update('name', e.target.value)} placeholder="e.g. EmpowerU Fall 2026" /></div>
              <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.start_date || ''} onChange={(e) => update('start_date', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.end_date || ''} onChange={(e) => update('end_date', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Delivery Mode</Label><Select value={form.delivery_mode || 'virtual'} onValueChange={(v) => update('delivery_mode', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['in_person', 'virtual', 'hybrid'].map(m => <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" min="1" value={form.capacity ?? 15} onChange={(e) => update('capacity', parseInt(e.target.value) || 0)} /></div>
              <div className="col-span-2 space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} placeholder="Physical location or meeting link" /></div>
              <div className="col-span-2 space-y-1.5"><Label>Room *</Label><Select value={form.room || ''} onValueChange={(v) => update('room', v)}><SelectTrigger><SelectValue placeholder="Select room..." /></SelectTrigger><SelectContent>{ROOM_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Facilitator Name</Label><Input value={form.facilitator_name || ''} onChange={(e) => update('facilitator_name', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Facilitator Email</Label><Input type="email" value={form.facilitator_email || ''} onChange={(e) => update('facilitator_email', e.target.value)} /></div>
              <div className="col-span-2 flex items-center space-x-2 pt-1">
                <Checkbox id="cr-cohort-reg-open" checked={!!form.registration_open} onCheckedChange={(v) => update('registration_open', v === true)} />
                <Label htmlFor="cr-cohort-reg-open" className="cursor-pointer">Open this cohort for registration</Label>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : `Create ${label}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}