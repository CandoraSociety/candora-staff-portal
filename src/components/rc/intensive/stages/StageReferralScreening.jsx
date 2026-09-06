import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StageFieldsCard, StageActionsCard, StageTasksCard } from '../stageShared';

const REASON_LABELS = {
  program_registration: 'Program Registration',
  emergency_food: 'Emergency Food',
  emergency_clothing: 'Emergency Clothing',
  bus_tickets: 'Bus Tickets',
  housing_concerns: 'Housing Concerns',
  other: 'Other',
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="text-sm text-foreground mt-0.5">{value || '—'}</p>
  </div>
);

// Referral & Screening — referral intake info from the client's profile alongside stage tools
export default function StageReferralScreening({ stageKey, draft, client, onUpdateStage, onAddTask, onUpdateTask }) {
  return (
    <div className="space-y-4">
      <StageFieldsCard stageKey={stageKey} draft={draft} onUpdateStage={onUpdateStage} />

      {client && (
        <Card><CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Referral Information (from client profile)</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Referral Source" value={client.referral_source} />
            <Field label="Reason for Accessing" value={client.reason_for_accessing === 'other' ? `Other — ${client.reason_for_accessing_other || ''}` : REASON_LABELS[client.reason_for_accessing]} />
            <Field label="Intake Date" value={client.intake_date} />
            <Field label="Assigned Worker" value={client.assigned_worker} />
            <Field label="Emergency Contact" value={client.emergency_contact_name ? `${client.emergency_contact_name}${client.emergency_contact_phone ? ` — ${client.emergency_contact_phone}` : ''}` : ''} />
            <Field label="Children 0-6" value={client.has_children_0_6 ? `${client.children_count_0_6 || 'Yes'}${client.children_ages_detail ? ` (${client.children_ages_detail})` : ''}` : 'None recorded'} />
          </div>
          <div className="mt-4">
            <Field label="Identified Needs" value={client.identified_needs} />
          </div>
        </CardContent></Card>
      )}

      <StageActionsCard stageKey={stageKey} draft={draft} onAddTask={onAddTask} />
      <StageTasksCard stageKey={stageKey} draft={draft} onAddTask={onAddTask} onUpdateTask={onUpdateTask} />
    </div>
  );
}