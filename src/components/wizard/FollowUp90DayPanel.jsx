import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, CalendarCheck, Bell, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createCompassTask, task90DayFollowup } from '@/lib/compassTasks';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';

const EMPLOYMENT_CODES = [
  { value: 'E-RF',       label: 'E-RF — Employed, Regular Full-time' },
  { value: 'E-UF',       label: 'E-UF — Employed, Union Full-time' },
  { value: 'E-PT',       label: 'E-PT — Employed, Part-time' },
  { value: 'UE',         label: 'UE — Unemployed' },
  { value: 'UE-LFW',     label: 'UE-LFW — Unemployed, Looking for Work' },
  { value: 'UE-S',       label: 'UE-S — Unemployed, Student' },
  { value: 'NA',         label: 'NA — Not Applicable' },
  { value: 'no_contact', label: 'No Contact' },
  { value: 'UTC',        label: 'UTC — Unable to Contact' },
];

export default function FollowUp90DayPanel({ client, onClientUpdate }) {
  const [form, setForm] = useState({
    followup_90day_status: client?.followup_90day_status || '',
    followup_90day_date:   client?.followup_90day_date || '',
    post_completion_employment_status: client?.post_completion_employment_status || '',
    post_completion_employment_date:   client?.post_completion_employment_date || '',
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const isDone = !!client?.followup_90day_status;

  const followup90Date = client?.followup_90day_date;
  const daysUntil = followup90Date
    ? differenceInDays(new Date(followup90Date + 'T12:00:00'), new Date())
    : null;
  const isOverdue  = daysUntil !== null && daysUntil < 0;
  const isUrgent   = daysUntil !== null && daysUntil >= 0 && daysUntil <= 5;

  const handleSave = async () => {
    if (!form.followup_90day_status) { toast.error('Select a 90-day status'); return; }
    setSaving(true);
    try {
      const updates = {
        followup_90day_status: form.followup_90day_status,
        followup_90day_date:   form.followup_90day_date || new Date().toISOString().split('T')[0],
        post_completion_employment_status: form.post_completion_employment_status,
        post_completion_employment_date:   form.post_completion_employment_date,
      };
      const updated = await base44.entities.Client.update(client.id, updates);
      onClientUpdate?.(updated);

      // Compass task
      await createCompassTask({
        client_id: client.id,
        task_type: 'followup_90day',
        ...task90DayFollowup({ ...client, ...updates }),
      });

      // StatusChange log
      const me = await base44.auth.me().catch(() => null);
      await base44.entities.StatusChange.create({
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        change_type: 'followup_90day',
        change_date: updates.followup_90day_date,
        to_value: form.followup_90day_status,
        notes: notes || null,
        logged_by: me?.email || null,
        logged_by_name: me?.full_name || null,
        billing_relevant: true,
      });

      toast.success('90-day follow-up recorded');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.Client.update(client.id, {
        followup_90day_status: null,
        followup_90day_date: client?.followup_90day_date, // keep date
      });
      onClientUpdate?.(updated);
      setForm(prev => ({ ...prev, followup_90day_status: '' }));
      toast.success('90-day follow-up reset');
    } catch { toast.error('Failed to reset'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-primary" />
          90-Day Follow-Up
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Record the client's employment status 90 days after program completion. This is a billing milestone.
        </p>
      </div>

      {/* Due date alert */}
      {client?.followup_90day_date && (
        <div className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-medium ${
          isDone       ? 'bg-green-50 border-green-200 text-green-700' :
          isOverdue    ? 'bg-red-50 border-red-200 text-red-700' :
          isUrgent     ? 'bg-amber-50 border-amber-300 text-amber-800' :
                         'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {isDone
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : (isOverdue || isUrgent)
              ? <Bell className="w-4 h-4 shrink-0 animate-bounce" />
              : <CalendarCheck className="w-4 h-4 shrink-0" />
          }
          <span>
            {isDone
              ? `Completed — status: ${EMPLOYMENT_CODES.find(c => c.value === client.followup_90day_status)?.label || client.followup_90day_status}`
              : isOverdue
                ? `Overdue by ${Math.abs(daysUntil)} days — due ${client.followup_90day_date}`
                : isUrgent
                  ? `Due in ${daysUntil} day${daysUntil === 1 ? '' : 's'} — ${client.followup_90day_date}`
                  : `Due: ${client.followup_90day_date} (${daysUntil} days away)`
            }
          </span>
          {isDone && (
            <Button size="sm" variant="ghost" className="ml-auto h-6 text-xs text-green-700" onClick={handleUndo} disabled={saving}>
              Undo
            </Button>
          )}
        </div>
      )}

      {!isDone && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Record Follow-Up</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">90-Day Employment Status <span className="text-red-500">*</span></Label>
                <Select value={form.followup_90day_status} onValueChange={v => set('followup_90day_status', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_CODES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Date of Follow-Up</Label>
                <Input type="date" className="mt-1" value={form.followup_90day_date} onChange={e => set('followup_90day_date', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Post-Completion Emp. Status</Label>
                <Select value={form.post_completion_employment_status} onValueChange={v => set('post_completion_employment_status', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_CODES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Post-Completion Date</Label>
                <Input type="date" className="mt-1" value={form.post_completion_employment_date} onChange={e => set('post_completion_employment_date', e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-500">Notes <span className="font-normal">(optional)</span></Label>
              <Textarea rows={2} className="mt-1 text-sm" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Saving…' : 'Record 90-Day Follow-Up'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}