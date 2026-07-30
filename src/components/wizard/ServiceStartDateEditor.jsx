import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit3, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { logStatusChange } from '@/lib/logStatusChange';
import { addDays, format } from 'date-fns';
import { toast } from 'sonner';

// Inline, click-to-edit service start date.
// On change, recalculates dependent dates:
//   - WD: completion_date is auto-derived (16 wks), followup_90day_date is derived from employment_start_date (90d)
//   - DEA: completion_date derived (2 wks), followup_90day_date derived from completion_date (90d)
// Only updates dates that currently rely on the start date (we do NOT overwrite a completion_date
// that has been explicitly set / no longer projected, to avoid destroying real data).
export default function ServiceStartDateEditor({ client, onClientUpdate, displayFormat = 'MMM d, yyyy', inline = false }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(client?.service_start_date || '');
  const [saving, setSaving] = useState(false);

  const isDEA = client?.service_type === 'direct_to_employment';
  const isWD = client?.service_type === 'pathways';

  const reset = () => {
    setValue(client?.service_start_date || '');
    setEditing(false);
  };

  const handleSave = async () => {
    if (!value) {
      toast.error('Please enter a start date');
      return;
    }
    setSaving(true);
    try {
      let me = null;
      try { me = await base44.auth.me(); } catch (_) {}

      const updates = { service_start_date: value };
      const notes = [...(client?.roadmap_progress_notes || [])];
      const impacts = [];

      // Recalculate projected completion date if it was never explicitly completed
      // (i.e. program not yet complete). WD = 16 weeks, DEA = 2 weeks from start.
      const programNotComplete = client?.program_status !== 'complete';
      const programNotCancelled = client?.program_status !== 'cancelled' && client?.program_status !== 'incomplete';
      if (programNotComplete && programNotCancelled) {
        const weeks = isWD ? 16 : isDEA ? 2 : null;
        if (weeks) {
          const projectedCompletion = format(
            addDays(new Date(value + 'T12:00:00'), weeks * 7),
            'yyyy-MM-dd'
          );
          // Only set completion_date if it was previously empty OR previously projected from the old start
          // We cannot reliably detect "projected vs real", so only auto-set when it's currently empty.
          if (!client?.completion_date) {
            updates.completion_date = projectedCompletion;
            impacts.push(`anticipated completion ${projectedCompletion}`);
          }
        }

        // DEA: followup_90day_date derives from completion_date (+90). If completion was just projected above,
        // set the followup too (only when not already set).
        if (isDEA && !client?.followup_90day_date && updates.completion_date) {
          updates.followup_90day_date = format(
            addDays(new Date(updates.completion_date + 'T12:00:00'), 90),
            'yyyy-MM-dd'
          );
          impacts.push(`90-day follow-up ${updates.followup_90day_date}`);
        }
      }

      notes.unshift({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        event_type: 'start_date_updated',
        item_label: 'Program Start Date Updated',
        item_key: 'start_date_updated',
        note: `Service start date set to ${value}${impacts.length ? `. Adjusted: ${impacts.join(', ')}.` : '.'}`,
        logged_by: me?.email || '',
        logged_by_name: me?.full_name || '',
        compass_entered: false,
      });
      updates.roadmap_progress_notes = notes;

      // If the program had not yet started, set program_status to in_progress so the date "takes".
      if (client?.program_status !== 'in_progress' && !client?.program_status) {
        updates.program_status = 'in_progress';
      }

      const updated = await base44.entities.Client.update(client.id, updates);
      await logStatusChange({
        client,
        change_type: 'program_status_change',
        from_value: client?.program_status || 'not_started',
        to_value: updates.program_status || client?.program_status || 'in_progress',
        notes: `Service start date set to ${value}${impacts.length ? `. Adjusted: ${impacts.join(', ')}.` : '.'}`,
      });
      onClientUpdate?.(updated);
      setEditing(false);
      toast.success('Start date updated' + (impacts.length ? ` (${impacts.join(', ')})` : ''));
    } catch (e) {
      toast.error('Failed to update start date');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <span className={`inline-flex items-center gap-1 ${inline ? '' : 'flex flex-col items-start gap-1'}`}>
        <Input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`h-6 text-xs py-0 px-1 ${inline ? 'w-auto' : 'w-40'}`}
          disabled={saving}
          autoFocus
        />
        <span className="inline-flex gap-0.5">
          <Button
            size="icon"
            className="h-6 w-6"
            onClick={handleSave}
            disabled={saving || !value}
            title="Save"
          >
            <Check className="w-3 h-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={reset}
            disabled={saving}
            title="Cancel"
          >
            <X className="w-3 h-3" />
          </Button>
        </span>
      </span>
    );
  }

  const label = client?.service_start_date
    ? format(new Date(client.service_start_date + 'T12:00:00'), displayFormat)
    : 'Set start date';

  return (
    <button
      type="button"
      onClick={() => { setValue(client?.service_start_date || new Date().toISOString().split('T')[0]); setEditing(true); }}
      className="inline-flex items-center gap-1 text-xs font-semibold hover:underline text-emerald-700"
      title="Click to edit the program start date"
    >
      {label}
      <Edit3 className="w-3 h-3 opacity-60" />
    </button>
  );
}