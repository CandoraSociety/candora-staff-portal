import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Generic EDA (Employment Development Activity) tracker step.
 * Renders for action plan items that don't have a specialized step component.
 *
 * Reads/writes the SAME fields as the Action Plan Roadmap (timeline/list/calendar)
 * so the sidebar item and the roadmap stay synced:
 *   - status / started_date / completed_date / case_manager_notes  → roadmap_item_status[edaKey]
 *   - anticipated completion                                       → sdp_item_details[edaKey].timeline_end
 * For DEA clients it also mirrors completion/notes into dea_activities.
 */
const STATUS_OPTS = [
  { key: 'planned',   label: 'Not Started', color: '#94a3b8' },
  { key: 'started',   label: 'In Progress', color: '#3b82f6' },
  { key: 'completed', label: 'Completed',   color: '#22c55e' },
  { key: 'cancelled', label: 'Cancelled',   color: '#ef4444' },
];

export default function EDAStep({ client, edaKey, edaLabel, onSave, onComplete }) {
  const isDEA = edaKey.startsWith('dea_');
  const deaActivityId = isDEA ? edaKey.replace('dea_', '') : null;

  const roadmapStatus = client?.roadmap_item_status || {};
  const existingStatus = roadmapStatus[edaKey] || {};
  const pathwaysDetails = !isDEA ? (client?.sdp_item_details?.[edaKey] || {}) : {};
  const deaActivity = isDEA ? (client?.dea_activities || []).find(a => a.id === deaActivityId) : null;

  const initCompletion = isDEA
    ? (deaActivity?.completed_date || existingStatus.completed_date || '')
    : (existingStatus.completed_date || pathwaysDetails.date || '');
  const initAnticipated = isDEA
    ? (deaActivity?.anticipated_end_date || existingStatus.timeline_end || '')
    : (pathwaysDetails.timeline_end || '');
  const initNotes = isDEA
    ? (deaActivity?.notes || existingStatus.case_manager_notes || '')
    : (existingStatus.case_manager_notes || pathwaysDetails.notes || '');
  const initStatus = existingStatus.status || (initCompletion ? 'completed' : 'planned');

  const [status, setStatus] = useState(initStatus);
  const [anticipatedEnd, setAnticipatedEnd] = useState(initAnticipated);
  const [completionDate, setCompletionDate] = useState(initCompletion);
  const [startedDate, setStartedDate] = useState(existingStatus.started_date || '');
  const [notes, setNotes] = useState(initNotes);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalStatus = completionDate ? 'completed' : status;
      const updatedRoadmap = {
        ...roadmapStatus,
        [edaKey]: {
          ...existingStatus,
          status: finalStatus,
          started_date: startedDate,
          completed_date: completionDate,
          case_manager_notes: notes,
        },
      };

      if (isDEA) {
        const updatedActivities = (client?.dea_activities || []).map(a =>
          a.id === deaActivityId
            ? { ...a, completed_date: completionDate, notes, anticipated_end_date: anticipatedEnd }
            : a
        );
        await onSave({ dea_activities: updatedActivities, roadmap_item_status: updatedRoadmap });
      } else {
        const updatedDetails = {
          ...(client?.sdp_item_details || {}),
          [edaKey]: { ...pathwaysDetails, timeline_end: anticipatedEnd },
        };
        await onSave({ sdp_item_details: updatedDetails, roadmap_item_status: updatedRoadmap });
      }
      toast.success('Action plan item updated');
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

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Status buttons — same options as the roadmap panel */}
          <div>
            <Label className="text-xs font-semibold">Status</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {STATUS_OPTS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  className="px-3 py-1 rounded-full text-xs font-medium border-2 transition-colors"
                  style={{
                    borderColor: opt.color,
                    backgroundColor: status === opt.key ? opt.color : 'transparent',
                    color: status === opt.key ? '#fff' : opt.color,
                  }}
                  onClick={() => {
                    setStatus(opt.key);
                    if (opt.key !== 'completed') setCompletionDate('');
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Anticipated Completion Date</Label>
            <Input type="date" value={anticipatedEnd} onChange={e => setAnticipatedEnd(e.target.value)} className="mt-1 max-w-[200px]" />
          </div>

          {status === 'started' && (
            <div className="border-l-2 border-blue-400 pl-3">
              <Label className="text-xs font-semibold text-blue-700">Actual Start Date</Label>
              <Input type="date" value={startedDate} onChange={e => setStartedDate(e.target.value)} className="mt-1 max-w-[200px]" />
            </div>
          )}

          {status === 'completed' && (
            <div className="border-l-2 border-green-500 pl-3">
              <Label className="text-xs font-semibold text-green-700">Completion Date</Label>
              <Input type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)} className="mt-1 max-w-[200px]" />
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold">Notes <span className="font-normal text-muted-foreground">(internal only)</span></Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1" placeholder="Progress, challenges, outcomes..." />
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