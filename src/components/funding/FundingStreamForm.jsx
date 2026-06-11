import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STREAM_TYPES = ['operating','project','capital','capacity_building','research','other'];
const CYCLES = ['rolling','annual','biannual','quarterly','one_time','unknown'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function FundingStreamForm({ stream = null, sourceId, sourceName, onClose }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: stream?.name || '',
    description: stream?.description || '',
    stream_type: stream?.stream_type || 'project',
    typical_amount_min: stream?.typical_amount_min || '',
    typical_amount_max: stream?.typical_amount_max || '',
    eligibility_notes: stream?.eligibility_notes || '',
    application_url: stream?.application_url || '',
    application_cycle: stream?.application_cycle || 'annual',
    typical_deadline_month: stream?.typical_deadline_month || '',
    is_active: stream?.is_active ?? true,
    notes: stream?.notes || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      funding_source_id: sourceId,
      funding_source_name: sourceName,
      typical_amount_min: form.typical_amount_min ? Number(form.typical_amount_min) : undefined,
      typical_amount_max: form.typical_amount_max ? Number(form.typical_amount_max) : undefined,
      typical_deadline_month: form.typical_deadline_month ? Number(form.typical_deadline_month) : undefined,
    };
    if (stream?.id) {
      await base44.entities.FundingStream.update(stream.id, payload);
    } else {
      await base44.entities.FundingStream.create(payload);
    }
    queryClient.invalidateQueries(['fundingStreams']);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stream ? 'Edit Stream' : `New Stream — ${sourceName}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Stream / Program Name *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Settlement Program" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <select value={form.stream_type} onChange={e => set('stream_type', e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {STREAM_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <Label>Application Cycle</Label>
              <select value={form.application_cycle} onChange={e => set('application_cycle', e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {CYCLES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Typical Min ($)</Label>
              <Input type="number" value={form.typical_amount_min} onChange={e => set('typical_amount_min', e.target.value)} />
            </div>
            <div>
              <Label>Typical Max ($)</Label>
              <Input type="number" value={form.typical_amount_max} onChange={e => set('typical_amount_max', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Typical Deadline Month</Label>
              <select value={form.typical_deadline_month} onChange={e => set('typical_deadline_month', e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">Unknown</option>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <Label>Application URL</Label>
              <Input value={form.application_url} onChange={e => set('application_url', e.target.value)} placeholder="https://" />
            </div>
          </div>
          <div>
            <Label>Eligibility Notes</Label>
            <textarea value={form.eligibility_notes} onChange={e => set('eligibility_notes', e.target.value)} rows={3} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <Label>Notes</Label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="stream_active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="rounded" />
            <Label htmlFor="stream_active">Active</Label>
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