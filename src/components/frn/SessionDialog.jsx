import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ROOM_OPTIONS } from '@/lib/centralRegConstants';
import { FRN_TARGETED_PROGRAM_NAMES, FRN_SESSION_STATUS_OPTIONS } from '@/lib/frnConstants';
import TimeSlotPicker from '@/components/shared/TimeSlotPicker';
import FacilitatorSelect from '@/components/frn/FacilitatorSelect';
import AddFacilitatorDialog from '@/components/frn/AddFacilitatorDialog';
import { timeToMinutes, minutesToTime } from '@/lib/sessionAvailability';

const EMPTY = { program_name: '', session_date: '', start_time: '', end_time: '', location: '', room: '', recurrence_pattern: 'none', recurrence_end_date: '', facilitator_name: '', facilitator_email: '', status: 'scheduled', notes: '' };

export default function SessionDialog({ open, onOpenChange, session, presetProgramName, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [duration, setDuration] = useState(60);
  const [timeOk, setTimeOk] = useState(true);
  const [addFacilitatorOpen, setAddFacilitatorOpen] = useState(false);

  const { data: programs = [] } = useQuery({
    queryKey: ['frn-programs'],
    queryFn: () => base44.entities.FRNProgram.list('name', 200),
    enabled: open,
  });
  const programNames = programs.length ? programs.map(p => p.name) : FRN_TARGETED_PROGRAM_NAMES;
  if (form.program_name && !programNames.includes(form.program_name)) programNames.push(form.program_name);

  useEffect(() => {
    if (open) {
      setForm(session ? { ...EMPTY, ...session } : { ...EMPTY, program_name: presetProgramName || '', session_date: new Date().toISOString().split('T')[0] });
      const d = session?.start_time && session?.end_time ? timeToMinutes(session.end_time) - timeToMinutes(session.start_time) : 60;
      setDuration(d > 0 ? d : 60);
      setTimeOk(true);
    }
  }, [open, session, presetProgramName]);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const applyStart = (start) => {
    update('start_time', start);
    update('end_time', start ? minutesToTime(timeToMinutes(start) + duration) : '');
  };
  const applyDuration = (v) => {
    setDuration(v);
    if (form.start_time) update('end_time', minutesToTime(timeToMinutes(form.start_time) + v));
  };

  const handleSave = async () => {
    if (!form.program_name || !form.session_date) { toast({ title: 'Program and date are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (session) await base44.entities.FRNSession.update(session.id, form);
      else await base44.entities.FRNSession.create(form);
      toast({ title: session ? 'Session updated' : 'Session created' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{session ? 'Edit Session' : 'New Session'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label>Program *</Label>
            <Select value={form.program_name || ''} onValueChange={(v) => update('program_name', v)}>
              <SelectTrigger><SelectValue placeholder="Select program..." /></SelectTrigger>
              <SelectContent>{programNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={form.session_date || ''} onChange={(e) => update('session_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status || 'scheduled'} onValueChange={(v) => update('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FRN_SESSION_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5">
            <Label>Facilitator</Label>
            <div className="flex gap-1.5">
              <FacilitatorSelect
                className="flex-1"
                value={form.facilitator_name || ''}
                onChange={(name, email) => setForm(prev => ({ ...prev, facilitator_name: name, facilitator_email: email || prev.facilitator_email || '' }))}
              />
              <Button type="button" variant="outline" size="icon" title="Add an eligible facilitator" onClick={() => setAddFacilitatorOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Room *</Label><Select value={form.room || ''} onValueChange={(v) => update('room', v)}><SelectTrigger><SelectValue placeholder="Select room..." /></SelectTrigger><SelectContent>{ROOM_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2 col-span-2 border border-border rounded-md p-3 bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration &amp; Time Slot</p>
            <TimeSlotPicker dateISO={form.session_date || ''} room={form.room || ''} excludeId={session?.id} duration={duration} start={form.start_time || ''} onStartChange={applyStart} onDurationChange={applyDuration} onValidityChange={setTimeOk} />
          </div>
          <div className="space-y-1.5"><Label>Repeats</Label><Select value={form.recurrence_pattern || 'none'} onValueChange={(v) => update('recurrence_pattern', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Does not repeat</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="biweekly">Bi-weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Repeat Until</Label><Input type="date" value={form.recurrence_end_date || ''} onChange={(e) => update('recurrence_end_date', e.target.value)} disabled={!form.recurrence_pattern || form.recurrence_pattern === 'none'} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !timeOk}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>

        <AddFacilitatorDialog
          open={addFacilitatorOpen}
          onOpenChange={setAddFacilitatorOpen}
          onSaved={(record) => {
            setAddFacilitatorOpen(false);
            if (record?.name) setForm(prev => ({ ...prev, facilitator_name: record.name, facilitator_email: record.email || '' }));
          }}
        />
      </DialogContent>
    </Dialog>
  );
}