import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const EMPTY = { organization: '', contact_name: '', contact_phone: '', service_program: '', reason: '', referral_date: '', notes: '' };

export default function ExternalReferralDialog({ open, onOpenChange, clientId, clientName, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm({ ...EMPTY, referral_date: new Date().toISOString().split('T')[0] });
  }, [open]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.organization.trim() || !form.referral_date) {
      toast({ title: 'Organization and referral date are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.RCReferral.create({
        client_id: clientId,
        client_name: clientName,
        direction: 'outgoing',
        source_type: 'external_partner',
        status: 'pending',
        ...form,
        organization: form.organization.trim(),
      });
      toast({ title: 'External referral recorded' });
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>External Referral</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Client</Label><Input value={clientName || ''} disabled /></div>
          <div className="space-y-1.5 col-span-2"><Label>Referred To (Organization) *</Label><Input value={form.organization} onChange={(e) => update('organization', e.target.value)} placeholder="Organization / agency name" /></div>
          <div className="space-y-1.5"><Label>Contact Name</Label><Input value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Contact Phone</Label><Input value={form.contact_phone} onChange={(e) => update('contact_phone', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Service / Program Referred To</Label><Input value={form.service_program} onChange={(e) => update('service_program', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Reason for Referral</Label><Textarea rows={2} value={form.reason} onChange={(e) => update('reason', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Referral Date *</Label><Input type="date" value={form.referral_date} onChange={(e) => update('referral_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={1} value={form.notes} onChange={(e) => update('notes', e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Referral'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}