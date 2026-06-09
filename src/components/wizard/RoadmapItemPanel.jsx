import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Unlock, AlertTriangle, Bell } from 'lucide-react';
import Celebration from '@/components/Celebration';

const STATUS_OPTS = [
  { key: 'planned',   label: 'Not Started', color: '#94a3b8' },
  { key: 'started',   label: 'In Progress', color: '#3b82f6' },
  { key: 'completed', label: 'Completed',   color: '#22c55e' },
  { key: 'cancelled', label: 'Cancelled',   color: '#ef4444' },
];

export default function RoadmapItemPanel({ item, currentStatus, onSave, onCancel, saving, projectedEndDate, serviceStartDate }) {
  const existing = item.statusData || {};

  const [status,        setStatus]        = useState(currentStatus || 'planned');
  const [startDate,     setStartDate]     = useState(existing.timeline_start || item.detail?.timeline_start || '');
  const [endDate,       setEndDate]       = useState(existing.timeline_end   || item.detail?.timeline_end   || '');
  const [notes,         setNotes]         = useState(existing.case_manager_notes || '');
  const [startedDate,   setStartedDate]   = useState(existing.started_date   || '');
  const [completedDate, setCompletedDate] = useState(existing.completed_date || new Date().toISOString().split('T')[0]);
  const [unlockRange,   setUnlockRange]   = useState(false);
  const [celebrate,     setCelebrate]     = useState(false);
  const [showCompassPrompt, setShowCompassPrompt] = useState(false);
  const [showLateDatePrompt, setShowLateDatePrompt] = useState(false);

  const minDate = serviceStartDate ? serviceStartDate.toISOString().split('T')[0] : undefined;
  const maxDate = (!unlockRange && projectedEndDate) ? projectedEndDate.toISOString().split('T')[0] : undefined;

  const handleSave = async () => {
    // Late date warning
    if (!unlockRange && projectedEndDate) {
      const end = endDate || completedDate;
      if (end && new Date(end + 'T12:00:00') > projectedEndDate) {
        if (!showLateDatePrompt) { setShowLateDatePrompt(true); return; }
      }
    }
    // Compass reminder
    if ((status === 'started' || status === 'completed') && !showCompassPrompt) {
      setShowCompassPrompt(true);
      return;
    }

    if (status === 'completed') setCelebrate(true);

    await onSave({ startDate, endDate, notes, status, startedDate, completedDate });
  };

  return (
    <Card className="border-2" style={{ borderColor: STATUS_OPTS.find(s => s.key === status)?.color || '#94a3b8' }}>
      {celebrate && <Celebration trigger={celebrate} onComplete={() => setCelebrate(false)} />}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{item.label}</CardTitle>
        {item.isBarrier && (
          <div className="mt-1 p-2 rounded bg-amber-50 border border-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-1 font-medium text-amber-800">
              <AlertTriangle className="w-3 h-3" /> Barrier Info (read-only)
            </div>
            {item.detail?.status && (
              <div>Status: <span className="font-medium">{item.detail.status}</span></div>
            )}
            {item.detail?.action_steps && (
              <div>Steps: {Array.isArray(item.detail.action_steps) ? item.detail.action_steps.join(', ') : item.detail.action_steps}</div>
            )}
            {item.detail?.notes && <div>Notes: {item.detail.notes}</div>}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Status buttons */}
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
                onClick={() => setStatus(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-semibold">Planned Start</Label>
            <Input type="date" value={startDate} min={!unlockRange ? minDate : undefined} max={!unlockRange ? maxDate : undefined}
              onChange={e => setStartDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Planned End</Label>
            <Input type="date" value={endDate} min={!unlockRange ? minDate : undefined} max={!unlockRange ? maxDate : undefined}
              onChange={e => setEndDate(e.target.value)} className="mt-1" />
          </div>
        </div>

        {/* Unlock range */}
        <button type="button" onClick={() => setUnlockRange(p => !p)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          {unlockRange ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {unlockRange ? 'Lock dates to program range' : 'Allow dates outside program range'}
        </button>

        {/* Actual start (in progress) */}
        {status === 'started' && (
          <div className="border-l-2 border-blue-400 pl-3">
            <Label className="text-xs font-semibold text-blue-700">Actual Start Date</Label>
            <Input type="date" value={startedDate} onChange={e => setStartedDate(e.target.value)} className="mt-1" />
          </div>
        )}

        {/* Completion date */}
        {status === 'completed' && (
          <div className="border-l-2 border-green-500 pl-3">
            <Label className="text-xs font-semibold text-green-700">Completion Date</Label>
            <Input type="date" value={completedDate} onChange={e => setCompletedDate(e.target.value)} className="mt-1" />
          </div>
        )}

        {/* Notes */}
        <div>
          <Label className="text-xs font-semibold">Case Manager Notes <span className="font-normal text-muted-foreground">(internal only)</span></Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1 text-xs" placeholder="Progress, challenges, outcomes..." />
        </div>

        {/* Late date warning */}
        {showLateDatePrompt && (
          <div className="bg-orange-50 border border-orange-300 rounded p-2 text-xs text-orange-800">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            The end date is outside the program range. Click Save again to confirm.
          </div>
        )}

        {/* Compass reminder */}
        {showCompassPrompt && (
          <div className="bg-amber-50 border border-amber-300 rounded p-2 text-xs text-amber-800 flex items-start gap-1">
            <Bell className="w-3 h-3 mt-0.5 shrink-0" />
            Remember to update this in Compass. Click Save again to confirm.
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}