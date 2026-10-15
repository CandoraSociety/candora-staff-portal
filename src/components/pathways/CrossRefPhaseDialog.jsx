import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FOLLOWUP_90DAY_CODES, outcomeLabel } from '@/lib/crtCodes';
import { classifyClient } from '@/lib/clientClassification';
import { logStatusChange } from '@/lib/logStatusChange';
import { addDays, format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const PHASE_LABELS = {
  not_started: 'Not Started',
  program_started: 'Active (EDA)',
  work_search: 'Work Search',
  followup_period: '90-Day Follow-up',
  completed: 'Completed',
  incomplete_cancelled: 'Incomplete/Cancelled',
};

export const PHASE_BADGE_CLASS = {
  not_started: 'bg-slate-100 text-slate-600',
  program_started: 'bg-blue-100 text-blue-700',
  work_search: 'bg-purple-100 text-purple-700',
  followup_period: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-700',
  incomplete_cancelled: 'bg-red-100 text-red-700',
};

const STREAMS = [
  { value: 'direct_to_employment', label: 'DEA (Direct to Employment)' },
  { value: 'pathways', label: 'WD (Workforce Development)' },
];

// Selectable phases — 'incomplete' and 'cancelled' both map to the
// classifyClient 'incomplete_cancelled' bucket.
const PHASE_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'program_started', label: 'Active (EDA)' },
  { value: 'work_search', label: 'Work Search Phase', wdOnly: true },
  { value: 'followup_period', label: '90-Day Follow-up Period' },
  { value: 'completed', label: 'Completed (90-Day Done)' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'cancelled', label: 'Cancelled' },
];

const todayStr = () => new Date().toISOString().split('T')[0];

// Which date inputs each phase needs. Fields are pre-filled from the client
// record so an existing value is never silently wiped unless the staff member
// changes the phase.
const fieldsForPhase = (phase) => ({
  not_started: [],
  program_started: ['service_start_date'],
  work_search: ['service_start_date', 'completion_date'],
  followup_period: ['service_start_date', 'completion_date', 'followup_90day_date'],
  completed: ['completion_date', 'followup_90day_status', 'followup_90day_date'],
  incomplete: [],
  cancelled: [],
}[phase] || []);

const FIELD_LABELS = {
  service_start_date: 'Service Start Date',
  completion_date: 'Program Completion Date',
  followup_90day_date: '90-Day Date',
};

export default function CrossRefPhaseDialog({ row, client, onClose, onSaved }) {
  const open = !!(row && client);
  const [stream, setStream] = useState('direct_to_employment');
  const [phase, setPhase] = useState('program_started');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [initialPhase, setInitialPhase] = useState('');

  // Initialize from the matched client record each time the dialog opens.
  useEffect(() => {
    if (!open || !client) return;
    const crtServiceElement = (row?.crt?.service_element || '').trim().toUpperCase();
    setStream(
      client.service_type === 'pathways' || crtServiceElement === 'WD'
        ? 'pathways'
        : 'direct_to_employment'
    );
    const cl = classifyClient(client);
    setPhase(cl === 'incomplete_cancelled' ? (client.program_status || 'incomplete') : cl);
    setForm({
      service_start_date: client.service_start_date || '',
      completion_date: client.completion_date || '',
      followup_90day_date: client.followup_90day_date || '',
      followup_90day_status: client.followup_90day_status || '',
    });
    setInitialPhase(classifyClient(client) || 'not_started');
  }, [open, client, row]);

  if (!open) return null;

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const phases = PHASE_OPTIONS.filter(p => !p.wdOnly || stream === 'pathways');
  const fields = fieldsForPhase(phase);
  const showOutcome = phase === 'completed';

  const handleSave = async () => {
    // Validate the required dates for the chosen phase
    if (phase === 'program_started' && !form.service_start_date) { toast.error('Enter the service start date'); return; }
    if (['work_search', 'followup_period', 'completed'].includes(phase) && !form.completion_date) { toast.error('Enter the program completion date'); return; }
    if (phase === 'completed' && !form.followup_90day_status) { toast.error('Select the 90-day outcome'); return; }
    if (phase === 'completed' && !form.followup_90day_date) { toast.error('Enter the 90-day outcome date'); return; }

    setSaving(true);
    try {
      let me = null; try { me = await base44.auth.me(); } catch (_) {}
      const today = todayStr();

      let updates = { service_type: stream };
      switch (phase) {
        case 'not_started':
          updates = {
            ...updates,
            program_status: null, service_start_date: null,
            completion_date: null, eda_completion_date: null,
            followup_90day_date: null, followup_90day_status: null,
          };
          break;
        case 'program_started':
          updates.program_status = 'in_progress';
          updates.service_start_date = form.service_start_date;
          break;
        case 'work_search':
          updates.program_status = 'in_progress';
          updates.service_start_date = form.service_start_date || null;
          updates.completion_date = form.completion_date;
          updates.eda_completion_date = form.completion_date;
          break;
        case 'followup_period': {
          updates.program_status = 'complete';
          updates.service_start_date = form.service_start_date || null;
          updates.completion_date = form.completion_date;
          updates.eda_completion_date = form.completion_date;
          // 90-day due date defaults to completion + 90 days (editable)
          updates.followup_90day_date = form.followup_90day_date
            || format(addDays(new Date(form.completion_date + 'T12:00:00'), 90), 'yyyy-MM-dd');
          updates.followup_90day_status = null;
          break;
        }
        case 'completed':
          updates.program_status = 'complete';
          updates.completion_date = form.completion_date;
          updates.eda_completion_date = form.completion_date;
          updates.followup_90day_status = form.followup_90day_status;
          updates.followup_90day_date = form.followup_90day_date;
          break;
        case 'incomplete':
        case 'cancelled':
          updates.program_status = phase;
          break;
      }

      // Add a progress-timeline entry so the change shows in Program Steps history
      const notes = [...(client.roadmap_progress_notes || [])];
      const phaseLabel = PHASE_OPTIONS.find(p => p.value === phase)?.label || phase;
      notes.unshift({
        id: Date.now().toString(),
        date: today,
        event_type: 'phase_set',
        item_label: 'Program Phase Set (Cross-Reference)',
        item_key: 'phase_set',
        note: `Phase set to ${phaseLabel} from the Cross-Reference tab (legacy client).`,
        logged_by: me?.email || '',
        logged_by_name: me?.full_name || '',
        compass_entered: true,
      });

      const updated = await base44.entities.Client.update(client.id, {
        ...updates,
        roadmap_progress_notes: notes,
      });

      try {
        await logStatusChange({
          client,
          change_type: 'program_status_change',
          from_value: initialPhase,
          to_value: phase,
          notes: `Program phase set from Cross-Reference tab: ${phaseLabel}`,
        });
      } catch (_) { /* status log is best-effort */ }

      toast.success(`Program phase set to ${phaseLabel}`);
      onSaved?.(updated);
    } catch (e) {
      toast.error('Failed to set the program phase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set Program Phase</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-slate-700">{row?.client_name || client.first_name + ' ' + client.last_name}</span>
            {' '}— current phase: <span className="font-medium">{PHASE_LABELS[initialPhase] || initialPhase || 'Not tracked'}</span>.
            This updates their Pathways profile so Program Steps reflects where they are.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Program Stream</Label>
            <Select value={stream} onValueChange={setStream}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STREAMS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Program Phase</Label>
            <Select value={phase} onValueChange={setPhase}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {phases.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {fields.includes('service_start_date') && (
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.service_start_date} {phase !== 'program_started' && <span className="text-slate-400 font-normal">(optional)</span>}</Label>
              <Input type="date" value={form.service_start_date || ''} onChange={e => set('service_start_date', e.target.value)} />
            </div>
          )}

          {fields.includes('completion_date') && (
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.completion_date}</Label>
              <Input type="date" value={form.completion_date || ''} onChange={e => set('completion_date', e.target.value)} />
            </div>
          )}

          {phase === 'followup_period' && (
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.followup_90day_date} <span className="text-slate-400 font-normal">(defaults to completion + 90 days)</span></Label>
              <Input type="date" value={form.followup_90day_date || ''} onChange={e => set('followup_90day_date', e.target.value)} />
            </div>
          )}

          {showOutcome && (
            <>
              <div className="space-y-1.5">
                <Label>90-Day Outcome</Label>
                <Select value={form.followup_90day_status || ''} onValueChange={v => set('followup_90day_status', v)}>
                  <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
                  <SelectContent>
                    {FOLLOWUP_90DAY_CODES.map(code => (
                      <SelectItem key={code} value={code}>{outcomeLabel(code)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>90-Day Outcome Date</Label>
                <Input type="date" value={form.followup_90day_date || todayStr()} onChange={e => set('followup_90day_date', e.target.value)} />
              </div>
            </>
          )}

          {(phase === 'incomplete' || phase === 'cancelled') && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
              The client's program will be marked as {phase === 'incomplete' ? 'Incomplete' : 'Cancelled'} and excluded from the cross-reference review.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Phase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}