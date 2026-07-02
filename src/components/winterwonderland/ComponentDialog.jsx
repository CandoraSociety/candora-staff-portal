import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { COMPONENT_TYPE_OPTIONS, COMPONENT_STATUS_OPTIONS } from '@/lib/winterFestivalConstants';

export default function ComponentDialog({ open, onClose, onSave, component }) {
  const [form, setForm] = useState({ name: '', component_type: 'other', description: '', lead_name: '', lead_email: '', location: '', schedule_description: '', status: 'planning', notes: '' });

  useEffect(() => {
    if (component) {
      setForm({ name: component.name || '', component_type: component.component_type || 'other', description: component.description || '', lead_name: component.lead_name || '', lead_email: component.lead_email || '', location: component.location || '', schedule_description: component.schedule_description || '', status: component.status || 'planning', notes: component.notes || '' });
    } else {
      setForm({ name: '', component_type: 'other', description: '', lead_name: '', lead_email: '', location: '', schedule_description: '', status: 'planning', notes: '' });
    }
  }, [component, open]);

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{component ? 'Edit Component' : 'New Component'}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Kids Gift Shop" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Type</Label><Select value={form.component_type} onValueChange={v => setForm(f => ({ ...f, component_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMPONENT_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.icon} {o.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMPONENT_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Lead Name</Label><Input value={form.lead_name} onChange={e => setForm(f => ({ ...f, lead_name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Lead Email</Label><Input value={form.lead_email} onChange={e => setForm(f => ({ ...f, lead_email: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Schedule</Label><Input value={form.schedule_description} onChange={e => setForm(f => ({ ...f, schedule_description: e.target.value }))} placeholder="e.g. Thursday 11am-2pm" /></div>
          </div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSave} disabled={!form.name}>{component ? 'Save' : 'Create'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}