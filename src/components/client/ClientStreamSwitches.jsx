import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, ArrowRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { createCompassTask, taskStreamSwitch } from '@/lib/compassTasks';

const STREAMS = [
  { value: 'direct_to_employment', label: 'Direct to Employment (DEA)' },
  { value: 'pathways',             label: 'Workforce Development (WD)' },
  { value: 'casual',               label: 'Casual' },
  { value: 'external_referral',    label: 'External Referral' },
  { value: 'internal_referral',    label: 'Internal Referral' },
  { value: 'not_eligible',         label: 'Not Eligible' },
];

const SWITCH_REASONS = [
  { value: 'client_request',       label: 'Client Request' },
  { value: 'program_fit',          label: 'Program Fit' },
  { value: 'employer_readiness',   label: 'Employer Readiness' },
  { value: 'language_barrier',     label: 'Language Barrier' },
  { value: 'credential_recognition', label: 'Credential Recognition' },
  { value: 'skills_gap',           label: 'Skills Gap' },
  { value: 'employment_found',     label: 'Employment Found' },
  { value: 'scheduling_conflict',  label: 'Scheduling Conflict' },
  { value: 'personal_circumstances', label: 'Personal Circumstances' },
  { value: 'program_completion',   label: 'Program Completion' },
  { value: 'staff_recommendation', label: 'Staff Recommendation' },
  { value: 'funding_change',       label: 'Funding Change' },
  { value: 'other',                label: 'Other' },
];

const streamLabel = (v) => STREAMS.find(s => s.value === v)?.label || v;
const reasonLabel = (v) => SWITCH_REASONS.find(r => r.value === v)?.label || v;
const today = new Date().toISOString().split('T')[0];

const emptySwitch = (currentStream) => ({
  from_stream: currentStream || '',
  to_stream: '',
  reason: '',
  reason_other: '',
  date: today,
  notes: '',
});

export default function ClientStreamSwitches({ client, onSave }) {
  const [switches, setSwitches] = useState(client?.program_stream_switches || []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptySwitch(client?.service_type));
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleAdd = async () => {
    if (!form.from_stream || !form.to_stream || !form.reason) {
      toast.error('From stream, To stream, and Reason are required');
      return;
    }
    setSaving(true);
    try {
      const entry = { ...form };
      if (entry.reason !== 'other') entry.reason_other = '';
      const updated = [...switches, entry];

      await onSave({ program_stream_switches: updated, service_type: form.to_stream });
      setSwitches(updated);

      // Log StatusChange
      const me = await base44.auth.me().catch(() => null);
      await base44.entities.StatusChange.create({
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        change_type: 'stream_switch',
        change_date: form.date,
        from_value: streamLabel(form.from_stream),
        to_value: streamLabel(form.to_stream),
        notes: [reasonLabel(form.reason), form.reason_other, form.notes].filter(Boolean).join(' — '),
        logged_by: me?.email || null,
        logged_by_name: me?.full_name || null,
        billing_relevant: true,
      });

      // Compass task
      const reasonText = form.reason === 'other'
        ? form.reason_other || 'Other'
        : reasonLabel(form.reason);
      await createCompassTask({
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        compass_hsid: client.compass_hsid || '',
        assigned_worker: client.assigned_worker,
        assigned_worker_name: client.assigned_worker_name,
        ...taskStreamSwitch(client, streamLabel(form.from_stream), streamLabel(form.to_stream), reasonText),
      });

      setForm(emptySwitch(form.to_stream));
      setAdding(false);
      toast.success('Stream switch logged');
    } catch (err) {
      toast.error('Failed to save stream switch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idx) => {
    const updated = switches.filter((_, i) => i !== idx);
    await onSave({ program_stream_switches: updated });
    setSwitches(updated);
    toast.success('Switch removed');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Program Stream Switch History</CardTitle>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <PlusCircle className="w-4 h-4 mr-1" /> Switch Program Stream
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Existing switches */}
        {switches.length === 0 && !adding && (
          <div className="text-center py-8 text-slate-400 text-sm">No stream switches recorded.</div>
        )}
        {switches.length > 0 && (
          <div className="space-y-3">
            {switches.map((sw, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-slate-600 font-medium">{streamLabel(sw.from_stream)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-sm text-blue-700 font-semibold">{streamLabel(sw.to_stream)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500">{sw.date}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(i)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-medium">Reason:</span>{' '}
                  {sw.reason === 'other' ? sw.reason_other || 'Other' : reasonLabel(sw.reason)}
                </p>
                {sw.notes && <p className="text-xs text-slate-500 mt-0.5">{sw.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {adding && (
          <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4 space-y-4">
            <p className="text-xs text-blue-600 font-medium">
              Note: the client's current stream will be updated to the "To" stream automatically.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">From Stream</Label>
                <div className="mt-1 bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-500">
                  {streamLabel(form.from_stream) || '—'}
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">To Stream <span className="text-red-500">*</span></Label>
                <Select value={form.to_stream} onValueChange={v => set('to_stream', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {STREAMS.filter(s => s.value !== form.from_stream).map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Reason <span className="text-red-500">*</span></Label>
              <Select value={form.reason} onValueChange={v => set('reason', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {SWITCH_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {form.reason === 'other' && (
              <div>
                <Label className="text-xs font-semibold">Please specify</Label>
                <Input className="mt-1" value={form.reason_other} onChange={e => set('reason_other', e.target.value)} />
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold">Date of Switch</Label>
              <Input type="date" className="mt-1" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>

            <div>
              <Label className="text-xs font-semibold">Additional Notes <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Textarea rows={2} className="mt-1" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setAdding(false); setForm(emptySwitch(client?.service_type)); }}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={saving || !form.from_stream || !form.to_stream || !form.reason}
              >
                {saving ? 'Saving…' : 'Save Switch'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}