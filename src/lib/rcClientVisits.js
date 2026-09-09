import { base44 } from '@/api/base44Client';
import { CASEWORK_REASON_OPTIONS } from '@/lib/rcConstants';

// Shared logic for Reception Client Visits — used by the Reception Client Visit
// tab and the Central Database Worker Dashboard.

export const GRAB_AND_GO_OPTIONS = [
  { value: 'access_computer_phone', label: 'Access computer/phone' },
  { value: 'baby_supplies', label: 'Baby supplies' },
  { value: 'bus_tickets', label: 'Bus tickets' },
  { value: 'emergency_food', label: 'Emergency food' },
  { value: 'general_supplies', label: 'General supplies' },
  { value: 'other', label: 'Other' },
];

export const VISIT_TYPE_LABELS = {
  grab_and_go: 'Grab and Go Resources',
  drop_in_casework: 'Drop-In Casework',
  scheduled: 'Scheduled Visit',
};

export const grabAndGoLabel = (type, other) => {
  const option = GRAB_AND_GO_OPTIONS.find(o => o.value === type);
  if (type === 'other') return other || 'Other';
  return option?.label || type || 'Resource';
};

export const todayStr = () => new Date().toISOString().split('T')[0];

export const clientFullName = (c) => `${c?.first_name || ''} ${c?.last_name || ''}`.trim();

// Grab-and-go: logged immediately — visit record, service history entry and visit count
export async function logGrabAndGoVisit({ client, resourceType, resourceQuantity, resourceOther, comments, byName }) {
  const today = todayStr();
  const clientName = clientFullName(client);
  const resourceLabel = grabAndGoLabel(resourceType, resourceOther);
  const quantity = resourceType === 'bus_tickets' && resourceQuantity ? Number(resourceQuantity) : null;
  await base44.entities.RCClientVisit.create({
    client_id: client.id,
    client_name: clientName,
    visit_date: today,
    visit_type: 'grab_and_go',
    resource_type: resourceType,
    resource_quantity: quantity,
    resource_other: resourceOther || '',
    comments: comments || '',
    status: 'complete',
    created_by_name: byName || 'Reception',
  });
  await base44.entities.RCServiceLog.create({
    client_id: client.id,
    client_name: clientName,
    service_date: today,
    service_type: 'practical_support',
    worker_name: byName || 'Reception',
    description: `Grab and Go — ${resourceLabel}${quantity ? ` (qty: ${quantity})` : ''}`,
    notes: comments || '',
  });
  await base44.entities.RCClient.update(client.id, { visit_count: (client.visit_count || 0) + 1 });
}

// Drop-in casework and scheduled visits — the service history entry is created
// up front (so the visit shows on the client profile immediately), and the
// caseworker completing the pending visit later appends their notes to it.
const SERVICE_LOG_REASON_VALUES = [
  'housing_concerns', 'financial_assistance', 'mental_health_wellbeing', 'family_parenting_support',
  'advocacy_navigation', 'documentation_id', 'employment_income', 'settlement_immigration',
  'health_medical', 'crisis_safety', 'other',
];

export async function logCaseworkVisitToServiceHistory({ visit, mode, form, workerName, durationMinutes }) {
  const reason = SERVICE_LOG_REASON_VALUES.includes(form.reason_for_accessing) ? form.reason_for_accessing : null;
  const reasonLabel = reason
    ? (reason === 'other'
        ? (form.reason_for_accessing_other || 'Other')
        : (CASEWORK_REASON_OPTIONS.find(o => o.value === reason)?.label || reason))
    : '';
  const entry = {
    client_id: visit.client_id,
    client_name: visit.client_name,
    service_date: visit.visit_date,
    service_type: 'information_referral',
    worker_name: workerName || '',
    description: [VISIT_TYPE_LABELS[mode] || 'Client visit', reasonLabel].filter(Boolean).join(' — '),
    duration_minutes: durationMinutes || 0,
    source_visit_id: visit.id,
  };
  if (reason) {
    entry.reason_for_visit = reason;
    if (reason === 'other') entry.reason_for_visit_other = form.reason_for_accessing_other || '';
  }
  if (form.service_category) entry.service_category = form.service_category;
  if (form.identified_needs) entry.notes = form.identified_needs;
  await base44.entities.RCServiceLog.create(entry);
}

// Caseworker completes a visit — marks it complete and updates the service
// history entry created when the visit was logged (appending their notes).
// Legacy pending visits without an existing entry get one created here.
export async function completeClientVisit({ visit, visitNotes, followUpRequired }) {
  await base44.entities.RCClientVisit.update(visit.id, {
    status: 'complete',
    visit_notes: visitNotes,
    follow_up_required: followUpRequired,
  });
  const existing = await base44.entities.RCServiceLog.filter({ source_visit_id: visit.id });
  if (existing.length > 0) {
    const log = existing[0];
    await base44.entities.RCServiceLog.update(log.id, {
      worker_name: visit.caseworker_name || log.worker_name,
      notes: [log.notes, visitNotes].filter(Boolean).join('\n\n'),
      follow_up_needed: followUpRequired === 'yes',
    });
    return;
  }
  await base44.entities.RCServiceLog.create({
    client_id: visit.client_id,
    client_name: visit.client_name,
    service_date: visit.visit_date,
    service_type: 'information_referral',
    worker_name: visit.caseworker_name || '',
    description: `${VISIT_TYPE_LABELS[visit.visit_type] || 'Client visit'} — ${visit.comments || ''}`.trim(),
    notes: visitNotes,
    follow_up_needed: followUpRequired === 'yes',
  });
  const client = await base44.entities.RCClient.get(visit.client_id);
  await base44.entities.RCClient.update(visit.client_id, { visit_count: (client.visit_count || 0) + 1 });
}