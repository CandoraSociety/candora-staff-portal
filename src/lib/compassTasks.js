import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const fmtDate = (d) => {
  if (!d) return 'N/A';
  try { return format(new Date(d), 'MMM d, yyyy'); } catch { return d; }
};

export async function createCompassTask({
  client_id,
  client_name,
  compass_hsid,
  task_type,
  title,
  instructions,
  assigned_worker,
  assigned_worker_name,
}) {
  // Deduplication: delete existing pending tasks with same client_id + task_type
  try {
    const existing = await base44.entities.CompassTask.filter({ client_id, task_type, status: 'pending' });
    for (const t of existing) {
      await base44.entities.CompassTask.delete(t.id);
    }
  } catch (_) {}

  let triggered_by = null;
  let triggered_by_name = null;
  try {
    const me = await base44.auth.me();
    triggered_by = me?.email || null;
    triggered_by_name = me?.full_name || me?.email || null;
  } catch (_) {}

  return base44.entities.CompassTask.create({
    client_id,
    client_name,
    compass_hsid: compass_hsid || '',
    task_type,
    title,
    instructions,
    assigned_worker: assigned_worker || '',
    assigned_worker_name: assigned_worker_name || '',
    triggered_by,
    triggered_by_name,
    status: 'pending',
  });
}

// ─── Task Factory Functions ──────────────────────────────────────────────────

export function taskNewClient(client) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    task_type: 'new_client',
    title: `New client intake: ${name}`,
    instructions: `A new client file has been created in the system. Action: Create a new client file in Compass.\n\nClient Details:\n• Name: ${name}\n• Date of Birth: ${fmtDate(client.date_of_birth)}\n• Residency Status: ${client.residency_status || 'N/A'}\n• Service Element: ${client.service_type || 'N/A'}\n• Intake Date: ${fmtDate(client.intake_date)}\n\nAfter creating the file in Compass, record the HSID# back in this app on the client's profile.`,
  };
}

export function taskStreamSwitch(client, fromStream, toStream, reason) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    task_type: 'stream_switch',
    title: `Program stream switched: ${name}`,
    instructions: `The client's program stream has been switched. Action: Update the program stream in Compass.\n\n• From: ${fromStream}\n• To: ${toStream}\n• Reason: ${reason || 'N/A'}\n• Client HSID#: ${client.compass_hsid || 'Not recorded — check client profile'}`,
  };
}

export function taskServiceTypeChange(client, newType) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    task_type: 'service_type_change',
    title: `Service element updated: ${name}`,
    instructions: `The client's service element has been updated. Action: Update the service element in Compass.\n\n• New Service Element: ${newType}\n• Client HSID#: ${client.compass_hsid || 'Not recorded — check client profile'}`,
  };
}

export function taskStatusChange(client, newStatus) {
  const name = `${client.first_name} ${client.last_name}`;
  let extraInstructions = '';
  if (newStatus === 'complete') {
    extraInstructions = `\n• Record the completion date: ${fmtDate(client.completion_date)}`;
  } else if (newStatus === 'incomplete' || newStatus === 'cancelled') {
    extraInstructions = `\n• Record the termination reason and date in Compass.`;
  }
  return {
    task_type: 'program_status_change',
    title: `Program status changed: ${name}`,
    instructions: `The client's program status has been updated. Action: Update the program status in Compass.\n\n• New Status: ${newStatus}${extraInstructions}\n• Client HSID#: ${client.compass_hsid || 'Not recorded — check client profile'}`,
  };
}

export function taskEmploymentOutcome(client, employmentStatus) {
  const name = `${client.first_name} ${client.last_name}`;
  const isEmployed = ['E-RF', 'E-UF', 'E-PT'].includes(employmentStatus);
  const employerDetails = isEmployed
    ? `\n• Employer: ${client.employer_name || 'N/A'}\n• Job Title: ${client.job_title || 'N/A'}\n• Start Date: ${fmtDate(client.job_start_date)}`
    : '';
  return {
    task_type: 'employment_outcome',
    title: `Employment outcome recorded: ${name}`,
    instructions: `An employment outcome has been recorded for this client. Action: Enter the employment outcome in Compass.\n\n• Employment Status: ${employmentStatus}${employerDetails}\n• Client HSID#: ${client.compass_hsid || 'Not recorded — check client profile'}`,
  };
}

export function taskPostCompletionEmployment(client, status) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    task_type: 'post_completion_employment',
    title: `Post-completion employment updated: ${name}`,
    instructions: `A post-completion employment status has been recorded. Action: Enter the post-completion employment outcome in Compass.\n\n• Status: ${status}\n• Post-Completion Date: ${fmtDate(client.post_completion_employment_date)}\n• Client HSID#: ${client.compass_hsid || 'Not recorded — check client profile'}`,
  };
}

export function task90DayFollowup(client, status) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    task_type: 'followup_90day',
    title: `90-day follow-up recorded: ${name}`,
    instructions: `A 90-day follow-up outcome has been recorded. Action: Enter the 90-day follow-up outcome in Compass.\n\n• Follow-Up Status: ${status}\n• Follow-Up Date: ${fmtDate(client.followup_90day_date)}\n• Client HSID#: ${client.compass_hsid || 'Not recorded — check client profile'}`,
  };
}

export function taskFileClosed(client) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    task_type: 'file_closed',
    title: `File closed: ${name}`,
    instructions: `The client file has been closed. Action: Close the client file in Compass.\n\n• Closed Reason: ${client.closed_reason || 'N/A'}\n• Date Closed: ${fmtDate(client.closed_date)}\n• Notes: ${client.closed_notes || 'N/A'}\n• Client HSID#: ${client.compass_hsid || 'Not recorded — check client profile'}`,
  };
}

export function taskServiceNavigation(client) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    task_type: 'service_navigation',
    title: `Service navigation supports: ${name}`,
    instructions: `Service navigation supports have been provided to this client. Action: Record the service navigation activity in Compass.\n\n• Service Navigation Date: ${fmtDate(client.service_navigation_date)}\n• Client HSID#: ${client.compass_hsid || 'Not recorded — check client profile'}`,
  };
}

export function taskActionPlan(client) {
  const name = `${client.first_name} ${client.last_name}`;
  const items = Array.isArray(client.sdp_items) && client.sdp_items.length > 0
    ? client.sdp_items.map(i => `  • ${i}`).join('\n')
    : '  • N/A';
  return {
    task_type: 'action_plan',
    title: `Employment Action Plan submitted: ${name}`,
    instructions: `An Employment Action Plan (EAP) has been completed for this client. Action: Enter the EAP into the Compass service plan.\n\nAction Plan Items (SDP):\n${items}\n\nCareer Objectives: ${client.career_objectives || 'N/A'}\n• Client HSID#: ${client.compass_hsid || 'Not recorded — check client profile'}`,
  };
}

export function taskBarriersIdentified(client) {
  const name = `${client.first_name} ${client.last_name}`;
  const barriers = [client.barrier_1, client.barrier_2, client.barrier_3]
    .filter(Boolean)
    .map(b => `  • ${b}`)
    .join('\n') || '  • N/A';
  return {
    task_type: 'barriers_identified',
    title: `Barriers identified: ${name}`,
    instructions: `Barriers have been identified for this client. Action: Enter the barriers into the Compass client profile.\n\nIdentified Barriers:\n${barriers}\n\n• Client HSID#: ${client.compass_hsid || 'Not recorded — check client profile'}`,
  };
}