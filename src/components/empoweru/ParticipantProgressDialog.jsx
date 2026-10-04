import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, Circle, Phone, Mail, ExternalLink } from 'lucide-react';
import {
  PRE_PROGRAM_CHECKPOINTS, COMPLETION_CHECKPOINTS,
  progressOf, outstandingPreProgram, outstandingCompletion,
} from '@/lib/empoweruProgress';

// One program milestone row — directly clickable, saves immediately.
function CheckpointRow({ label, done, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-2.5 rounded-md border border-transparent hover:border-border hover:bg-muted/50 text-left transition-colors"
    >
      {done
        ? <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
        : <Circle className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />}
      <span className={`text-sm ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
      {done && <span className="ml-auto text-[10px] uppercase tracking-wide text-success font-medium">Done</span>}
    </button>
  );
}

// Informational (non-milestone) text/currency field — inline input, saves on blur.
function InfoField({ label, hint, field, type = 'text', form, onCommit }) {
  const value = form?.[field];
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {hint && <p className="text-[10px] leading-tight text-muted-foreground/80 -mt-0.5">{hint}</p>}
      <div className="relative">
        {type === 'currency' && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>}
        <Input
          className={type === 'currency' ? 'pl-6' : ''}
          type={type === 'currency' ? 'number' : 'text'}
          value={value ?? ''}
          placeholder="—"
          onChange={(e) => onCommit(field, e.target.value, false)}
          onBlur={(e) => onCommit(field, e.target.value, true)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      </div>
    </div>
  );
}

// Participant Progress record for one active participant within one cohort.
// Opens in-place from the cohort's Active Participants list.
export default function ParticipantProgressDialog({ open, onOpenChange, registration, participant, cohortName, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (open && registration) setForm({ ...registration });
  }, [open, registration?.id]);

  if (!registration || !form) return null;

  const { completed, total } = progressOf(form);
  const preOutstanding = outstandingPreProgram(form);
  const completionOutstanding = outstandingCompletion(form);
  const pct = Math.round((completed / total) * 100);

  const saveField = async (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    try {
      await base44.entities.EmpowerURegistration.update(registration.id, { [field]: value });
      onSaved && onSaved();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setForm(prev => ({ ...prev, [field]: value === true ? false : value === false ? true : null }));
    }
  };

  const commitInfo = (field, raw, commit) => {
    const currencyFields = ['atb_amount', 'saved_amount', 'total_amount'];
    let value;
    if (currencyFields.includes(field)) value = raw === '' ? null : Number(raw);
    else value = raw === '' ? null : raw;
    setForm(prev => ({ ...prev, [field]: value }));
    if (commit && registration[field] !== value) saveField(field, value);
  };

  const fullName = registration.participant_name || (participant ? `${participant.first_name} ${participant.last_name}` : '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2 pr-6">
            <div>
              <DialogTitle>{fullName} — Participant Progress</DialogTitle>
              <DialogDescription>{cohortName}</DialogDescription>
            </div>
            <Link to={`/empoweru/participants/${registration.participant_id}`} className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 flex-shrink-0 mt-1">
              Full profile <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Phone className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{participant?.phone || '—'}</span>
          <Mail className="h-3 w-3 text-muted-foreground ml-2" />
          <span className="text-muted-foreground">{participant?.email || '—'}</span>
        </div>

        {/* Progress summary — milestones only */}
        <div className="rounded-md border bg-muted/40 px-3 py-2 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{completed} of {total} checkpoints complete</span>
          <div className="h-1.5 flex-1 min-w-[80px] rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* 1. Pre-Program & Participant Setup */}
        <div>
          <h3 className="text-sm font-heading font-semibold text-foreground mb-1.5">Pre-Program &amp; Participant Setup</h3>
          <p className="text-[11px] text-muted-foreground mb-2">Milestones — click to mark complete or outstanding.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {PRE_PROGRAM_CHECKPOINTS.map(c => (
              <CheckpointRow key={c.key} label={c.label} done={!!form[c.key]} onToggle={() => saveField(c.key, !form[c.key])} />
            ))}
          </div>
        </div>

        {/* 2. Program & Savings Progress */}
        <div>
          <h3 className="text-sm font-heading font-semibold text-foreground mb-1.5">Program &amp; Savings Progress</h3>
          <p className="text-[11px] text-muted-foreground mb-2">Information fields — edit inline, changes save when you leave the field.</p>
          <button
            type="button"
            onClick={() => saveField('bank_account_opened', !form.bank_account_opened)}
            className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted/50 text-left mb-3"
          >
            <Checkbox checked={!!form.bank_account_opened} onCheckedChange={() => saveField('bank_account_opened', !form.bank_account_opened)} />
            <span className="text-sm text-foreground">Bank Account Opened</span>
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoField label="Bank Representative" field="bank_representative" form={form} onCommit={commitInfo} />
            <InfoField label="Ambassador Name" hint="ATB/EmpowerU Ambassador for the participant's banking and matched-savings setup" field="ambassador_name" form={form} onCommit={commitInfo} />
            <InfoField label="Savings Goal" field="savings_goal" form={form} onCommit={commitInfo} />
            <InfoField label="Bank" field="bank" form={form} onCommit={commitInfo} />
            <InfoField label="Bank Rep Phone" field="bank_representative_phone" form={form} onCommit={commitInfo} />
            <InfoField label="Account Type" field="account_type" form={form} onCommit={commitInfo} />
            <InfoField label="Bank Rep Email" field="bank_representative_email" form={form} onCommit={commitInfo} />
            <div className="grid grid-cols-3 gap-2 sm:col-span-2">
              <InfoField label="$ ATB" field="atb_amount" type="currency" form={form} onCommit={commitInfo} />
              <InfoField label="$ Saved" field="saved_amount" type="currency" form={form} onCommit={commitInfo} />
              <InfoField label="Total" field="total_amount" type="currency" form={form} onCommit={commitInfo} />
            </div>
          </div>
        </div>

        {/* 3. Completion & Cash-Out */}
        <div>
          <h3 className="text-sm font-heading font-semibold text-foreground mb-1.5">Completion &amp; Cash-Out</h3>
          <p className="text-[11px] text-muted-foreground mb-2">Milestones — click to mark complete or outstanding.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {COMPLETION_CHECKPOINTS.map(c => (
              <CheckpointRow key={c.key} label={c.label} done={!!form[c.key]} onToggle={() => saveField(c.key, !form[c.key])} />
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Notes — outstanding issues, exceptions, follow-ups</label>
          <Textarea
            rows={3}
            value={form.progress_notes ?? ''}
            placeholder="Add participant-specific operational notes..."
            onChange={(e) => commitInfo('progress_notes', e.target.value, false)}
            onBlur={(e) => commitInfo('progress_notes', e.target.value, true)}
          />
        </div>

        {(preOutstanding.length > 0 || completionOutstanding.length > 0) && (
          <div className="text-[11px] text-muted-foreground border-t pt-2">
            Still outstanding: {[...preOutstanding, ...completionOutstanding].join(', ') || 'none'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}