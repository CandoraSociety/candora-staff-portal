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
import { REFERRAL_STATUS_OPTIONS } from '@/lib/rcConstants';

const EMPTY = {
  client_id: '', client_name: '', direction: 'incoming', source_type: 'external_partner',
  organization: '', contact_name: '', contact_email: '', contact_phone: '',
  service_program: '', reason: '', status: 'pending', referral_date: '', response_date: '', notes: '',
};

export default function ReferralDialog({ open, onOpenChange, clientId, clientName, onSaved }) {
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
      setForm({ ...EMPTY, client_id: clientId || '', client_name: clientName || '', referral_date: new Date().toISOString().split('T')[0] });
    }
  }, [open, clientId, clientName]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleClientChange = (id) => {
    const c = clients.find(c => c.id === id);
    update('client_id', id);
    update('client_name', c ? `${c.first_name} ${c.last_name}` : '');
  };

  const handleSave = async () => {
    if (!form.client_id || !form.direction || !form.referral_date) {
      toast({ title: 'Client, direction, and referral date are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.RCReferral.create(form);
      toast({ title: 'Referral created' });
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
        <DialogHeader><DialogTitle>New Referral</DialogTitle></DialogHeader>
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
          <div className="space-y-1.5"><Label>Direction *</Label>
            <Select value={form.direction} onValueChange={(v) => update('direction', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="incoming">Incoming</SelectItem><SelectItem value="outgoing">Outgoing</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Source Type</Label>
            <Select value={form.source_type} onValueChange={(v) => update('source_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="internal">Internal</SelectItem><SelectItem value="external_partner">External Partner</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2"><Label>Organization</Label><Input value={form.organization || ''} onChange={(e) => update('organization', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Contact Name</Label><Input value={form.contact_name || ''} onChange={(e) => update('contact_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Contact Phone</Label><Input value={form.contact_phone || ''} onChange={(e) => update('contact_phone', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Contact Email</Label><Input type="email" value={form.contact_email || ''} onChange={(e) => update('contact_email', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Service / Program</Label><Input value={form.service_program || ''} onChange={(e) => update('service_program', e.target.value)} placeholder="Program or service referred to/from" /></div>
          <div className="space-y-1.5 col-span-2"><Label>Reason</Label><Textarea value={form.reason || ''} onChange={(e) => update('reason', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5"><Label>Referral Date *</Label><Input type="date" value={form.referral_date || ''} onChange={(e) => update('referral_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REFERRAL_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
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