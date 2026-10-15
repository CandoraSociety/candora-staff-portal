import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { classifyClient } from '@/lib/clientClassification';
import { logStatusChange } from '@/lib/logStatusChange';
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

const PHASE_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'program_started', label: 'Active (EDA)' },
  { value: 'work_search', label: 'Work Search Phase' },
  { value: 'followup_period', label: '90-Day Follow-up Period' },
  { value: 'completed', label: 'Completed (90-Day Done)' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'cancelled', label: 'Cancelled' },
];

const todayStr = () => new Date().toISOString().split('T')[0];

export default function CrossRefPhaseDialog({ row, client, onClose, onSaved }) {
  const open = !!(row && client);
  const [phase, setPhase] = useState('not_started');
  const [initialPhase, setInitialPhase] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !client) return;
    const cl = classifyClient(client);
    setInitialPhase(cl || 'not_started');
    setPhase(cl === 'incomplete_cancelled' ? (client.program_status || 'incomplete') : cl);
  }, [open, client]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      let me = null; try { me = await base44.auth.me(); } catch (_) {}
      const today = todayStr();
      const cd = client.completion_date || today;

      // Minimal profile fields so the client's Program Steps classification
      // lands on the chosen phase. Existing dates are kept when present;
      // missing ones default to today.
      let updates = {};
      switch (phase) {
        case 'not_started':
          updates = {
            program_status: null, service_start_date: null,
            completion_date: null, eda_completion_date: null,
            followup_90day_date: null, followup_90day_status: null,
          };
          break;
        case 'program_started':
          updates = {
            program_status: 'in_progress',
            service_start_date: client.service_start_date || today,
            completion_date: null, eda_completion_date: null,
            followup_90day_status: null,
          };
          break;
        case 'work_search':
          updates = {
            service_type: 'pathways',
            program_status: 'in_progress',
            service_start_date: client.service_start_date || today,
            completion_date: cd, eda_completion_date: cd,
            followup_90day_status: null,
          };
          break;
        case 'followup_period':
          updates = {
            program_status: 'complete',
            service_start_date: client.service_start_date || today,
            completion_date: cd, eda_completion_date: cd,
            followup_90day_status: null,
          };
          break;
        case 'completed':
          updates = {
            program_status: 'complete',
            service_start_date: client.service_start_date || today,
            completion_date: cd, eda_completion_date: cd,
            followup_90day_status: client.followup_90day_status || 'P',
          };
          break;
        case 'incomplete':
        case 'cancelled':
          updates = { program_status: phase };
          break;
      }

      // Progress-timeline entry so the change shows in Program Steps history
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Set Program Phase</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-slate-700">{row?.client_name || client.first_name + ' ' + client.last_name}</span>
            {' '}— current phase: <span className="font-medium">{PHASE_LABELS[initialPhase] || initialPhase || 'Not tracked'}</span>.
            This updates their Pathways profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>Program Phase</Label>
          <Select value={phase} onValueChange={setPhase}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PHASE_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
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