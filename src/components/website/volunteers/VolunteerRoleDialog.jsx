import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const EMPTY = {
  title: '', summary: '', description: '', commitment: '', requirements: '',
  location_name: '', coordinator_name: '', coordinator_email: '', is_open: true, order: 0,
};

export default function VolunteerRoleDialog({ open, onOpenChange, role, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, ...(role || {}) });
  }, [open, role]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!form.title.trim()) {
      toast.error('Give the role a title first.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, order: Number(form.order) || 0 };
      delete payload.id;
      delete payload.created_date;
      delete payload.updated_date;
      delete payload.created_by_id;
      if (role?.id) await base44.entities.VolunteerRole.update(role.id, payload);
      else await base44.entities.VolunteerRole.create(payload);
      toast.success('Role saved.');
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || 'The role could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role?.id ? 'Edit volunteer role' : 'New volunteer role'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Community Lunch Volunteer" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">One line for the card</Label>
            <Input value={form.summary} onChange={(e) => set('summary', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">What the volunteer does</Label>
            <Textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Commitment</Label>
              <Input value={form.commitment} onChange={(e) => set('commitment', e.target.value)} placeholder="Two Tuesday mornings a month" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Location</Label>
              <Input value={form.location_name} onChange={(e) => set('location_name', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">What is needed</Label>
            <Textarea rows={2} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Coordinator</Label>
              <Input value={form.coordinator_name} onChange={(e) => set('coordinator_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Coordinator email</Label>
              <Input value={form.coordinator_email} onChange={(e) => set('coordinator_email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">List position</Label>
              <Input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={!!form.is_open} onCheckedChange={(value) => set('is_open', value)} />
            Open — shows on the website and takes applications
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save role'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}