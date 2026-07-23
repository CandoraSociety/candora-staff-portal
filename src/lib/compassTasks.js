import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const fmtDate = (d) => {
  if (!d) return 'N/A';
  try { return format(new Date(d), 'MMM d, yyyy'); } catch { return d; }
};

const hsidLine = (client) =>
  `• Client HSID#: ${client?.compass_hsid || 'Not yet recorded — check client profile'}`;

// ─── Core: create + dedup ────────────────────────────────────────────────────

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
  // Dedup: delete existing pending tasks with same client_id + task_type + title
  try {
    const existing = await base44.entities.CompassTask.filter({
      client_id, task_type, status: 'pending',
    });
    for (const t of existing) {
      if (t.title === title) {
        await base44.entities.CompassTask.delete(t.id);
      }
    }
  } catch (_) {}

  let triggered_by = null;
  let triggered_by_name = null;
  try {
    const me = await base44.auth.me();
    triggered_by = me?.email || null;
    triggered_by_name = me?.full_name || me?.email || null;
  } catch (_) {}

  // If no assigned worker, default to the person who triggered the task
  const worker = assigned_worker || triggered_by || '';
  const workerName = assigned_worker_name || triggered_by_name || '';

  return base44.entities.CompassTask.create({
    client_id,
    client_name: client_name || '',
    compass_hsid: compass_hsid || '',
    task_type,
    title,
    instructions,
    assigned_worker: worker,
    assigned_worker_name: workerName,
    triggered_by,
    triggered_by_name,
    status: 'pending',
  });
}

// ─── Task Factory Functions ──────────────────────────────────────────────────
// Each returns { task_type, title, instructions }

// 1. New client file — check for existing Compass file or create one, then record HSID
export function taskNewClient(client) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    task_type: 'new_client',
    title: `New client file: ${name}`,
    instructions: `A new client file has been created in Pathways CM.

Step 1 — Check for an existing file in Compass:
Search for this client in Compass using their name and date of birth. If an existing file is found, proceed to Step 2. If no file exists, create a new client file in Compass.

Step 2 — Record the HSID#:
Once the Compass file is found or created, copy the HSID# and enter it on the client's profile in Pathways CM (Client Profile → Compass HSID# field).

Client Details:
• Name: ${name}
• Date of Birth: ${fmtDate(client.date_of_birth)}
• Residency Status: ${client.residency_status || 'N/A'}
• Service Element: ${client.service_type || 'N/A'}
• Intake Date: ${fmtDate(client.intake_date)}`,
  };
}

// 2. BIT and ERA completed — enter barrier info and ERA in Compass
export function taskBitEraCompleted(client) {
  const name = `${client.first_name} ${client.last_name}`;
  const barriers = [client.barrier_1, client.barrier_2, client.barrier_3]
    .filter(Boolean)
    .map(b => `  • ${b}`)
    .join('\n') || '  • None identified';
  return {
    task_type: 'bit_era_completed',
    title: `BIT & ERA completed: ${name}`,
    instructions: `The Barrier Identification Tool (BIT) and Employment Readiness Assessment (ERA) have been completed for this client. Enter the following into Compass:

1. Barrier Information — Enter the identified barriers:
${barriers}

2. ERA Results — Enter the Employment Readiness Assessment results and notes.

${hsidLine(client)}`,
  };
}

// 3. Action Plan created — create the action plan in Compass
export function taskActionPlanCreated(client) {
  const name = `${client.first_name} ${client.last_name}`;
  const items = Array.isArray(client.sdp_items) && client.sdp_items.length > 0
    ? client.sdp_items.map(i => `  • ${i}`).join('\n')
    : '  • N/A';
  return {
    task_type: 'action_plan_created',
    title: `Action Plan created: ${name}`,
    instructions: `An Employment Action Plan has been created for this client. Create the action plan in Compass.

Action Plan Items:
${items}

Career Objectives: ${client.career_objectives || 'N/A'}

${hsidLine(client)}`,
  };
}

// 4a. EDA started — enter in Compass comments (for longer-term items like internal training, work exposure)
export function taskEdaStarted(client, edaLabel, details = {}) {
  const name = `${client.first_name} ${client.last_name}`;
  const detailLines = Object.entries(details)
    .filter(([, v]) => v)
    .map(([k, v]) => `• ${k}: ${v}`)
    .join('\n');
  return {
    task_type: 'eda_started',
    title: `EDA started: ${edaLabel} — ${name}`,
    instructions: `An Employment Development Activity (EDA) has been started for this client. Enter this in the Compass comments.

• EDA: ${edaLabel}
• Start Date: ${fmtDate(details.start_date)}${detailLines ? `\n${detailLines}` : ''}

${hsidLine(client)}`,
  };
}

// 4b. EDA completed — mark action item as complete in Compass
export function taskEdaCompleted(client, edaLabel, details = {}) {
  const name = `${client.first_name} ${client.last_name}`;
  const detailLines = Object.entries(details)
    .filter(([, v]) => v)
    .map(([k, v]) => `• ${k}: ${v}`)
    .join('\n');
  return {
    task_type: 'eda_completed',
    title: `EDA completed: ${edaLabel} — ${name}`,
    instructions: `An Employment Development Activity (EDA) has been completed. Mark this action item as complete in Compass.

• EDA: ${edaLabel}
• Completion Date: ${fmtDate(details.completion_date)}${detailLines ? `\n${detailLines}` : ''}

${hsidLine(client)}`,
  };
}

// 4c. EDA cancelled — update in Compass
export function taskEdaCancelled(client, edaLabel, reason = '') {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    task_type: 'eda_cancelled',
    title: `EDA cancelled: ${edaLabel} — ${name}`,
    instructions: `An Employment Development Activity (EDA) has been cancelled. Update this action item in Compass.

• EDA: ${edaLabel}
• Reason: ${reason || 'N/A'}

${hsidLine(client)}`,
  };
}

// 5. Employment outcome — enter job details in Compass comments
export function taskEmploymentOutcome(client) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    task_type: 'employment_outcome',
    title: `Client employed: ${name}`,
    instructions: `This client has obtained employment. Enter the job details in the Compass comments.

• Employment Status: ${client.employment_status || 'N/A'}
• Employer: ${client.employer_name || 'N/A'}
• Job Title: ${client.job_title || 'N/A'}
• Start Date: ${fmtDate(client.job_start_date)}
• Wage: ${client.job_wage ? `$${client.job_wage}/hr` : 'N/A'}
• Hours: ${client.job_hours || 'N/A'}

${hsidLine(client)}`,
  };
}

// 6. Barrier resolved — mark as complete in Compass with notes
export function taskBarrierResolved(client, barrierLabel, notes = '') {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    task_type: 'barrier_resolved',
    title: `Barrier resolved: ${barrierLabel} — ${name}`,
    instructions: `A barrier has been resolved for this client. Mark it as complete in Compass.

• Barrier: ${barrierLabel}
• Resolution Notes: ${notes || 'N/A'}

${hsidLine(client)}`,
  };
}

// 7. WD/DEA EDA activities completed — enter completion in Compass
export function taskEdaProgramCompleted(client) {
  const name = `${client.first_name} ${client.last_name}`;
  const program = client.service_type === 'direct_to_employment' ? 'DEA' : 'WD';
  return {
    task_type: 'eda_program_completed',
    title: `${program} EDA activities completed: ${name}`,
    instructions: `The client has completed all ${program} EDA activities. Enter this completion in Compass.

• Program: ${program}
• Completion Date: ${fmtDate(client.completion_date)}

${hsidLine(client)}`,
  };
}

// 8. 90-day follow-up — record up to 5 contact attempts in Compass
export function task90DayFollowup(client) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    task_type: 'followup_90day',
    title: `90-day follow-up: ${name}`,
    instructions: `Record the 90-day follow-up in Compass. Make up to 5 attempts to reach the client, logging each attempt.

• Follow-Up Status: ${client.followup_90day_status || 'N/A'}
• Follow-Up Date: ${fmtDate(client.followup_90day_date)}

If contact is made, record the client's current employment status. If unable to reach after 5 attempts, record as "Unable to Contact".

${hsidLine(client)}`,
  };
}

// 9. Stream switch — entered in Compass
export function taskStreamSwitch(client, fromStream, toStream, reason) {
  const name = `${client.first_name} ${client.last_name}`;
  return {
    task_type: 'stream_switch',
    title: `Program stream switched: ${name}`,
    instructions: `The client's program stream has been switched. Enter this change in Compass.

• From: ${fromStream}
• To: ${toStream}
• Reason: ${reason || 'N/A'}

${hsidLine(client)}`,
  };
}