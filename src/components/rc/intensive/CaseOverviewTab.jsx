import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/rc/StatusBadge';
import { CASE_STATUS_OPTIONS } from '@/lib/rcConstants';
import { STAGE_LABELS, OBJECTIVE_STATUS_OPTIONS } from '@/components/rc/intensive/caseConstants';

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

export default function CaseOverviewTab({ client, caseProgress, currentStage, objectives = [] }) {
  if (!client) return <p className="text-sm text-muted-foreground py-6">Select a client.</p>;

  const chips = [
    client.indigenous_first_nations && 'Indigenous / First Nations',
    client.newcomer && 'Newcomer',
    client.senior && 'Senior',
    client.youth_under_25 && 'Youth (under 25)',
    client.has_children_0_6 && `Children 0-6${client.children_count_0_6 ? ` (${client.children_count_0_6})` : ''}`,
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Case Progress</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${caseProgress}%` }} /></div>
            <span className="text-sm font-semibold text-foreground">{caseProgress}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Current stage: {currentStage ? STAGE_LABELS[currentStage] : '—'}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Case Status</p>
          <div className="mt-2"><StatusBadge status={client.case_status} options={CASE_STATUS_OPTIONS} /></div>
          <p className="text-xs text-muted-foreground mt-2">Service category: Intensive Services</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Intake</p>
          <p className="text-sm text-foreground mt-2">{client.intake_date || '—'}</p>
          <p className="text-xs text-muted-foreground mt-2">Worker: {client.assigned_worker || '—'}</p>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service Goals &amp; Objectives</p>
          <span className="text-xs text-muted-foreground">{objectives.filter(o => o.status === 'achieved').length} of {objectives.length} achieved</span>
        </div>
        {objectives.length === 0 ? (
          <p className="text-sm text-muted-foreground">No service goals set yet — add them in the Support Plan Development stage.</p>
        ) : (
          <ul className="space-y-1.5">
            {objectives.map(o => (
              <li key={o.id} className="flex items-center justify-between gap-3">
                <p className={`text-sm min-w-0 ${o.status === 'achieved' ? 'text-green-700' : o.status === 'dropped' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{o.text}</p>
                <StatusBadge status={o.status || 'in_progress'} options={OBJECTIVE_STATUS_OPTIONS} />
              </li>
            ))}
          </ul>
        )}
      </CardContent></Card>

      <Card><CardContent className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="Phone" value={client.phone} />
        <Field label="Email" value={client.email} />
        <Field label="Address" value={[client.address, client.city, client.postal_code].filter(Boolean).join(', ')} />
        <Field label="Primary Language" value={client.preferred_language} />
        <Field label="Additional Languages" value={client.additional_languages} />
        <Field label="English Proficiency" value={client.english_proficiency ? client.english_proficiency.charAt(0).toUpperCase() + client.english_proficiency.slice(1) : ''} />
        <Field label="Emergency Contact" value={client.emergency_contact_name ? `${client.emergency_contact_name}${client.emergency_contact_phone ? ` — ${client.emergency_contact_phone}` : ''}` : ''} />
        <Field label="Reason for Accessing" value={client.reason_for_accessing === 'other' ? `Other — ${client.reason_for_accessing_other || ''}` : REASON_LABELS[client.reason_for_accessing]} />
        <Field label="Children 0-6 Details" value={client.children_ages_detail} />
      </CardContent></Card>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map(c => <span key={c} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{c}</span>)}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Identified Needs</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{client.identified_needs || '—'}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">General Notes</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{client.notes || '—'}</p>
        </CardContent></Card>
      </div>
    </div>
  );
}