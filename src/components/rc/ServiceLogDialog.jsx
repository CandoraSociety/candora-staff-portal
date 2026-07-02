import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { SERVICE_TYPE_OPTIONS, FUNDER_CATEGORIES } from '@/lib/rcConstants';

const EMPTY = {
  client_id: '', client_name: '', service_date: '', service_type: '',
  funder_category: '', worker_name: '', description: '', duration_minutes: 0,
  outcome: '', follow_up_needed: false, follow_up_date: '', notes: '',
};

export default function ServiceLogDialog({ open, onOpenChange, clientId, clientName, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: clients = [] } = useQuery({
    queryKey: ['rc-clients'],
    queryFn: () => base44.entities.RCClient.list(),
    enabled: open && !clientId,
  });

  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY,
        client_id: clientId || '',
        client_name: clientName || '',
        service_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [open, clientId, clientName]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleClientChange = (id) => {
    const c = clients.find(c => c.id === id);
    update('client_id', id);
    update('client_name', c ? `${c.first_name} ${c.last_name}` : '');
  };

  const handleSave = async () => {
    if (!form.client_id || !form.service_date) {
      toast({ title: 'Client and service date are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.RCServiceLog.create(form);
      toast({ title: 'Service log created' });
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Log Service</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {!clientId && (
            <div className="space-y-1.5 col-span-2">
              <Label>Client *</Label>
              <Select value={form.client_id} onValueChange={handleClientChange}>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5"><Label>Service Date *</Label><Input type="date" value={form.service_date || ''} onChange={(e) => update('service_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Service Type</Label>
            <Select value={form.service_type} onValueChange={(v) => update('service_type', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>{SERVICE_TYPE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Funder Category</Label>
            <Select value={form.funder_category} onValueChange={(v) => update('funder_category', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>{FUNDER_CATEGORIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Worker Name</Label><Input value={form.worker_name || ''} onChange={(e) => update('worker_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Duration (minutes)</Label><Input type="number" min="0" value={form.duration_minutes ?? 0} onChange={(e) => update('duration_minutes', parseInt(e.target.value) || 0)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Description</Label><Textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Outcome</Label><Input value={form.outcome || ''} onChange={(e) => update('outcome', e.target.value)} /></div>
          <div className="flex items-center gap-2 col-span-2">
            <Checkbox id="follow-up" checked={form.follow_up_needed || false} onCheckedChange={(v) => update('follow_up_needed', v)} />
            <label htmlFor="follow-up" className="text-sm cursor-pointer">Follow-up needed</label>
          </div>
          {form.follow_up_needed && (
            <div className="space-y-1.5 col-span-2"><Label>Follow-up Date</Label><Input type="date" value={form.follow_up_date || ''} onChange={(e) => update('follow_up_date', e.target.value)} /></div>
          )}
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}