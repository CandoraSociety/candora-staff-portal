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
import { CheckCircle2, ChevronDown, ListChecks, Briefcase, ClipboardCheck, Ban } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { classifyClient } from '@/lib/clientClassification';
import { logStatusChange } from '@/lib/logStatusChange';
import { toast } from 'sonner';
import { FOLLOWUP_90DAY_OPTIONS as OUTCOME_OPTIONS, PLACEMENT_OUTCOME_OPTIONS } from '@/lib/crtCodes';

export default function UpdateProgramStatusMenu({ client, onClientUpdate }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEmploymentConfirm, setShowEmploymentConfirm] = useState(false);
  const [showOutcomeConfirm, setShowOutcomeConfirm] = useState(false);
  const [outcomeStatus, setOutcomeStatus] = useState('E-RF');
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
  const [saving, setSaving] = useState(false);

  const isDEA = client?.service_type === 'direct_to_employment';
  const isWD = client?.service_type === 'pathways';
  const section = classifyClient(client);
  const inActiveEda = section === 'program_started' && (isDEA || isWD) && !!client?.service_start_date;
  const inWorkSearch = isWD && section === 'work_search' && !client?.employment_start_date;
  const inFollowup = (isDEA || isWD) && section === 'followup_period' && !client?.followup_90day_status;

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
      setEmployerName(''); setJobTitle(''); setJobHours(''); setJobWage('');
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

      const updated = await base44.entities.Client.update(client.id, {
        followup_90day_status: outcomeStatus,
        roadmap_progress_notes: notes,
      });

      await logStatusChange({
        client,
        change_type: 'program_status_change',
        from_value: 'followup_period',
        to_value: 'completed',
        notes: `90-day follow-up outcome: ${outcomeStatus}.`,
      });

      onClientUpdate?.(updated);
      setShowOutcomeConfirm(false);
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
              onSelect={() => setShowConfirm(true)}
              className="text-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
              Mark EDAs as Complete
            </DropdownMenuItem>
          )}
          {inWorkSearch && (
            <DropdownMenuItem
              onSelect={() => setShowEmploymentConfirm(true)}
              className="text-sm cursor-pointer"
            >
              <Briefcase className="w-4 h-4 mr-2 text-green-600" />
              Found Employment
            </DropdownMenuItem>
          )}
          {inFollowup && (
            <DropdownMenuItem
              onSelect={() => setShowOutcomeConfirm(true)}
              className="text-sm cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 mr-2 text-blue-600" />
              Enter 90-Day Follow-up Outcome
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
        <AlertDialogContent>
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
                <div className="pt-1 grid grid-cols-1 gap-1.5">
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
    </div>
  );
}