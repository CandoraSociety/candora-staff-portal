import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

const HUB_TYPES = ['ongoing_core', 'grant'];
const DEADLINE_TYPES = ['progress_report','interim_report','final_report','financial_report','outcome_report','other'];

export default function AddHubModal({ existingHub = null, onClose }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: existingHub?.name || '',
    funding_source_name: existingHub?.funding_source_name || '',
    hub_type: existingHub?.hub_type || 'grant',
    reporting_contact_name: existingHub?.reporting_contact_name || '',
    reporting_contact_email: existingHub?.reporting_contact_email || '',
    portal_url: existingHub?.portal_url || '',
    portal_login_notes: existingHub?.portal_login_notes || '',
    notes: existingHub?.notes || '',
    is_active: existingHub?.is_active ?? true,
  });
  const [deadlines, setDeadlines] = useState([]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addDeadline = () => setDeadlines(d => [...d, { title: '', deadline_type: 'progress_report', due_date: '' }]);
  const removeDeadline = (i) => setDeadlines(d => d.filter((_, idx) => idx !== i));
  const updateDeadline = (i, k, v) => setDeadlines(d => d.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    let hubId = existingHub?.id;
    if (existingHub) {
      await base44.entities.FunderReportingHub.update(existingHub.id, form);
    } else {
      const created = await base44.entities.FunderReportingHub.create(form);
      hubId = created.id;
    }
    // Create deadlines for new hubs
    if (!existingHub && deadlines.length > 0) {
      for (const d of deadlines) {
        if (d.title && d.due_date) {
          await base44.entities.FunderReportingDeadline.create({
            hub_id: hubId,
            title: d.title,
            deadline_type: d.deadline_type,
            due_date: d.due_date,
            status: 'upcoming',
          });
        }
      }
    }
    queryClient.invalidateQueries(['funder-hubs']);
    queryClient.invalidateQueries(['funder-deadlines']);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingHub ? 'Edit Reporting Hub' : 'New Reporting Hub'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Hub Name *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. IRCC 2024–2025 Reporting" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Funder Name</Label>
              <Input value={form.funding_source_name} onChange={e => set('funding_source_name', e.target.value)} />
            </div>
            <div>
              <Label>Hub Type</Label>
              <select value={form.hub_type} onChange={e => set('hub_type', e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="ongoing_core">Ongoing / Core Funder</option>
                <option value="grant">Grant</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contact Name</Label>
              <Input value={form.reporting_contact_name} onChange={e => set('reporting_contact_name', e.target.value)} />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input value={form.reporting_contact_email} onChange={e => set('reporting_contact_email', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Portal URL</Label>
            <Input value={form.portal_url} onChange={e => set('portal_url', e.target.value)} placeholder="https://" />
          </div>
          <div>
            <Label>Portal Login Notes</Label>
            <textarea value={form.portal_login_notes} onChange={e => set('portal_login_notes', e.target.value)} rows={2} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <Label>Notes</Label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none" />
          </div>

          {/* Deadlines (new hub only) */}
          {!existingHub && (
            <div className="border border-border rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Reporting Deadlines</p>
                <Button variant="outline" size="sm" onClick={addDeadline} className="gap-1 text-xs h-7">
                  <Plus className="h-3.5 w-3.5" />Add
                </Button>
              </div>
              {deadlines.map((d, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
                  <Input value={d.title} onChange={e => updateDeadline(i, 'title', e.target.value)} placeholder="Label" className="text-xs h-8" />
                  <Input type="date" value={d.due_date} onChange={e => updateDeadline(i, 'due_date', e.target.value)} className="text-xs h-8" />
                  <select value={d.deadline_type} onChange={e => updateDeadline(i, 'deadline_type', e.target.value)} className="h-8 rounded-md border border-input bg-transparent px-2 text-xs">
                    {DEADLINE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeDeadline(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {deadlines.length === 0 && <p className="text-xs text-muted-foreground">No deadlines added yet</p>}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}