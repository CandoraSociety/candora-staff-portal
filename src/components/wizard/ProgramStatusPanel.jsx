import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, X, Bell, CalendarCheck, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createCompassTask } from '@/lib/compassTasks';
import { toast } from 'sonner';
import { differenceInDays, addDays, format } from 'date-fns';

export default function ProgramStatusPanel({ client, onClientUpdate }) {
  const [showDateInput, setShowDateInput] = useState(false);
  const [startDate, setStartDate]         = useState(client?.service_start_date || new Date().toISOString().split('T')[0]);
  const [saving, setSaving]               = useState(false);

  const ps = client?.program_status;
  const followup90Date = client?.followup_90day_date;
  const completionDate = client?.completion_date;
  const hasFollowup    = !!client?.followup_90day_status;

  const daysUntilFollowup = followup90Date
    ? differenceInDays(new Date(followup90Date + 'T12:00:00'), new Date())
    : null;

  const followupUrgent  = daysUntilFollowup !== null && daysUntilFollowup >= 0 && daysUntilFollowup <= 5;
  const followupOverdue = daysUntilFollowup !== null && daysUntilFollowup < 0;

  const addProgressNote = async (client_obj, me, event_type, label, note) => {
    const notes = [...(client_obj?.roadmap_progress_notes || [])];
    notes.unshift({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      event_type,
      item_label: label,
      item_key: event_type,
      note: note || '',
      logged_by: me?.email || '',
      logged_by_name: me?.full_name || '',
      compass_entered: false,
    });
    return notes;
  };

  const handleStartProgram = async () => {
    setSaving(true);
    try {
      let me = null; try { me = await base44.auth.me(); } catch (_) {}
      const notes = await addProgressNote(client, me, 'started', 'Program Started', `Service start date: ${startDate}`);
      const updates = { service_start_date: startDate, program_status: 'in_progress', roadmap_progress_notes: notes };
      const updated = await base44.entities.Client.update(client.id, updates);
      const task = { title: `Program started: ${client.first_name} ${client.last_name}`, instructions: `Client program has been started. Service start date: ${startDate}. Update in Compass.`, client_name: `${client.first_name} ${client.last_name}`, compass_hsid: client.compass_hsid };
      await createCompassTask({ client_id: client.id, task_type: 'program_started', assigned_worker: client.assigned_worker, assigned_worker_name: client.assigned_worker_name, ...task });
      onClientUpdate?.(updated);
      setShowDateInput(false);
      toast.success('Program started');
    } finally { setSaving(false); }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      let me = null; try { me = await base44.auth.me(); } catch (_) {}
      const today = new Date().toISOString().split('T')[0];
      const f90 = format(addDays(new Date(today + 'T12:00:00'), 90), 'yyyy-MM-dd');
      const notes = await addProgressNote(client, me, 'completed', 'Program Completed', `Completion date: ${today}`);
      const updates = { program_status: 'complete', completion_date: today, followup_90day_date: f90, roadmap_progress_notes: notes };
      const updated = await base44.entities.Client.update(client.id, updates);
      const task = { title: `Program completed: ${client.first_name} ${client.last_name}`, instructions: `Client has completed the program. Completion date: ${today}. 90-day follow-up due: ${f90}. Update in Compass.`, client_name: `${client.first_name} ${client.last_name}`, compass_hsid: client.compass_hsid };
      await createCompassTask({ client_id: client.id, task_type: 'program_completed', assigned_worker: client.assigned_worker, assigned_worker_name: client.assigned_worker_name, ...task });
      onClientUpdate?.(updated);
      toast.success('Program marked as completed');
    } finally { setSaving(false); }
  };

  const handleCancel = async (incomplete = false) => {
    setSaving(true);
    try {
      let me = null; try { me = await base44.auth.me(); } catch (_) {}
      const today = new Date().toISOString().split('T')[0];
      const newPs = incomplete ? 'incomplete' : 'cancelled';
      const notes = await addProgressNote(client, me, 'cancelled', incomplete ? 'Program Incomplete' : 'Program Cancelled', '');
      const updates = { program_status: newPs, roadmap_progress_notes: notes };
      const updated = await base44.entities.Client.update(client.id, updates);
      const task = { title: `Program ${newPs}: ${client.first_name} ${client.last_name}`, instructions: `Client program has been marked as ${newPs}. Update in Compass.`, client_name: `${client.first_name} ${client.last_name}`, compass_hsid: client.compass_hsid };
      await createCompassTask({ client_id: client.id, task_type: 'program_cancelled', assigned_worker: client.assigned_worker, assigned_worker_name: client.assigned_worker_name, ...task });
      onClientUpdate?.(updated);
      toast.success(`Program marked as ${newPs}`);
    } finally { setSaving(false); }
  };

  const handle90Day = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const updated = await base44.entities.Client.update(client.id, { followup_90day_status: 'in_progress' });
      onClientUpdate?.(updated);
      toast.success('90-day follow-up recorded');
    } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Start / Update Start Date */}
      {(!ps || ps === 'in_progress') && (
        <>
          {showDateInput ? (
            <div className="flex items-center gap-2">
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 text-xs w-36" />
              <Button size="sm" className="h-8 text-xs" style={{ backgroundColor: '#eab308', color: '#fff' }} onClick={handleStartProgram} disabled={saving}>
                {!client?.service_start_date ? 'Start Program' : 'Update Start'}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowDateInput(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" className="h-8 text-xs" style={{ backgroundColor: '#eab308', color: '#fff' }} onClick={() => setShowDateInput(true)} disabled={saving}>
              <Play className="w-3 h-3 mr-1" />
              {!client?.service_start_date ? 'Mark Program Started' : 'Update Start Date'}
            </Button>
          )}
        </>
      )}

      {/* Complete */}
      {(!ps || ps === 'in_progress') && (
        <Button size="sm" variant="outline" className="h-8 text-xs border-green-500 text-green-700 hover:bg-green-50" onClick={handleComplete} disabled={saving}>
          <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Program Completed
        </Button>
      )}

      {/* Cancel / Incomplete */}
      {ps !== 'cancelled' && ps !== 'incomplete' && (
        <Button size="sm" variant="outline" className="h-8 text-xs border-red-400 text-red-600 hover:bg-red-50" onClick={() => handleCancel(false)} disabled={saving}>
          <X className="w-3 h-3 mr-1" /> {ps === 'complete' ? 'Mark Cancelled' : 'Mark Cancelled/Incomplete'}
        </Button>
      )}

      {/* 90-Day Follow-Up */}
      {ps === 'complete' && (
        <Button
          size="sm"
          className={`h-8 text-xs ${
            hasFollowup ? 'bg-green-100 text-green-700 border border-green-400' :
            followupOverdue ? 'bg-red-100 text-red-700 border border-red-400' :
            followupUrgent ? 'bg-amber-100 text-amber-800 border border-amber-400 animate-pulse' :
            'bg-blue-100 text-blue-700 border border-blue-400'
          }`}
          variant="outline"
          onClick={!hasFollowup ? handle90Day : undefined}
          disabled={saving || hasFollowup}
        >
          {followupUrgent || followupOverdue
            ? <Bell className={`w-3 h-3 mr-1 ${(followupUrgent || followupOverdue) ? 'animate-bounce' : ''}`} />
            : <CalendarCheck className="w-3 h-3 mr-1" />}
          {hasFollowup ? '✓ 90-Day Done' :
           followupOverdue ? `Overdue ${Math.abs(daysUntilFollowup)}d` :
           followupUrgent  ? `${daysUntilFollowup}d left` :
           '90-Day Follow-Up'}
        </Button>
      )}
    </div>
  );
}