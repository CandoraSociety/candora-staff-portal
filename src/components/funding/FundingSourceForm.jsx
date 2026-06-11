import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const FUNDER_TYPES = ['federal_government','provincial_government','municipal_government','foundation','corporate','individual','other'];
const RELATIONSHIP_STATUSES = ['prospect','active','lapsed','do_not_contact'];

export default function FundingSourceForm({ source = null, onClose }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: source?.name || '',
    funder_type: source?.funder_type || 'foundation',
    website: source?.website || '',
    contact_name: source?.contact_name || '',
    contact_email: source?.contact_email || '',
    contact_phone: source?.contact_phone || '',
    address: source?.address || '',
    description: source?.description || '',
    notes: source?.notes || '',
    relationship_status: source?.relationship_status || 'prospect',
    is_active: source?.is_active ?? true,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (source?.id) {
      await base44.entities.FundingSource.update(source.id, form);
    } else {
      await base44.entities.FundingSource.create(form);
    }
    queryClient.invalidateQueries(['fundingSources']);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{source ? 'Edit Funder' : 'New Funding Source'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Organization name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <select value={form.funder_type} onChange={e => set('funder_type', e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {FUNDER_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <Label>Relationship</Label>
              <select value={form.relationship_status} onChange={e => set('relationship_status', e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {RELATIONSHIP_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Website</Label>
            <Input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contact Name</Label>
              <Input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Contact Phone</Label>
            <Input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <Label>Notes</Label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="rounded" />
            <Label htmlFor="is_active">Active</Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}