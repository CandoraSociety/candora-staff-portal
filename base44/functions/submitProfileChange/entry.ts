import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { volunteer_id, changes, volunteer_email } = await req.json();

    if (!volunteer_id || !changes) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current volunteer data
    const volunteer = await base44.entities.Volunteer.get(volunteer_id);
    if (!volunteer) {
      return Response.json({ error: 'Volunteer not found' }, { status: 404 });
    }

    // Build change summary
    const changedFields = Object.keys(changes);
    const changeSummary = changedFields.map(field => {
      const oldValue = volunteer[field];
      const newValue = changes[field];
      return `${field}: ${oldValue} → ${newValue}`;
    }).join(', ');

    // Create profile change request
    const changeRequest = await base44.entities.VolunteerProfileChange.create({
      volunteer_id: volunteer.id,
      volunteer_name: `${volunteer.first_name} ${volunteer.last_name}`,
      volunteer_email: volunteer.email,
      changes_requested: changes,
      change_summary: changeSummary,
      status: 'pending',
      submitted_date: new Date().toISOString(),
    });

    // Notify coordinator
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'volunteer.coordinator@candorasociety.com',
      subject: `Profile Change Request - ${volunteer.first_name} ${volunteer.last_name}`,
      body: `
        <h2>Profile Change Request</h2>
        <p><strong>Volunteer:</strong> ${volunteer.first_name} ${volunteer.last_name}</p>
        <p><strong>Email:</strong> ${volunteer.email}</p>
        <p><strong>Changes Requested:</strong></p>
        <ul>
          ${changedFields.map(field => `
            <li>
              <strong>${field}:</strong><br>
              From: ${volunteer[field] || 'N/A'}<br>
              To: ${changes[field]}
            </li>
          `).join('')}
        </ul>
        <p>Please review and approve/reject this change in the Volunteer Manager portal.</p>
      `,
    });

    return Response.json({ 
      success: true, 
      message: 'Profile changes submitted for approval',
      request_id: changeRequest.id 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});