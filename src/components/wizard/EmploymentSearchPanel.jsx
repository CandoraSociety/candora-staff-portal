import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, CheckCircle2, Save, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createCompassTask, taskEmploymentOutcome } from '@/lib/compassTasks';
import { toast } from 'sonner';

const EMPLOYMENT_CODES = [
  { value: 'E-RF',  label: 'E-RF — Employed, Regular Full-time' },
  { value: 'E-UF',  label: 'E-UF — Employed, Unrelated Field' },
  { value: 'E-PT',  label: 'E-PT — Employed, Part-time' },
  { value: 'UE',    label: 'UE — Unemployed' },
  { value: 'UE-LFW', label: 'UE-LFW — Unemployed, Looking for Work' },
  { value: 'UE-S',  label: 'UE-S — Unemployed, Student' },
  { value: 'NA',    label: 'NA — Not Applicable' },
];

const isEmployed = (v) => v && ['E-RF', 'E-UF', 'E-PT'].includes(v);

export default function EmploymentSearchPanel({ client, onSave, onClientUpdate }) {
  const [form, setForm] = useState({
    employment_status:                 client?.employment_status || '',
    employer_name:                     client?.employer_name || '',
    employer_contact:                  client?.employer_contact || '',
    job_title:                         client?.job_title || '',
    job_start_date:                    client?.job_start_date || '',
    job_wage:                          client?.job_wage || '',
    job_hours:                         client?.job_hours || '',
    employment_start_date:             client?.employment_start_date || '',
    post_completion_employment_status: client?.post_completion_employment_status || '',
    post_completion_employment_date:   client?.post_completion_employment_date || '',
  });
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const employed = isEmployed(form.employment_status);
  const wasEmployed = isEmployed(client?.employment_status);
  const newlyEmployed = employed && !wasEmployed;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = { ...form };
      if (form.job_wage !== '') updates.job_wage = parseFloat(form.job_wage) || 0;

      // If newly employed, stamp employment_start_date and external_employer
      if (newlyEmployed && form.job_start_date) {
        updates.employment_start_date = form.job_start_date;
        updates.external_employer = true;
      }

      const updated = await base44.entities.Client.update(client.id, updates);
      onClientUpdate?.(updated);
      onSave?.(updates);

      // Compass task + StatusChange if newly employed
      if (newlyEmployed) {
        await createCompassTask({
          client_id: client.id,
          client_name: `${client.first_name} ${client.last_name}`,
          compass_hsid: client.compass_hsid || '',
          assigned_worker: client.assigned_worker,
          assigned_worker_name: client.assigned_worker_name,
          ...taskEmploymentOutcome({ ...client, ...updates }),
        });
        const me = await base44.auth.me().catch(() => null);
        await base44.entities.StatusChange.create({
          client_id: client.id,
          client_name: `${client.first_name} ${client.last_name}`,
          change_type: 'employment_outcome',
          change_date: form.job_start_date || new Date().toISOString().split('T')[0],
          from_value: client?.employment_status || 'UE',
          to_value: form.employment_status,
          notes: [form.employer_name, form.job_title, notes].filter(Boolean).join(' — '),
          logged_by: me?.email || null,
          logged_by_name: me?.full_name || null,
          billing_relevant: true,
        });
      }

      toast.success('Employment information saved');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const currentStatusLabel = EMPLOYMENT_CODES.find(c => c.value === client?.employment_status)?.label;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          Employment Search
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Track job search progress and record employment outcomes. Saving here auto-populates the Employment tab and logs a status change when employment is achieved.
        </p>
      </div>

      {/* Current status banner */}
      {client?.employment_status && (
        <div className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-medium ${wasEmployed ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          {wasEmployed
            ? <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
            : <TrendingUp className="w-4 h-4 shrink-0 text-slate-400" />
          }
          <span>
            Current status: <strong>{currentStatusLabel || client.employment_status}</strong>
            {client.employer_name && ` · ${client.employer_name}`}
            {client.job_title && ` — ${client.job_title}`}
          </span>
        </div>
      )}

      {/* Employment Status card */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Employment Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-semibold">Status <span className="text-red-500">*</span></Label>
            <Select value={form.employment_status} onValueChange={v => set('employment_status', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select status…" /></SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_CODES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {employed && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <Label className="text-xs font-semibold">Employer Name</Label>
                <Input className="mt-1" value={form.employer_name} onChange={e => set('employer_name', e.target.value)} placeholder="Company name" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Employer Contact</Label>
                <Input className="mt-1" value={form.employer_contact} onChange={e => set('employer_contact', e.target.value)} placeholder="Phone or email" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Job Title</Label>
                <Input className="mt-1" value={form.job_title} onChange={e => set('job_title', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Start Date</Label>
                <Input type="date" className="mt-1" value={form.job_start_date} onChange={e => set('job_start_date', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Wage ($/hr)</Label>
                <Input type="number" step="0.01" className="mt-1" value={form.job_wage} onChange={e => set('job_wage', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Hours / Week</Label>
                <Input className="mt-1" value={form.job_hours} onChange={e => set('job_hours', e.target.value)} placeholder="e.g. 40 hrs/week" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post-completion status — only shown once program is complete */}
      {(client?.program_status === 'complete' || client?.completion_date) && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Post-Completion Employment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Post-Completion Status</Label>
                <Select value={form.post_completion_employment_status} onValueChange={v => set('post_completion_employment_status', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_CODES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    <SelectItem value="no_contact">No Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Date of Record</Label>
                <Input type="date" className="mt-1" value={form.post_completion_employment_date} onChange={e => set('post_completion_employment_date', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <div>
        <Label className="text-xs font-semibold text-slate-500">
          Notes <span className="font-normal">(optional — logged with status change if employment is achieved)</span>
        </Label>
        <Textarea rows={2} className="mt-1 text-sm" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional context…" />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-1" />
          {saving ? 'Saving…' : 'Save Employment Info'}
        </Button>
      </div>
    </div>
  );
}