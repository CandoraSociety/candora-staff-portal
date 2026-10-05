import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/rc/StatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import ContactAttemptDialog from '@/components/empoweru/ContactAttemptDialog';
import { MoreHorizontal, Phone, Clock, ArrowRight, Pencil, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ACCOUNT_SETUP_STATUS_OPTIONS, ACCOUNT_SETUP_PIPELINE, ACCOUNT_SETUP_STATUS_DATE_FIELDS, nextAccountSetupStatus } from '@/lib/empoweruConstants';
import { formatDate, parseDateSmart } from '@/lib/dateUtils';

const STEP_LABELS = { not_started: 'Not Started', contacting: 'Contacting', appointment_scheduled: 'Appt Booked', forms_sent: 'Forms Sent', forms_completed: 'Forms Done', account_opened: 'Opened', completed: 'Done' };
const STATUS_COLORS = Object.fromEntries(ACCOUNT_SETUP_STATUS_OPTIONS.map(s => [s.value, s.color]));
const DATE_FIELD_LABELS = { forms_sent_date: 'forms sent date', forms_completed_date: 'forms completed date', account_opened_date: 'account opened date', appointment_date: 'appointment date' };
const statusLabel = (v) => (ACCOUNT_SETUP_STATUS_OPTIONS.find(s => s.value === v) || {}).label || v;

// One participant's ATB account-setup chase, shown as a progress flow:
// a confirmed "advance" button for the next pipeline step, a Log Contact
// button with full attempt details, and a menu for exceptions.
export default function AccountSetupProgressCard({ record, onUpdated, onEdit }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const now = new Date();

  const isOverdue = record.next_action_date && parseDateSmart(record.next_action_date) < now && !['completed', 'declined'].includes(record.status);
  const isHighAttempts = (record.follow_up_attempts || 0) >= 3 && record.status === 'contacting';
  const stepIndex = ACCOUNT_SETUP_PIPELINE.indexOf(record.status);
  const isPipeline = stepIndex >= 0;
  const next = nextAccountSetupStatus(record.status);
  const attempts = record.contact_attempts || [];
  const legacyCount = Math.max(0, (record.follow_up_attempts || 0) - attempts.length);
  const attemptsColor = record.follow_up_attempts === 0 ? '#64748b' : record.follow_up_attempts <= 2 ? '#f59e0b' : '#ef4444';
  const confirmDateField = next ? ACCOUNT_SETUP_STATUS_DATE_FIELDS[next] : null;

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
    patch(changes, `Status set to ${statusLabel(status)}`);
  };

  return (
    <Card className={`hover:shadow-sm transition-shadow ${(isOverdue || isHighAttempts) ? 'border-amber-300' : ''}`}>
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm text-foreground truncate">{record.participant_name}</p>
              <StatusBadge status={record.status} options={ACCOUNT_SETUP_STATUS_OPTIONS} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{record.cohort_name}</span>
              {(attempts.length > 0 || legacyCount > 0) && (
                <span className="flex items-center gap-1 flex-wrap">
                  {attempts.map((att, i) => (
                    <Popover key={i}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border hover:bg-muted transition-colors"
                          style={{ color: attemptsColor }}
                          title={`Attempt ${i + 1} — ${formatDate(att.date_time)}`}
                        >
                          <Phone className="h-3 w-3" />{i + 1}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 space-y-1.5" align="start">
                        <p className="text-sm font-medium">Attempt {i + 1} — {formatDate(att.date_time)}</p>
                        <div className="flex flex-wrap gap-1">
                          {(att.methods || []).map(m => (
                            <span key={m} className="px-1.5 py-0.5 rounded bg-muted text-[11px]">{m}</span>
                          ))}
                        </div>
                        {att.comments && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{att.comments}</p>}
                      </PopoverContent>
                    </Popover>
                  ))}
                  {legacyCount > 0 && <span className="text-[11px]" style={{ color: attemptsColor }}>+{legacyCount} earlier</span>}
                </span>
              )}
              {record.last_contact_attempt_date && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {formatDate(record.last_contact_attempt_date)}</span>}
              {record.next_action_date && <span className={isOverdue ? 'text-red-600 font-medium' : ''}>Due: {formatDate(record.next_action_date)}</span>}
              {record.appointment_date && <span>Appt: {formatDate(record.appointment_date)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={() => setContactOpen(true)}><Phone className="h-3.5 w-3.5" /> Log Contact</Button>
            {next && (
              <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={busy}>
                {STEP_LABELS[next]} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Advance {record.participant_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Status will move from <span className="font-medium text-foreground">{statusLabel(record.status)}</span> to <span className="font-medium text-foreground">{statusLabel(next)}</span>.
              {confirmDateField ? ` The ${DATE_FIELD_LABELS[confirmDateField]} will be stamped with today's date automatically.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmOpen(false); changeStatus(next); }}>Advance to {statusLabel(next)}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ContactAttemptDialog open={contactOpen} onOpenChange={setContactOpen} record={record} onSaved={onUpdated} />
    </Card>
  );
}