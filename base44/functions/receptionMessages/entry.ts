import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Front desk messages. A receptionist picks a staff member and leaves a
// timestamped note — someone came to see them, someone asked a question that
// needs following up. It lands in that person's dashboard notifications.
//
// Public on purpose: the external Reception kiosk runs without a staff login.
// The staff list returns names only — the recipient's work email is resolved
// here, server-side, so no addresses leave the building.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'staff';

    if (action === 'staff') {
      const employees = await base44.asServiceRole.entities.Employee.filter({ is_deleted: false });
      const staff = (employees || [])
        .filter((e) => e.email && ['active', 'probation', 'occasional'].includes(e.status))
        .map((e) => ({
          id: e.id,
          name: `${e.first_name || ''} ${e.last_name || ''}`.trim(),
          position: e.position || '',
          department: e.department || '',
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return Response.json({ staff });
    }

    if (action === 'send') {
      const employeeId = body?.employee_id;
      const text = String(body?.message || '').trim();
      const fromName = String(body?.from_name || '').trim() || 'Front desk';

      if (!employeeId) return Response.json({ error: 'Choose a staff member.' }, { status: 400 });
      if (!text) return Response.json({ error: 'Write a message before sending.' }, { status: 400 });
      if (text.length > 2000) return Response.json({ error: 'That message is too long — keep it under 2000 characters.' }, { status: 400 });

      const employee = await base44.asServiceRole.entities.Employee
        .get(employeeId)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!employee) return Response.json({ error: 'That staff member could not be found.' }, { status: 404 });
      if (!employee.email) return Response.json({ error: 'That staff member has no work email on file.' }, { status: 400 });

      const recipient = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
      const note = await base44.asServiceRole.entities.DashboardNotification.create({
        recipient_email: employee.email,
        recipient_name: recipient,
        kind: 'reception_message',
        title: 'Message from the front desk',
        message: text,
        from_name: fromName,
        is_read: false,
      });

      return Response.json({ ok: true, id: note.id, recipient });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}