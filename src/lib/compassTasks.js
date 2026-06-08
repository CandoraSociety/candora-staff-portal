import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export async function createCompassTask({ client_id, task_type, ...rest }) {
  // Dedup: delete existing pending task of same type for this client
  try {
    const existing = await base44.entities.CompassTask.filter({ client_id, task_type, status: 'pending' });
    for (const t of existing) {
      await base44.entities.CompassTask.delete(t.id);
    }
  } catch (_) {}

  let triggeredBy = null;
  let triggeredByName = null;
  try {
    const me = await base44.auth.me();
    triggeredBy = me?.email || null;
    triggeredByName = me?.full_name || null;
  } catch (_) {}

  return base44.entities.CompassTask.create({
    client_id,
    task_type,
    status: 'pending',
    triggered_by: triggeredBy,
    triggered_by_name: triggeredByName,
    ...rest,
  });
}

const fmtDate = (d) => {
  if (!d) return 'N/A';
  try { return format(new Date(d), 'MMM d, yyyy'); } catch { return d; }
};

export function taskNewClient(client) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    client_name: name,
    compass_hsid: client.compass_hsid,
    title: `New client intake: ${name}`,
    instructions: `A new client has been added to the system.\nAction: Create a new client file in Compass.\n\nClient details:\n• Name: ${name}\n• DOB: ${fmtDate(client.date_of_birth)}\n• Residency Status: ${client.residency_status || 'N/A'}\n• Service Element: ${client.service_type || 'N/A'}\n• Intake Date: ${fmtDate(client.intake_date)}\n\nEnter all demographic and intake information into Compass and record the HSID# back in this app.`,
  };
}

export function taskStreamSwitch(client, from, to, reason) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    client_name: name,
    compass_hsid: client.compass_hsid,
    title: `Stream switch: ${name}`,
    instructions: `Client stream has been switched.\n• From: ${from}\n• To: ${to}\n• Reason: ${reason || 'N/A'}\n\nUpdate the client's program stream in Compass.`,
  };
}

export function taskServiceTypeChange(client, from, to) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    client_name: name,
    compass_hsid: client.compass_hsid,
    title: `Service type change: ${name}`,
    instructions: `Client service type has changed.\n• From: ${from}\n• To: ${to}\n\nUpdate service type in Compass.`,
  };
}

export function taskStatusChange(client, from, to) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    client_name: name,
    compass_hsid: client.compass_hsid,
    title: `Status change: ${name}`,
    instructions: `Client status changed from "${from}" to "${to}".\n\nUpdate status in Compass accordingly.`,
  };
}

export function taskEmploymentOutcome(client) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    client_name: name,
    compass_hsid: client.compass_hsid,
    title: `Employment outcome: ${name}`,
    instructions: `Client has achieved an employment outcome.\n• Employer: ${client.employer_name || 'N/A'}\n• Job Title: ${client.job_title || 'N/A'}\n• Start Date: ${fmtDate(client.job_start_date)}\n\nRecord employment outcome in Compass.`,
  };
}

export function taskPostCompletionEmployment(client) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    client_name: name,
    compass_hsid: client.compass_hsid,
    title: `Post-completion employment: ${name}`,
    instructions: `Client has achieved post-completion employment.\n• Status: ${client.post_completion_employment_status || 'N/A'}\n• Date: ${fmtDate(client.post_completion_employment_date)}\n\nRecord post-completion employment status in Compass.`,
  };
}

export function task90DayFollowup(client) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    client_name: name,
    compass_hsid: client.compass_hsid,
    title: `90-day follow-up: ${name}`,
    instructions: `90-day follow-up is due for this client.\n• Follow-up date: ${fmtDate(client.followup_90day_date)}\n• Status: ${client.followup_90day_status || 'Pending'}\n\nRecord 90-day follow-up outcome in Compass.`,
  };
}

export function taskFileClosed(client) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    client_name: name,
    compass_hsid: client.compass_hsid,
    title: `File closed: ${name}`,
    instructions: `Client file has been closed.\n• Reason: ${client.closed_reason || 'N/A'}\n• Date: ${fmtDate(client.closed_date)}\n\nUpdate file status to closed in Compass.`,
  };
}

export function taskServiceNavigation(client) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    client_name: name,
    compass_hsid: client.compass_hsid,
    title: `Service navigation: ${name}`,
    instructions: `Service navigation support has been provided to this client.\n• Date: ${fmtDate(client.service_navigation_date)}\n\nRecord service navigation activity in Compass.`,
  };
}

export function taskActionPlan(client) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    client_name: name,
    compass_hsid: client.compass_hsid,
    title: `Action plan submitted: ${name}`,
    instructions: `An action plan has been completed for this client.\n\nEnter the action plan into Compass and mark as submitted.`,
  };
}

export function taskBarriersIdentified(client) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    client_name: name,
    compass_hsid: client.compass_hsid,
    title: `Barriers identified: ${name}`,
    instructions: `Barriers have been identified for this client. Please review and update the Barrier Identification Tool (BIT) in Compass accordingly.`,
  };
}