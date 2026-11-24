import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const formFrom = (invite) => ({
  guardian_name: invite?.guardian_name || '',
  guardian_email: invite?.guardian_email || '',
  guardian_phone: invite?.guardian_phone || '',
  children_allowed: String(invite?.children_allowed || 3),
  expiry_date: invite?.expires_at ? String(invite.expires_at).slice(0, 10) : '',
  notes: invite?.notes || '',
});

// Edits the family details on an invitation. The email and phone are what
// unlock the private link, so changing them changes who can use it.
export default function GiftShopInviteEditDialog({ open, onOpenChange, invite, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(formFrom(invite));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(formFrom(invite));
      setSaving(false);
    }
  }, [open, invite]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const save = async () => {
    if (!form.guardian_name.trim()) return toast({ title: 'Guardian name is required', variant: 'destructive' });
    if (!form.guardian_email.trim() && !form.guardian_phone.trim()) {
      return toast({ title: 'Add an email or a phone number', description: 'The family unlocks their link with one of these.', variant: 'destructive' });
    }

    setSaving(true);
    try {
      await base44.entities.GiftShopInvite.update(invite.id, {
        guardian_name: form.guardian_name.trim(),
        guardian_email: form.guardian_email.trim(),
        guardian_phone: form.guardian_phone.trim(),
        children_allowed: Math.min(6, Math.max(1, Number(form.children_allowed) || 3)),
        ...(form.expiry_date ? { expires_at: new Date(`${form.expiry_date}T23:59:59`).toISOString() } : {}),
        notes: form.notes.trim(),
      });
      toast({ title: 'Family details saved' });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error saving the family', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit the family</DialogTitle>
          <DialogDescription>
            The email or phone below is what unlocks this family’s private link — changing it changes who can register with it.
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Children covered</Label>
              <Input
                type="number"
                min={1}
                max={6}
                value={form.children_allowed}
                onChange={e => set('children_allowed', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Link expires</Label>
              <Input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Anything the desk should know about this family" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save family'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}