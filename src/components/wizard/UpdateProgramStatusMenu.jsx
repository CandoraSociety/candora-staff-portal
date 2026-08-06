import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, ChevronDown, ListChecks, Briefcase, ClipboardCheck, Ban, RotateCcw } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { classifyClient } from '@/lib/clientClassification';
import { logStatusChange } from '@/lib/logStatusChange';
import { toast } from 'sonner';
import { FOLLOWUP_90DAY_OPTIONS as OUTCOME_OPTIONS, PLACEMENT_OUTCOME_OPTIONS } from '@/lib/crtCodes';
import { getIncompleteRoadmapItems } from '@/lib/roadmapItems';

// Count barriers that are successfully resolved (barrier exists + status === 'resolved')
function countResolvedBarriers(client) {
  let count = 0;
  for (const i of [1, 2, 3]) {
    if (client[`barrier_${i}`] && client[`barrier_${i}_status`] === 'resolved') count++;
  }
  return count;
}

// Determine the most recent forward step that can be undone, one step at a time.
// Each step clears the client-file fields that step introduced, plus its progress note.
function getUndoStep(client) {
  if (!client) return null;
  const isDEA = client.service_type === 'direct_to_employment';
  const isWD = client.service_type === 'pathways';
  if (!isDEA && !isWD) return null;
  const ps = client.program_status;
  const hasFollowupStatus = !!client.followup_90day_status;
  const foundEmployment = !!client.post_completion_employment_date;
  const hasEdaCompletion = !!client.eda_completion_date || !!client.completion_date;
  const hasServiceStart = !!client.service_start_date;

  if (ps === 'complete') {
    return {
      key: 'undo_complete',
      label: 'Undo Mark Complete',
      description:
        'Reverts from Completed back to the Follow-up Period. Clears the program completion date (restores the EDA completion date); keeps the 90-day follow-up outcome.',
      updates: { program_status: 'in_progress', completion_date: client.eda_completion_date || null },
      removeNoteType: 'completed',
      noteLabel: 'Undo Mark Complete',
      noteText: 'Reverted program completion back to the Follow-up Period.',
    };
  }
  if (hasFollowupStatus) {
    return {
      key: 'undo_followup_outcome',
      label: 'Undo 90-Day Follow-up Outcome',
      description:
        'Clears the recorded 90-day follow-up outcome and returns to the Follow-up Period (pending).',
      updates: { followup_90day_status: null },
      removeNoteType: 'followup_outcome',
      noteLabel: 'Undo 90-Day Follow-up Outcome',
      noteText: 'Cleared the 90-day follow-up outcome.',
    };
  }
  if (isWD && foundEmployment) {
    return {
      key: 'undo_employment',
      label: 'Undo Found Employment',
      description:
        'Reverts from the Follow-up Period back to the Work Search Phase. Clears the employment date, type, employer details, and the 90-day follow-up date.',
      updates: {
        employment_start_date: null,
        post_completion_employment_status: null,
        post_completion_employment_date: null,
        followup_90day_date: null,
        job_start_date: null,
        employment_status: null,
        employer_name: null,
        job_title: null,
        job_hours: null,
        job_wage: null,
        employed_ftpt: null,
      },
      removeNoteType: 'employment_found',
      noteLabel: 'Undo Found Employment',
      noteText: 'Reverted Found Employment back to the Work Search Phase.',
    };
  }
  if (hasEdaCompletion) {
    return {
      key: 'undo_edas',
      label: 'Undo Mark EDAs Complete',
      description: isWD
        ? 'Reverts from the Work Search Phase back to Active (EDA). Clears the EDA completion date and 90-day follow-up date.'
        : 'Reverts from the Follow-up Period back to Active (EDA). Clears the EDA completion date and 90-day follow-up date.',
      updates: {
        completion_date: null,
        eda_completion_date: null,
        followup_90day_date: null,
      },
      removeNoteType: 'eda_completed',
      noteLabel: 'Undo Mark EDAs Complete',
      noteText: 'Reverted EDAs complete back to Active (EDA).',
    };
  }
  if (hasServiceStart) {
    return {
      key: 'undo_start',
      label: 'Undo Start Program',
      description: 'Reverts from Active (EDA) back to Not Started. Clears the service start date.',
      updates: { service_start_date: null, program_status: null },
      removeNoteType: 'started',
      noteLabel: 'Undo Start Program',
      noteText: 'Reverted program start back to Not Started.',
    };
  }
  return null;
}

export default function UpdateProgramStatusMenu({ client, onClientUpdate }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEmploymentConfirm, setShowEmploymentConfirm] = useState(false);
  const [showOutcomeConfirm, setShowOutcomeConfirm] = useState(false);
  const [outcomeStatus, setOutcomeStatus] = useState('E-RF');
  const [employedFtPt, setEmployedFtPt] = useState('');
  const [outcomeEmployerName, setOutcomeEmployerName] = useState('');
  const [outcomeJobTitle, setOutcomeJobTitle] = useState('');
  const [outcomeJobWage, setOutcomeJobWage] = useState('');
  const [outcomeJobHours, setOutcomeJobHours] = useState('');
  const [outcomeEmploymentDate, setOutcomeEmploymentDate] = useState('');
  const [showIncompletePrompt, setShowIncompletePrompt] = useState(false);
  const [incompleteItems, setIncompleteItems] = useState([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [completionDate, setCompletionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [employmentDate, setEmploymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [employmentStatus, setEmploymentStatus] = useState('E-RF');
  const [employerName, setEmployerName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobHours, setJobHours] = useState('');
  const [jobWage, setJobWage] = useState('');
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [revertPin, setRevertPin] = useState('');
  const [saving, setSaving] = useState(false);

  const isDEA = client?.service_type === 'direct_to_employment';
  const isWD = client?.service_type === 'pathways';
  const section = classifyClient(client);
  const inActiveEda = section === 'program_started' && (isDEA || isWD) && !!client?.service_start_date;
  const inWorkSearch = isWD && section === 'work_search' && !client?.employment_start_date;
  const inFollowup = (isDEA || isWD) && section === 'followup_period' && !client?.followup_90day_status;

  // 90-day outcome entry unlocks 2 days before the projected follow-up date
  const followupUnlockDate = (() => {
    if (!client?.followup_90day_date) return null;
    const d = new Date(client.followup_90day_date + 'T00:00:00');
    d.setDate(d.getDate() - 2);
    return d;
  })();
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const canEnterOutcome = !!followupUnlockDate && todayMidnight >= followupUnlockDate;

  const nextSectionLabel = isWD ? 'Work Search Phase' : isDEA ? 'Follow-up Period' : 'next section';

  // Mark Cancelled is available whenever the program is not already complete/cancelled/incomplete
  const canCancel = !['complete', 'cancelled', 'incomplete'].includes(client?.program_status);

  const addProgressNote = async (me, note) => {
    const notes = [...(client?.roadmap_progress_notes || [])];
    notes.unshift({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      event_type: 'eda_completed',
      item_label: 'EDAs Marked Complete',
      item_key: 'eda_completed',
      note,
      logged_by: me?.email || '',
      logged_by_name: me?.full_name || '',
      compass_entered: false,
    });
    return notes;
  };

  // Before opening the "Mark EDAs as Complete" confirmation, check whether any
  // timeline items are still incomplete. If so, prompt the user to complete them
  // first instead of opening the confirmation dialog.
  const handleAttemptMarkEdasComplete = async () => {
    try {
      const [internalTrainings, workExposures] = await Promise.all([
        base44.entities.InternalTraining.filter({ client_id: client.id }),
        base44.entities.WorkExposurePlacement.filter({ client_id: client.id }),
      ]);
      // Barriers are intentionally excluded — they can be resolved after EDAs are
      // marked complete, but must be resolved before the 90-day follow-up outcome.
      const incomplete = getIncompleteRoadmapItems(client, internalTrainings, workExposures)
        .filter(item => !item.key.startsWith('barrier_'));
      if (incomplete.length > 0) {
        setIncompleteItems(incomplete);
        setShowIncompletePrompt(true);
        return;
      }
    } catch (_) {
      // If the check fails, allow proceeding rather than blocking the workflow
    }
    setShowConfirm(true);
  };

  const handleMarkEdasComplete = async () => {
    if (!completionDate) {
      toast.error('Please enter a completion date');
      return;
    }
    setSaving(true);
    try {
      let me = null;
      try { me = await base44.auth.me(); } catch (_) {}

      const updates = {
        completion_date: completionDate,
        eda_completion_date: completionDate,
        service_navigation_supports: countResolvedBarriers(client) >= 2,
        roadmap_progress_notes: await addProgressNote(
          me,
          `EDAs marked complete on ${completionDate}.`
        ),
      };

      // DEA: trigger the 90-day follow-up date (exactly 90 days after EDA completion)
      if (isDEA) {
        updates.followup_90day_date = format(
          addDays(new Date(completionDate + 'T12:00:00'), 90),
          'yyyy-MM-dd'
        );
      }

      const updated = await base44.entities.Client.update(client.id, updates);

      await logStatusChange({
        client,
        change_type: 'program_status_change',
        from_value: 'active_eda',
        to_value: isWD ? 'work_search' : 'followup_period',
        notes: `EDAs marked complete on ${completionDate}${
          isDEA ? `. 90-day follow-up due ${updates.followup_90day_date}.` : '.'
        }`,
      });

      onClientUpdate?.(updated);
      setShowConfirm(false);
      toast.success(
        isDEA
          ? `EDAs marked complete — moved to ${nextSectionLabel}. 90-day follow-up set.`
          : `EDAs marked complete — moved to ${nextSectionLabel}.`
      );
    } catch (e) {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleFoundEmployment = async () => {
    if (!employmentDate) {
      toast.error('Please enter an employment date');
      return;
    }
    if (!employmentStatus) {
      toast.error('Please select an employment type');
      return;
    }
    if (!employedFtPt) {
      toast.error('Please select Full-Time or Part-Time');
      return;
    }
    setSaving(true);
    try {
      let me = null;
      try { me = await base44.auth.me(); } catch (_) {}

      const followupDate = format(
        addDays(new Date(employmentDate + 'T12:00:00'), 90),
        'yyyy-MM-dd'
      );

      const notes = [...(client?.roadmap_progress_notes || [])];
      notes.unshift({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        event_type: 'employment_found',
        item_label: `Found Employment — ${employmentStatus}`,
        item_key: 'employment_found',
        note: `Employment found on ${employmentDate} (${employmentStatus}). 90-day follow-up due ${followupDate}.`,
        logged_by: me?.email || '',
        logged_by_name: me?.full_name || '',
        compass_entered: false,
      });

      const updates = {
        employment_start_date: employmentDate,
        post_completion_employment_status: employmentStatus,
        post_completion_employment_date: employmentDate,
        followup_90day_date: followupDate,
        job_start_date: employmentDate,
        employed_ftpt: employedFtPt || null,
        service_navigation_supports: countResolvedBarriers(client) >= 2,
        roadmap_progress_notes: notes,
      };
      // Autofill the Current Employment Status card (enum only allows these employed codes)
      if (['E-RF', 'E-UF', 'E-PT'].includes(employmentStatus)) {
        updates.employment_status = employmentStatus;
      }
      if (employerName) updates.employer_name = employerName;
      if (jobTitle) updates.job_title = jobTitle;
      if (jobHours) updates.job_hours = jobHours;
      if (jobWage !== '') updates.job_wage = Number(jobWage);

      const updated = await base44.entities.Client.update(client.id, updates);

      await logStatusChange({
        client,
        change_type: 'program_status_change',
        from_value: 'work_search',
        to_value: 'followup_period',
        notes: `Employment found on ${employmentDate} (${employmentStatus}). 90-day follow-up due ${followupDate}.`,
      });

      onClientUpdate?.(updated);
      setShowEmploymentConfirm(false);
      setEmployerName(''); setJobTitle(''); setJobHours(''); setJobWage(''); setEmployedFtPt('');
      toast.success('Employment recorded — moved to Follow-up Period. 90-day follow-up date set.');
    } catch (e) {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleEnterOutcome = async () => {
    if (!outcomeStatus) {
      toast.error('Please select an outcome status');
      return;
    }
    setSaving(true);
    try {
      let me = null;
      try { me = await base44.auth.me(); } catch (_) {}

      const option = OUTCOME_OPTIONS.find((o) => o.value === outcomeStatus);
      const notes = [...(client?.roadmap_progress_notes || [])];
      notes.unshift({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        event_type: 'followup_outcome',
        item_label: '90-Day Follow-up Outcome',
        item_key: 'followup_outcome',
        note: `90-day follow-up outcome recorded: ${outcomeStatus} (${option?.desc || ''}).`,
        logged_by: me?.email || '',
        logged_by_name: me?.full_name || '',
        compass_entered: false,
      });

      const today = new Date().toISOString().split('T')[0];
      const updates = {
        followup_90day_status: outcomeStatus,
        employed_ftpt: employedFtPt || null,
        program_status: 'complete',
        completion_date: today,
        roadmap_progress_notes: notes,
      };
      // Employment details from the outcome dialog — autopopulate the client profile
      if (outcomeEmployerName) updates.employer_name = outcomeEmployerName;
      if (outcomeJobTitle) updates.job_title = outcomeJobTitle;
      if (outcomeJobHours) updates.job_hours = outcomeJobHours;
      if (outcomeEmploymentDate) {
        updates.employment_start_date = outcomeEmploymentDate;
        updates.job_start_date = outcomeEmploymentDate;
      }
      if (outcomeJobWage !== '') updates.job_wage = Number(outcomeJobWage);

      const updated = await base44.entities.Client.update(client.id, updates);

      await logStatusChange({
        client,
        change_type: 'program_status_change',
        from_value: 'followup_period',
        to_value: 'completed',
        notes: `90-day follow-up outcome: ${outcomeStatus}.`,
      });

      onClientUpdate?.(updated);
      setShowOutcomeConfirm(false);
      setEmployedFtPt('');
      setOutcomeEmployerName(''); setOutcomeJobTitle(''); setOutcomeJobWage(''); setOutcomeJobHours(''); setOutcomeEmploymentDate('');
      toast.success('Outcome recorded — moved to Completed.');
    } catch (e) {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setSaving(true);
    try {
      let me = null;
      try { me = await base44.auth.me(); } catch (_) {}
      const notes = [...(client?.roadmap_progress_notes || [])];
      notes.unshift({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        event_type: 'cancelled',
        item_label: 'Program Cancelled',
        item_key: 'cancelled',
        note: '',
        logged_by: me?.email || '',
        logged_by_name: me?.full_name || '',
        compass_entered: false,
      });
      const updated = await base44.entities.Client.update(client.id, {
        program_status: 'cancelled',
        roadmap_progress_notes: notes,
      });
      await logStatusChange({
        client,
        change_type: 'program_status_change',
        from_value: client?.program_status || 'not_started',
        to_value: 'cancelled',
      });
      onClientUpdate?.(updated);
      setShowCancelConfirm(false);
      toast.success('Program marked as cancelled');
    } catch (e) {
      toast.error('Failed to cancel program');
    } finally {
      setSaving(false);
    }
  };

  const revertStep = getUndoStep(client);

  const handleRevert = async () => {
    if (revertPin !== '5011') {
      toast.error('Incorrect pin');
      return;
    }
    if (!revertStep) return;
    setSaving(true);
    try {
      let me = null;
      try { me = await base44.auth.me(); } catch (_) {}

      // Remove the original progress note for the undone action
      const notes = [...(client?.roadmap_progress_notes || [])];
      if (revertStep.removeNoteType) {
        const idx = notes.findIndex((n) => n.event_type === revertStep.removeNoteType);
        if (idx >= 0) notes.splice(idx, 1);
      }
      // Add an audit note documenting the revert — marked compass_entered so it
      // stays in the audit trail but doesn't create a Compass to-do item (undos
      // are in-the-moment corrections, not Compass data-entry tasks)
      notes.unshift({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        event_type: 'reverted',
        item_label: revertStep.noteLabel,
        item_key: 'reverted',
        note: revertStep.noteText,
        logged_by: me?.email || '',
        logged_by_name: me?.full_name || '',
        compass_entered: true,
      });

      const updated = await base44.entities.Client.update(client.id, {
        ...revertStep.updates,
        roadmap_progress_notes: notes,
      });

      await logStatusChange({
        client,
        change_type: 'program_status_change',
        from_value: classifyClient(client),
        to_value: revertStep.key,
        notes: revertStep.noteText,
      });

      onClientUpdate?.(updated);
      setShowRevertConfirm(false);
      setRevertPin('');
      toast.success(`${revertStep.noteLabel} — the CRT will update on the next sync.`);
    } catch (e) {
      toast.error('Failed to revert status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <ListChecks className="w-3.5 h-3.5 mr-1" />
            Update Program/Activities Status
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Status Actions
          </DropdownMenuLabel>
          {inActiveEda && (
            <DropdownMenuItem
              onSelect={handleAttemptMarkEdasComplete}
              className="text-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
              Mark EDAs as Complete
            </DropdownMenuItem>
          )}
          {inWorkSearch && (
            <DropdownMenuItem
              onSelect={() => { setEmployedFtPt(client?.employed_ftpt || ''); setShowEmploymentConfirm(true); }}
              className="text-sm cursor-pointer"
            >
              <Briefcase className="w-4 h-4 mr-2 text-green-600" />
              Found Employment
            </DropdownMenuItem>
          )}
          {inFollowup && (
            <DropdownMenuItem
              disabled={!canEnterOutcome}
              onSelect={() => {
                setEmployedFtPt(client?.employed_ftpt || '');
                setOutcomeEmployerName(client?.employer_name || '');
                setOutcomeJobTitle(client?.job_title || '');
                setOutcomeJobWage(client?.job_wage != null ? String(client.job_wage) : '');
                setOutcomeJobHours(client?.job_hours || '');
                setOutcomeEmploymentDate(client?.employment_start_date || client?.job_start_date || '');
                setShowOutcomeConfirm(true);
              }}
              className="text-sm cursor-pointer"
            >
              <ClipboardCheck className={`w-4 h-4 mr-2 ${canEnterOutcome ? 'text-blue-600' : 'text-slate-300'}`} />
              Enter 90-Day Follow-up Outcome
              {!canEnterOutcome && (
                <span className="ml-auto text-[10px] text-slate-400">
                  {followupUnlockDate
                    ? `Available ${followupUnlockDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : 'Date not set'}
                </span>
              )}
            </DropdownMenuItem>
          )}
          {canCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setShowCancelConfirm(true)}
                className="text-sm cursor-pointer text-red-600 focus:text-red-700"
              >
                <Ban className="w-4 h-4 mr-2 text-red-600" />
                Mark Cancelled
              </DropdownMenuItem>
            </>
          )}
          {!inActiveEda && !inWorkSearch && !inFollowup && !canCancel && (
            <div className="px-2 py-3 text-xs text-slate-400">
              {isDEA || isWD
                ? 'No status updates available at this stage.'
                : 'Select a program pathway first.'}
            </div>
          )}
          {revertStep && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => { setRevertPin(''); setShowRevertConfirm(true); }}
                className="text-sm cursor-pointer text-amber-700 focus:text-amber-800"
              >
                <RotateCcw className="w-4 h-4 mr-2 text-amber-600" />
                {revertStep.label}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-[10px] text-slate-400">
            Current section:{' '}
            <span className="font-medium text-slate-600">
              {isDEA || isWD
                ? section.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                : '—'}
            </span>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark EDAs as Complete</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  This will mark all Employment Development Activities (EDAs) as complete for{' '}
                  <span className="font-semibold text-slate-800">
                    {client?.first_name} {client?.last_name}
                  </span>
                  .
                </p>
                <p>
                  The client will move from <span className="font-medium">Active (EDA)</span> into the{' '}
                  <span className="font-medium">{nextSectionLabel}</span>
                  {isDEA && ' and the 90-day follow-up date will be set to exactly 90 days after the EDA completion date'}.
                </p>
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    EDA Completion Date
                  </label>
                  <Input
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleMarkEdasComplete();
              }}
              disabled={saving || !completionDate}
            >
              {saving ? 'Saving...' : 'Confirm & Mark Complete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Found Employment confirmation dialog */}
      <AlertDialog open={showEmploymentConfirm} onOpenChange={setShowEmploymentConfirm}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Found Employment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will record employment for{' '}
                  <span className="font-semibold text-slate-800">
                    {client?.first_name} {client?.last_name}
                  </span>{' '}
                  and move them from <span className="font-medium">Work Search</span> into the{' '}
                  <span className="font-medium">Follow-up Period</span>. The 90-day follow-up date
                  will be set to exactly 90 days after the employment date.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Employment Date
                  </label>
                  <Input
                    type="date"
                    value={employmentDate}
                    onChange={(e) => setEmploymentDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Employment Type
                  </label>
                  <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                    {PLACEMENT_OUTCOME_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-2 rounded-md border px-3 py-1.5 cursor-pointer transition-colors ${
                          employmentStatus === opt.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="employment-status"
                          checked={employmentStatus === opt.value}
                          onChange={() => setEmploymentStatus(opt.value)}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{opt.value}</div>
                          <div className="text-xs text-slate-500">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Employer Name
                    </label>
                    <Input
                      value={employerName}
                      onChange={(e) => setEmployerName(e.target.value)}
                      className="text-sm"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Job Title
                    </label>
                    <Input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="text-sm"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Hours (e.g. 40 hrs/week)
                    </label>
                    <Input
                      value={jobHours}
                      onChange={(e) => setJobHours(e.target.value)}
                      className="text-sm"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Wage ($/hr)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={jobWage}
                      onChange={(e) => setJobWage(e.target.value)}
                      className="text-sm"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Employed FT / PT <span className="text-red-500">*</span> <span className="font-normal text-slate-400">(for CRT column W)</span>
                  </label>
                  <div className="flex gap-2">
                    {['FT', 'PT'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setEmployedFtPt(employedFtPt === opt ? '' : opt)}
                        className={`px-4 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                          employedFtPt === opt
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt === 'FT' ? 'FT — Full-Time' : 'PT — Part-Time'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Employer details will autofill the Employment section of the client file.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleFoundEmployment();
              }}
              disabled={saving || !employmentDate || !employmentStatus}
            >
              {saving ? 'Saving...' : 'Confirm & Record Employment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 90-Day Follow-up Outcome dialog */}
      <AlertDialog open={showOutcomeConfirm} onOpenChange={setShowOutcomeConfirm}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Enter 90-Day Follow-up Outcome</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Record the 90-day follow-up outcome for{' '}
                  <span className="font-semibold text-slate-800">
                    {client?.first_name} {client?.last_name}
                  </span>
                  . The client will move into the <span className="font-medium">Completed</span> section.
                </p>
                <div className="pt-1 grid grid-cols-1 gap-1.5 max-h-[45vh] overflow-y-auto pr-1">
                  {OUTCOME_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                        outcomeStatus === opt.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="outcome-status"
                        checked={outcomeStatus === opt.value}
                        onChange={() => setOutcomeStatus(opt.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{opt.value}</div>
                        <div className="text-xs text-slate-500">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Employed FT / PT <span className="font-normal text-slate-400">(for CRT column W)</span>
                  </label>
                  <div className="flex gap-2">
                    {['FT', 'PT'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setEmployedFtPt(employedFtPt === opt ? '' : opt)}
                        className={`px-4 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                          employedFtPt === opt
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt === 'FT' ? 'FT — Full-Time' : 'PT — Part-Time'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Employment Details <span className="font-normal text-slate-400">(updates the client profile)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Employer</label>
                      <Input
                        type="text"
                        placeholder="Employer name"
                        value={outcomeEmployerName}
                        onChange={(e) => setOutcomeEmployerName(e.target.value)}
                        className="text-sm h-8"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Position</label>
                      <Input
                        type="text"
                        placeholder="Job title"
                        value={outcomeJobTitle}
                        onChange={(e) => setOutcomeJobTitle(e.target.value)}
                        className="text-sm h-8"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Employment Start Date</label>
                      <Input
                        type="date"
                        value={outcomeEmploymentDate}
                        onChange={(e) => setOutcomeEmploymentDate(e.target.value)}
                        className="text-sm h-8"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Hours / Week</label>
                      <Input
                        type="text"
                        placeholder="e.g. 35-40"
                        value={outcomeJobHours}
                        onChange={(e) => setOutcomeJobHours(e.target.value)}
                        className="text-sm h-8"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-500 mb-0.5">Wage ($/hr)</label>
                      <Input
                        type="number"
                        step="0.25"
                        placeholder="e.g. 18.00"
                        value={outcomeJobWage}
                        onChange={(e) => setOutcomeJobWage(e.target.value)}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    These details will autofill the Employment section of the client file as current.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleEnterOutcome();
              }}
              disabled={saving || !outcomeStatus}
            >
              {saving ? 'Saving...' : 'Confirm Outcome'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Incomplete timeline items prompt — blocks Mark EDAs as Complete */}
      <AlertDialog open={showIncompletePrompt} onOpenChange={setShowIncompletePrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete timeline items first</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  The following roadmap items have not been marked complete. Please
                  mark them as complete (or cancelled) on the timeline before marking
                  EDAs as complete for{' '}
                  <span className="font-semibold text-slate-800">
                    {client?.first_name} {client?.last_name}
                  </span>.
                </p>
                <div className="max-h-[45vh] overflow-y-auto rounded-md border border-slate-200 divide-y divide-slate-100">
                  {incompleteItems.map(item => (
                    <div key={item.key} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-slate-700">{item.label}</span>
                      <span className="text-xs font-medium text-amber-600">
                        {item.status === 'started' ? 'In Progress' : 'Not Started'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowIncompletePrompt(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark Cancelled confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Program as Cancelled</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the program for{' '}
              <span className="font-semibold text-slate-800">
                {client?.first_name} {client?.last_name}
              </span>{' '}
              as cancelled. This can be reverted later from the status panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? 'Saving...' : 'Yes, Mark Cancelled'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revert status (step back) confirmation — requires pin */}
      <AlertDialog open={showRevertConfirm} onOpenChange={setShowRevertConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{revertStep?.label || 'Revert Status'}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>{revertStep?.description}</p>
                <p className="text-xs text-amber-700 font-medium">
                  This removes the data associated with this status from the client file and the
                  CRT (on the next sync). You can step back again afterward if needed.
                </p>
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Enter pin to confirm
                  </label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    value={revertPin}
                    onChange={(e) => setRevertPin(e.target.value)}
                    className="text-sm"
                    placeholder="Pin"
                    autoFocus
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={saving}
              onClick={() => setRevertPin('')}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRevert();
              }}
              disabled={saving || revertPin !== '5011'}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {saving ? 'Reverting...' : 'Confirm Revert'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}