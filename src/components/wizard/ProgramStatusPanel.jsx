import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, X, Bell, CalendarCheck, Play, RotateCcw, Ban } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createCompassTask } from '@/lib/compassTasks';
import { toast } from 'sonner';
import { differenceInDays, addDays, format } from 'date-fns';

export default function ProgramStatusPanel({ client, onClientUpdate }) {
  const [showDateInput, setShowDateInput] = useState(false);
  const [startDate, setStartDate] = useState(client?.service_start_date || new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const ps = client?.program_status;
  const followup90Date = client?.followup_90day_date;
  const hasFollowup = !!client?.followup_90day_status;

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
      await createCompassTask({ client_id: client.id, task_type: 'program_started', assigned_worker: client.assigned_worker, assigned_worker_name: client.assigned_worker_name, client_name: `${client.first_name} ${client.last_name}`, compass_hsid: client.compass_hsid, title: `Program started: ${client.first_name} ${client.last_name}`, instructions: `Client program has been started. Service start date: ${startDate}. Update in Compass.` });
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
      await createCompassTask({ client_id: client.id, task_type: 'program_completed', assigned_worker: client.assigned_worker, assigned_worker_name: client.assigned_worker_name, client_name: `${client.first_name} ${client.last_name}`, compass_hsid: client.compass_hsid, title: `Program completed: ${client.first_name} ${client.last_name}`, instructions: `Client has completed the program. Completion date: ${today}. 90-day follow-up due: ${f90}. Update in Compass.` });
      onClientUpdate?.(updated);
      toast.success('Program marked as completed');
    } finally { setSaving(false); }
  };

  const handleCancel = async (incomplete = false) => {
    setSaving(true);
    try {
      let me = null; try { me = await base44.auth.me(); } catch (_) {}
      const newPs = incomplete ? 'incomplete' : 'cancelled';
      const notes = await addProgressNote(client, me, 'cancelled', incomplete ? 'Program Incomplete' : 'Program Cancelled', '');
      const updates = { program_status: newPs, roadmap_progress_notes: notes };
      const updated = await base44.entities.Client.update(client.id, updates);
      await createCompassTask({ client_id: client.id, task_type: 'program_cancelled', assigned_worker: client.assigned_worker, assigned_worker_name: client.assigned_worker_name, client_name: `${client.first_name} ${client.last_name}`, compass_hsid: client.compass_hsid, title: `Program ${newPs}: ${client.first_name} ${client.last_name}`, instructions: `Client program has been marked as ${newPs}. Update in Compass.` });
      onClientUpdate?.(updated);
      toast.success(`Program marked as ${newPs}`);
    } finally { setSaving(false); }
  };

  // Undo complete/cancelled/incomplete — revert to in_progress
  const handleUndoStatus = async () => {
    setSaving(true);
    try {
      let me = null; try { me = await base44.auth.me(); } catch (_) {}
      const notes = await addProgressNote(client, me, 'reverted', 'Status Reverted', `Reverted from ${ps} to in_progress`);
      const updates = { program_status: 'in_progress', completion_date: null, roadmap_progress_notes: notes };
      const updated = await base44.entities.Client.update(client.id, updates);
      onClientUpdate?.(updated);
      toast.success('Program status reverted to In Progress');
    } finally { setSaving(false); }
  };

  // Completed status banner
  if (ps === 'complete') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-green-50 border border-green-300 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-green-800">Program Complete</p>
            {client?.completion_date && <p className="text-[10px] text-green-600">{client.completion_date}</p>}
          </div>
        </div>

        {/* 90-day status */}
        {!hasFollowup && (
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs ${
            followupOverdue ? 'bg-red-50 border-red-300 text-red-700' :
            followupUrgent  ? 'bg-amber-50 border-amber-300 text-amber-800' :
                               'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <Bell className={`w-3.5 h-3.5 shrink-0 ${(followupUrgent || followupOverdue) ? 'animate-bounce' : ''}`} />
            <span className="truncate">
              {followupOverdue ? `90-Day Overdue ${Math.abs(daysUntilFollowup)}d` :
               followupUrgent  ? `90-Day in ${daysUntilFollowup}d` :
               `90-Day: ${client?.followup_90day_date || 'TBD'}`}
            </span>
          </div>
        )}
        {hasFollowup && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-teal-50 border border-teal-300 rounded-lg">
            <CalendarCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="text-xs font-semibold text-teal-800 truncate">90-Day Done</span>
          </div>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="w-full h-7 text-xs text-slate-500 hover:text-slate-700"
          onClick={handleUndoStatus}
          disabled={saving}
        >
          <RotateCcw className="w-3 h-3 mr-1" /> Undo Completion
        </Button>
      </div>
    );
  }

  // Cancelled / Incomplete banner
  if (ps === 'cancelled' || ps === 'incomplete') {
    return (
      <div className="space-y-2">
        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${ps === 'cancelled' ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'}`}>
          <Ban className={`w-4 h-4 shrink-0 ${ps === 'cancelled' ? 'text-red-600' : 'text-amber-600'}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold ${ps === 'cancelled' ? 'text-red-800' : 'text-amber-800'}`}>
              {ps === 'cancelled' ? 'Cancelled' : 'Incomplete'}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="w-full h-7 text-xs text-slate-500 hover:text-slate-700"
          onClick={handleUndoStatus}
          disabled={saving}
        >
          <RotateCcw className="w-3 h-3 mr-1" /> Revert to In Progress
        </Button>
      </div>
    );
  }

  // Default: not started / in progress
  return (
    <div className="flex flex-col gap-1.5">
      {/* Start / Update Start Date */}
      {(!ps || ps === 'in_progress') && (
        <>
          {showDateInput ? (
            <div className="flex flex-col gap-1">
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-7 text-xs" />
              <div className="flex gap-1">
                <Button size="sm" className="flex-1 h-7 text-xs" style={{ backgroundColor: '#eab308', color: '#fff' }} onClick={handleStartProgram} disabled={saving}>
                  {!client?.service_start_date ? 'Start' : 'Update'}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowDateInput(false)}>✕</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" className="h-7 text-xs w-full" style={{ backgroundColor: '#eab308', color: '#fff' }} onClick={() => setShowDateInput(true)} disabled={saving}>
              <Play className="w-3 h-3 mr-1" />
              {!client?.service_start_date ? 'Start Program' : 'Update Start Date'}
            </Button>
          )}
        </>
      )}

      {/* Complete */}
      {(!ps || ps === 'in_progress') && (
        <Button size="sm" variant="outline" className="h-7 text-xs border-green-500 text-green-700 hover:bg-green-50 w-full" onClick={handleComplete} disabled={saving}>
          <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Complete
        </Button>
      )}

      {/* Cancel */}
      {ps !== 'cancelled' && ps !== 'incomplete' && ps !== 'complete' && (
        <Button size="sm" variant="outline" className="h-7 text-xs border-red-400 text-red-600 hover:bg-red-50 w-full" onClick={() => handleCancel(false)} disabled={saving}>
          <X className="w-3 h-3 mr-1" /> Mark Cancelled
        </Button>
      )}
    </div>
  );
}