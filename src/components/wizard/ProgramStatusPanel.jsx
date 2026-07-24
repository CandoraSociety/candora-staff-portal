import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, X, Bell, CalendarCheck, Play, RotateCcw, Ban, Briefcase } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createCompassTask, taskEdaProgramCompleted } from '@/lib/compassTasks';
import DEAProgramCompletionDialog from './DEAProgramCompletionDialog';
import { logStatusChange } from '@/lib/logStatusChange';
import { toast } from 'sonner';
import { differenceInDays, addDays, format } from 'date-fns';

export default function ProgramStatusPanel({ client, onClientUpdate }) {
  const [showDateInput, setShowDateInput] = useState(false);
  const [startDate, setStartDate] = useState(client?.service_start_date || new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [showDEACompletion, setShowDEACompletion] = useState(false);

  const ps = client?.program_status;
  const followup90Date = client?.followup_90day_date;
  const hasFollowup = !!client?.followup_90day_status;
  const isDEA = client?.service_type === 'direct_to_employment';
  const isWD = client?.service_type === 'pathways';
  const isEmployed = ['E-RF', 'E-UF', 'E-PT'].includes(client?.employment_status);

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
      await logStatusChange({
        client,
        change_type: 'program_status_change',
        from_value: ps || 'not_started',
        to_value: 'in_progress',
        notes: `Service start date: ${startDate}`,
      });
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
      const f90 = client?.followup_90day_date || format(addDays(new Date(today + 'T12:00:00'), 90), 'yyyy-MM-dd');
      const notes = await addProgressNote(client, me, 'completed', 'Program Completed', `Completion date: ${today}`);
      const updates = { program_status: 'complete', completion_date: today, followup_90day_date: f90, roadmap_progress_notes: notes };
      const updated = await base44.entities.Client.update(client.id, updates);
      const task = taskEdaProgramCompleted({ ...client, ...updates });
      await createCompassTask({
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        compass_hsid: client.compass_hsid || '',
        assigned_worker: client.assigned_worker,
        assigned_worker_name: client.assigned_worker_name,
        ...task,
      });
      await logStatusChange({
        client,
        change_type: 'program_status_change',
        from_value: ps,
        to_value: 'complete',
        notes: `Completion date: ${today}. 90-day follow-up due: ${f90}.`,
        billing_relevant: true,
      });
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
      await logStatusChange({
        client,
        change_type: 'program_status_change',
        from_value: ps,
        to_value: newPs,
      });
      onClientUpdate?.(updated);
      toast.success(`Program marked as ${newPs}`);
    } finally { setSaving(false); }
  };

  // DEA: Switch to WD pathway
  const handleSwitchToWD = async () => {
    setSaving(true);
    try {
      let me = null; try { me = await base44.auth.me(); } catch (_) {}
      const switchRecord = {
        from_stream: 'direct_to_employment',
        to_stream: 'pathways',
        reason: 'user_requested',
        date: new Date().toISOString().split('T')[0],
        notes: 'Switched from DEA to WD via completion dialog',
      };
      const notes = await addProgressNote(client, me, 'stream_switch', 'Switched to WD', 'Switched from DEA to WD');
      const updates = {
        service_type: 'pathways',
        dea_closing_dismissed: true,
        program_stream_switches: [...(client.program_stream_switches || []), switchRecord],
        roadmap_progress_notes: notes,
      };
      const updated = await base44.entities.Client.update(client.id, updates);
      await logStatusChange({
        client,
        change_type: 'stream_switch',
        from_value: 'direct_to_employment',
        to_value: 'pathways',
        notes: 'Switched from DEA to WD',
        billing_relevant: false,
      });
      await createCompassTask({
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        compass_hsid: client.compass_hsid || '',
        assigned_worker: client.assigned_worker || '',
        assigned_worker_name: client.assigned_worker_name || '',
        task_type: 'stream_switch',
        title: `Stream Switch — ${client.first_name} ${client.last_name}`,
        instructions: 'Client switched from DEA to WD pathway via completion dialog',
        status: 'pending',
      });
      onClientUpdate?.(updated);
      setShowDEACompletion(false);
      toast.success('Switched to WD pathway');
    } catch (err) {
      toast.error('Failed to switch');
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
      await logStatusChange({
        client,
        change_type: 'program_status_change',
        from_value: ps,
        to_value: 'in_progress',
        notes: `Reverted from ${ps}`,
      });
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
  const wdPhase = isWD && (!ps || ps === 'in_progress')
    ? isEmployed ? '90-Day Follow-Up Phase' : 'Job Search Phase'
    : null;
  const wdWeeksElapsed = isWD && client?.service_start_date
    ? Math.floor(differenceInDays(new Date(), new Date(client.service_start_date + 'T12:00:00')) / 7)
    : 0;

  return (
    <div className="flex flex-col gap-1.5">
      {wdPhase && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 border border-indigo-200 rounded text-[10px] font-semibold text-indigo-700">
          <Briefcase className="w-3 h-3 shrink-0" />
          {wdPhase}
        </div>
      )}
      {isWD && wdWeeksElapsed >= 48 && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-300 rounded text-[10px] font-semibold text-red-700">
          <Bell className="w-3 h-3 shrink-0 animate-bounce" />
          {wdWeeksElapsed}/52 weeks — max duration approaching
        </div>
      )}

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

      {/* Complete — DEA: Completion Decision; WD: requires 90-day follow-up first */}
      {(!ps || ps === 'in_progress') && (
        isDEA ? (
          <Button size="sm" variant="outline" className="h-7 text-xs border-blue-500 text-blue-700 hover:bg-blue-50 w-full" onClick={() => setShowDEACompletion(true)} disabled={saving}>
            <CheckCircle2 className="w-3 h-3 mr-1" /> Completion Decision
          </Button>
        ) : isWD ? (
          hasFollowup ? (
            <Button size="sm" variant="outline" className="h-7 text-xs border-green-500 text-green-700 hover:bg-green-50 w-full" onClick={handleComplete} disabled={saving}>
              <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Complete
            </Button>
          ) : (
            <div className="text-[10px] text-slate-400 text-center px-1 py-1">
              {isEmployed ? '90-Day Follow-Up in progress' : '90-Day Follow-Up required to complete'}
            </div>
          )
        ) : (
          <Button size="sm" variant="outline" className="h-7 text-xs border-green-500 text-green-700 hover:bg-green-50 w-full" onClick={handleComplete} disabled={saving}>
            <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Complete
          </Button>
        )
      )}

      {/* Cancel */}
      {ps !== 'cancelled' && ps !== 'incomplete' && ps !== 'complete' && (
        <Button size="sm" variant="outline" className="h-7 text-xs border-red-400 text-red-600 hover:bg-red-50 w-full" onClick={() => handleCancel(false)} disabled={saving}>
          <X className="w-3 h-3 mr-1" /> Mark Cancelled
        </Button>
      )}

      {/* DEA Completion Dialog */}
      <DEAProgramCompletionDialog
        open={showDEACompletion}
        onOpenChange={setShowDEACompletion}
        onComplete={async () => { setShowDEACompletion(false); await handleComplete(); }}
        onSwitchToWD={handleSwitchToWD}
        onTerminate={async () => { setShowDEACompletion(false); await handleCancel(false); }}
      />
    </div>
  );
}