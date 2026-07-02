import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { SESSION_STATUS_OPTIONS, isOffSeason } from '@/lib/phacConstants';

const EMPTY = {
  program_id: '', program_name: '', session_date: '', start_time: '', end_time: '',
  location: '', facilitator: '', attendee_count: 0, adult_count: 0, child_count: 0,
  status: 'scheduled', notes: '',
};

export default function SessionFormDialog({ open, onOpenChange, session, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: programs = [] } = useQuery({
    queryKey: ['phac-programs'],
    queryFn: () => base44.entities.PHACProgram.list(),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setForm(session ? { ...EMPTY, ...session } : { ...EMPTY, session_date: new Date().toISOString().split('T')[0] });
    }
  }, [open, session]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleProgramChange = (programId) => {
    const p = programs.find(p => p.id === programId);
    update('program_id', programId);
    if (p) {
      update('program_name', p.name);
      update('start_time', p.start_time || '');
      update('end_time', p.end_time || '');
      update('location', p.location || '');
      update('facilitator', p.facilitator || '');
    }
  };

  const offSeason = form.session_date ? isOffSeason(form.session_date) : false;

  const handleSave = async () => {
    if (!form.program_id || !form.session_date) {
      toast({ title: 'Program and session date are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (session?.id) {
        await base44.entities.PHACSession.update(session.id, form);
        toast({ title: 'Session updated' });
      } else {
        await base44.entities.PHACSession.create(form);
        toast({ title: 'Session created' });
      }
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error saving session', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{session ? 'Edit Session' : 'Add Session'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label>Program *</Label>
            <Select value={form.program_id} onValueChange={handleProgramChange}>
              <SelectTrigger><SelectValue placeholder="Select program..." /></SelectTrigger>
              <SelectContent>
                {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Session Date *</Label>
            <Input type="date" value={form.session_date || ''} onChange={(e) => update('session_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SESSION_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Start Time</Label>
            <Input type="time" value={form.start_time || ''} onChange={(e) => update('start_time', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End Time</Label>
            <Input type="time" value={form.end_time || ''} onChange={(e) => update('end_time', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Facilitator</Label>
            <Input value={form.facilitator || ''} onChange={(e) => update('facilitator', e.target.value)} />
          </div>
          {offSeason && (
            <div className="col-span-2">
              <Alert>
                <AlertDescription>
                  This date falls in July or August — PHAC programs do not typically run during these months.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <div className="col-span-2"><p className="text-sm font-medium text-foreground mt-2 mb-1">Attendance (Headcount)</p></div>
          <div className="space-y-1.5">
            <Label>Adults</Label>
            <Input type="number" min="0" value={form.adult_count ?? 0} onChange={(e) => {
              const v = parseInt(e.target.value) || 0;
              update('adult_count', v);
              update('attendee_count', v + (form.child_count || 0));
            }} />
          </div>
          <div className="space-y-1.5">
            <Label>Children</Label>
            <Input type="number" min="0" value={form.child_count ?? 0} onChange={(e) => {
              const v = parseInt(e.target.value) || 0;
              update('child_count', v);
              update('attendee_count', v + (form.adult_count || 0));
            }} />
          </div>
          <div className="space-y-1.5">
            <Label>Total Attendees</Label>
            <Input type="number" min="0" value={form.attendee_count ?? 0} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}