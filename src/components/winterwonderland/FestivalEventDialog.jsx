import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { EVENT_STATUS_OPTIONS } from '@/lib/winterFestivalConstants';

export default function FestivalEventDialog({ open, onClose, onSave, event, components }) {
  const [form, setForm] = useState({ component_id: '', title: '', event_date: '', start_time: '', end_time: '', location: '', volunteer_count_needed: 0, description: '', status: 'scheduled', notes: '' });

  useEffect(() => {
    if (event) {
      setForm({ component_id: event.component_id || '', title: event.title || '', event_date: event.event_date || '', start_time: event.start_time || '', end_time: event.end_time || '', location: event.location || '', volunteer_count_needed: event.volunteer_count_needed || 0, description: event.description || '', status: event.status || 'scheduled', notes: event.notes || '' });
    } else {
      setForm({ component_id: components?.[0]?.id || '', title: '', event_date: '', start_time: '', end_time: '', location: '', volunteer_count_needed: 0, description: '', status: 'scheduled', notes: '' });
    }
  }, [event, open, components]);

  const handleSave = () => {
    const comp = components?.find(c => c.id === form.component_id);
    onSave({ ...form, volunteer_count_needed: Number(form.volunteer_count_needed), component_name: comp?.name || '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{event ? 'Edit Event' : 'New Event'}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5"><Label>Component</Label><Select value={form.component_id} onValueChange={v => setForm(f => ({ ...f, component_id: v }))}><SelectTrigger><SelectValue placeholder="Select component" /></SelectTrigger><SelectContent>{components?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Gift Wrapping Night" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Start</Label><Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>End</Label><Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Volunteers Needed</Label><Input type="number" value={form.volunteer_count_needed} onChange={e => setForm(f => ({ ...f, volunteer_count_needed: e.target.value }))} /></div>
          </div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EVENT_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSave} disabled={!form.title || !form.event_date}>{event ? 'Save' : 'Create'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}