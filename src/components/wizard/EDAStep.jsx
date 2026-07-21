import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Generic EDA (Employment Development Activity) tracker step.
 * Renders for action plan items that don't have a specialized step component.
 *
 * - Pathways: stores date/notes in sdp_item_details[edaKey]
 * - DEA: stores date/notes on the matching dea_activities item
 */
export default function EDAStep({ client, edaKey, edaLabel, onSave, onComplete }) {
  const isDEA = edaKey.startsWith('dea_');
  const deaActivityId = isDEA ? edaKey.replace('dea_', '') : null;

  const pathwaysDetails = !isDEA ? (client?.sdp_item_details?.[edaKey] || {}) : {};
  const deaActivity = isDEA ? (client?.dea_activities || []).find(a => a.id === deaActivityId) : null;

  const [date, setDate] = useState(pathwaysDetails.date || deaActivity?.completed_date || '');
  const [notes, setNotes] = useState(pathwaysDetails.notes || deaActivity?.notes || '');
  const [anticipatedEnd, setAnticipatedEnd] = useState(pathwaysDetails.timeline_end || deaActivity?.anticipated_end_date || '');
  const [saving, setSaving] = useState(false);
  const isDone = !!date;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isDEA) {
        const updatedActivities = (client?.dea_activities || []).map(a =>
          a.id === deaActivityId ? { ...a, completed_date: date, notes, anticipated_end_date: anticipatedEnd } : a
        );
        await onSave({ dea_activities: updatedActivities });
      } else {
        const updatedDetails = {
          ...(client?.sdp_item_details || {}),
          [edaKey]: { ...pathwaysDetails, date, notes, timeline_end: anticipatedEnd },
        };
        await onSave({ sdp_item_details: updatedDetails });
      }
      toast.success('EDA updated');
      onComplete?.();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-slate-800">{edaLabel}</h3>
        <p className="text-sm text-slate-500 mt-1">Employment Development Activity</p>
      </div>

      {isDone && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">Completed — {date}</span>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label className="text-xs font-semibold">Anticipated Completion Date</Label>
            <Input type="date" value={anticipatedEnd} onChange={e => setAnticipatedEnd(e.target.value)} className="mt-1 max-w-[200px]" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Completion Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 max-w-[200px]" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1" />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save & Continue'} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}