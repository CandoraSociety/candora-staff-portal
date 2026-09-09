import { base44 } from '@/api/base44Client';

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
export async function logGrabAndGoVisit({ client, resourceType, resourceOther, comments, byName }) {
  const today = todayStr();
  const clientName = clientFullName(client);
  const resourceLabel = grabAndGoLabel(resourceType, resourceOther);
  await base44.entities.RCClientVisit.create({
    client_id: client.id,
    client_name: clientName,
    visit_date: today,
    visit_type: 'grab_and_go',
    resource_type: resourceType,
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
    description: `Grab and Go — ${resourceLabel}`,
    notes: comments || '',
  });
  await base44.entities.RCClient.update(client.id, { visit_count: (client.visit_count || 0) + 1 });
}

// Caseworker completes a visit — marks it complete, adds the service history
// entry and increments the client's visit count.
export async function completeClientVisit({ visit, visitNotes, followUpRequired }) {
  await base44.entities.RCClientVisit.update(visit.id, {
    status: 'complete',
    visit_notes: visitNotes,
    follow_up_required: followUpRequired,
  });
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