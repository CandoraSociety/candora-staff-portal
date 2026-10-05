import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/rc/StatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Phone, Clock, ArrowRight, Pencil, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ACCOUNT_SETUP_STATUS_OPTIONS, ACCOUNT_SETUP_PIPELINE, ACCOUNT_SETUP_STATUS_DATE_FIELDS, nextAccountSetupStatus } from '@/lib/empoweruConstants';
import { formatDate, parseDateSmart } from '@/lib/dateUtils';

const STEP_LABELS = { not_started: 'Not Started', contacting: 'Contacting', appointment_scheduled: 'Appt Booked', forms_sent: 'Forms Sent', forms_completed: 'Forms Done', account_opened: 'Opened', completed: 'Done' };
const STATUS_COLORS = Object.fromEntries(ACCOUNT_SETUP_STATUS_OPTIONS.map(s => [s.value, s.color]));

// One participant's ATB account-setup chase, shown as a progress flow:
// an "advance" button for the next pipeline step plus a menu for
// exceptions (status overrides, contact logging, full edit).
export default function AccountSetupProgressCard({ record, onUpdated, onEdit }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const now = new Date();

  const isOverdue = record.next_action_date && parseDateSmart(record.next_action_date) < now && !['completed', 'declined'].includes(record.status);
  const isHighAttempts = (record.follow_up_attempts || 0) >= 3 && record.status === 'contacting';
  const stepIndex = ACCOUNT_SETUP_PIPELINE.indexOf(record.status);
  const isPipeline = stepIndex >= 0;
  const next = nextAccountSetupStatus(record.status);
  const attemptsColor = record.follow_up_attempts === 0 ? '#64748b' : record.follow_up_attempts <= 2 ? '#f59e0b' : '#ef4444';

  const patch = async (changes, message) => {
    setBusy(true);
    try {
      await base44.entities.EmpowerUAccountSetup.update(record.id, changes);
      toast({ title: message });
      onUpdated?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const changeStatus = (status) => {
    if (status === record.status) return;
    const changes = { status };
    const dateField = ACCOUNT_SETUP_STATUS_DATE_FIELDS[status];
    if (dateField && !record[dateField]) changes[dateField] = new Date().toISOString().slice(0, 10);
    const label = (ACCOUNT_SETUP_STATUS_OPTIONS.find(s => s.value === status) || {}).label || status;
    patch(changes, `Status set to ${label}`);
  };

  const logContact = () => patch({
    follow_up_attempts: (record.follow_up_attempts || 0) + 1,
    last_contact_attempt_date: new Date().toISOString(),
  }, `Contact attempt logged (${(record.follow_up_attempts || 0) + 1} total)`);

  return (
    <Card className={`hover:shadow-sm transition-shadow ${(isOverdue || isHighAttempts) ? 'border-amber-300' : ''}`}>
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm text-foreground truncate">{record.participant_name}</p>
              <StatusBadge status={record.status} options={ACCOUNT_SETUP_STATUS_OPTIONS} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
              <span>{record.cohort_name}</span>
              {record.follow_up_attempts > 0 && <span className="flex items-center gap-0.5" style={{ color: attemptsColor }}><Phone className="h-3 w-3" /> {record.follow_up_attempts} attempts</span>}
              {record.last_contact_attempt_date && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {formatDate(record.last_contact_attempt_date)}</span>}
              {record.next_action_date && <span className={isOverdue ? 'text-red-600 font-medium' : ''}>Due: {formatDate(record.next_action_date)}</span>}
              {record.appointment_date && <span>Appt: {formatDate(record.appointment_date)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {next && (
              <Button size="sm" onClick={() => changeStatus(next)} disabled={busy}>
                {STEP_LABELS[next]} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={logContact}>Log contact attempt</DropdownMenuItem>
                <DropdownMenuSeparator />
                {ACCOUNT_SETUP_STATUS_OPTIONS.map(s => (
                  <DropdownMenuItem key={s.value} onClick={() => changeStatus(s.value)} className="justify-between">
                    {s.label}
                    {s.value === record.status && <Check className="h-3.5 w-3.5" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEdit}><Pencil className="h-3.5 w-3.5" /> Edit details</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className={`grid grid-cols-7 gap-1 ${!isPipeline ? 'opacity-40' : ''}`}>
          {ACCOUNT_SETUP_PIPELINE.map((s, i) => {
            const done = isPipeline && i < stepIndex;
            const current = isPipeline && i === stepIndex;
            return (
              <div key={s} className="min-w-0">
                <div className="h-1.5 rounded-full" style={{ background: done ? '#22c55e' : current ? (STATUS_COLORS[s] || '#94a3b8') : 'hsl(var(--muted))' }} />
                <p className={`text-[9px] text-center mt-1 truncate leading-tight ${current ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{STEP_LABELS[s]}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}