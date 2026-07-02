import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { FESTIVAL_STATUS_OPTIONS } from '@/lib/winterFestivalConstants';

export default function FestivalDialog({ open, onClose, onSave, festival }) {
  const [form, setForm] = useState({ year: new Date().getFullYear(), theme: '', start_date: '', end_date: '', status: 'planning', description: '', fundraiser_name: '', notes: '' });

  useEffect(() => {
    if (festival) {
      setForm({ year: festival.year || new Date().getFullYear(), theme: festival.theme || '', start_date: festival.start_date || '', end_date: festival.end_date || '', status: festival.status || 'planning', description: festival.description || '', fundraiser_name: festival.fundraiser_name || '', notes: festival.notes || '' });
    } else {
      setForm({ year: new Date().getFullYear(), theme: '', start_date: '', end_date: '', status: 'planning', description: '', fundraiser_name: '', notes: '' });
    }
  }, [festival, open]);

  const handleSave = () => {
    onSave({ ...form, year: Number(form.year) });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{festival ? 'Edit Festival' : 'New Festival'}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FESTIVAL_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-1.5"><Label>Theme / Name</Label><Input value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} placeholder="e.g. Winter Wonderland 2026" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
          </div>
          <div className="space-y-1.5"><Label>Fundraiser Name</Label><Input value={form.fundraiser_name} onChange={e => setForm(f => ({ ...f, fundraiser_name: e.target.value }))} placeholder="Currently being rebranded..." /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSave}>{festival ? 'Save' : 'Create'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}