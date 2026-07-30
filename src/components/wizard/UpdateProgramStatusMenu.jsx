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
import { CheckCircle2, ChevronDown, ListChecks, Briefcase } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { classifyClient } from '@/lib/clientClassification';
import { logStatusChange } from '@/lib/logStatusChange';
import { toast } from 'sonner';

export default function UpdateProgramStatusMenu({ client, onClientUpdate }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEmploymentConfirm, setShowEmploymentConfirm] = useState(false);
  const [completionDate, setCompletionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [employmentDate, setEmploymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [saving, setSaving] = useState(false);

  const isDEA = client?.service_type === 'direct_to_employment';
  const isWD = client?.service_type === 'pathways';
  const section = classifyClient(client);
  const inActiveEda = section === 'program_started' && (isDEA || isWD) && !!client?.service_start_date;
  const inWorkSearch = isWD && section === 'work_search' && !client?.employment_start_date;

  const nextSectionLabel = isWD ? 'Work Search Phase' : isDEA ? 'Follow-up Period' : 'next section';

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
        item_label: 'Found Employment',
        item_key: 'employment_found',
        note: `Employment found on ${employmentDate}. 90-day follow-up due ${followupDate}.`,
        logged_by: me?.email || '',
        logged_by_name: me?.full_name || '',
        compass_entered: false,
      });

      const updated = await base44.entities.Client.update(client.id, {
        employment_start_date: employmentDate,
        followup_90day_date: followupDate,
        roadmap_progress_notes: notes,
      });

      await logStatusChange({
        client,
        change_type: 'program_status_change',
        from_value: 'work_search',
        to_value: 'followup_period',
        notes: `Employment found on ${employmentDate}. 90-day follow-up due ${followupDate}.`,
      });

      onClientUpdate?.(updated);
      setShowEmploymentConfirm(false);
      toast.success('Employment recorded — moved to Follow-up Period. 90-day follow-up date set.');
    } catch (e) {
      toast.error('Failed to update status');
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
          {!inActiveEda && !inWorkSearch && (
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Found Employment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  This will record employment for{' '}
                  <span className="font-semibold text-slate-800">
                    {client?.first_name} {client?.last_name}
                  </span>{' '}
                  and move them from <span className="font-medium">Work Search</span> into the{' '}
                  <span className="font-medium">Follow-up Period</span>.
                </p>
                <p>
                  The 90-day follow-up date will be set to exactly 90 days after the employment date.
                </p>
                <div className="pt-1">
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
              disabled={saving || !employmentDate}
            >
              {saving ? 'Saving...' : 'Confirm & Record Employment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}