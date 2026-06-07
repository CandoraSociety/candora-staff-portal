import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { type, volunteerName, volunteerEmail, details } = await req.json();

    const coordinatorEmail = "Yasmin.escobar@candorasociety.com";

    let subject, body;
    if (type === 'new_registration') {
      subject = `New Volunteer Registration: ${volunteerName}`;
      body = `<h2>New Volunteer Registration Request</h2>
        <p><strong>Name:</strong> ${volunteerName}</p>
        <p><strong>Email:</strong> ${volunteerEmail || 'Not provided'}</p>
        <p><strong>Details:</strong></p>
        <p>${details || 'No additional details provided.'}</p>
        <p>Please review this registration in the Volunteer Management App.</p>`;
    } else if (type === 'profile_change') {
      subject = `Profile Change Request: ${volunteerName}`;
      body = `<h2>Volunteer Profile Change Request</h2>
        <p><strong>Volunteer:</strong> ${volunteerName}</p>
        <p><strong>Changes Requested:</strong></p>
        <p>${details || 'See admin panel for details.'}</p>`;
    } else {
      subject = `Volunteer Notification: ${volunteerName}`;
      body = `<p>${details}</p>`;
    }

    await base44.asServiceRole.integrations.Core.SendEmail({ to: coordinatorEmail, subject, body });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});