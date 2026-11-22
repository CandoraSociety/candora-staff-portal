import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { newInviteToken, defaultExpiryDate } from '@/lib/giftShopInvites';

const emptyForm = () => ({
  guardian_name: '',
  guardian_email: '',
  guardian_phone: '',
  expiry_date: defaultExpiryDate(),
});

// The family says how many children they are registering on the form itself, so
// the link simply allows up to the form's maximum.
const CHILDREN_ALLOWED = 6;

// Creates one private pre-registration invitation. The family's own email or
// phone is what unlocks the link, so at least one of the two is required.
export default function GiftShopInviteDialog({ open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setSaving(false);
    }
  }, [open]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const save = async () => {
    if (!form.guardian_name.trim()) return toast({ title: 'Guardian name is required', variant: 'destructive' });
    if (!form.guardian_email.trim() && !form.guardian_phone.trim()) {
      return toast({
        title: 'Add an email or a phone number',
        description: 'The link is unlocked with this contact detail, so it is required.',
        variant: 'destructive',
      });
    }

    setSaving(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      await base44.entities.GiftShopInvite.create({
        token: newInviteToken(),
        guardian_name: form.guardian_name.trim(),
        guardian_email: form.guardian_email.trim(),
        guardian_phone: form.guardian_phone.trim(),
        children_allowed: CHILDREN_ALLOWED,
        status: 'invited',
        expires_at: new Date(`${form.expiry_date}T23:59:59`).toISOString(),
        sent_via: 'email',
        created_by_name: me?.full_name || '',
      });
      toast({ title: 'Invitation created', description: 'Copy the link and send it to the family.' });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error creating invitation', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite a family</DialogTitle>
          <DialogDescription>
            Each family gets their own link. It only works for the contact details below, and only once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Parent or guardian’s name *</Label>
            <Input value={form.guardian_name} onChange={e => set('guardian_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.guardian_email} onChange={e => set('guardian_email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.guardian_phone} onChange={e => set('guardian_phone', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Link expires</Label>
            <Input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} className="w-48" />
            <p className="text-xs text-muted-foreground">Pre-registration closes on December 1. The family chooses how many children they register.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Creating…' : 'Create invitation'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}