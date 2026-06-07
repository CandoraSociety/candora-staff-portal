import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { volunteer_id } = await req.json();

    const volunteers = await base44.asServiceRole.entities.Volunteer.filter({ id: volunteer_id });
    const volunteer = volunteers[0];
    if (!volunteer) {
      return Response.json({ error: 'Volunteer not found' }, { status: 404 });
    }

    const onboardingDocs = await base44.asServiceRole.entities.OnboardingDocument.filter({ is_active: true });

    const docLinks = onboardingDocs.map(doc => 
      `<li><a href="${doc.file_url}" target="_blank">${doc.title}</a>${doc.description ? ` — ${doc.description}` : ''}</li>`
    ).join('');

    const body = `
      <h2>Welcome to The Candora Society, ${volunteer.first_name}!</h2>
      <p>We are thrilled to have you join our volunteer community. Your support makes a real difference in our programs and in the lives of the people we serve.</p>
      ${onboardingDocs.length > 0 ? `
        <h3>Please review the following onboarding documents:</h3>
        <ul>${docLinks}</ul>
      ` : ''}
      <p>If you have any questions, please don't hesitate to reach out to us.</p>
      <p>With gratitude,<br/>The Candora Society Volunteer Team</p>
    `;

    if (volunteer.email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: volunteer.email,
        subject: `Welcome to The Candora Society, ${volunteer.first_name}!`,
        body,
        from_name: 'The Candora Society'
      });
    }

    // CC coordinator
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'yazmin.escobar@candorasociety.com',
      subject: `New Volunteer Activated: ${volunteer.first_name} ${volunteer.last_name}`,
      body: `<p>A new volunteer has been activated and sent a welcome email:</p>
        <p><strong>Name:</strong> ${volunteer.first_name} ${volunteer.last_name}</p>
        <p><strong>Email:</strong> ${volunteer.email || 'None'}</p>
        <p><strong>Type:</strong> ${volunteer.volunteer_type}</p>`,
      from_name: 'VolunteerTrack'
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});