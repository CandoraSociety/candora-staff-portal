import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { employee_id } = await req.json();

    const employees = await base44.asServiceRole.entities.Employee.filter({ id: employee_id });
    const employee = employees[0];
    if (!employee) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    const appUrl = 'https://app--candora--staffportal.base44.app';
    const loginUrl = `${appUrl}/login`;

    const body = `
      <h2>Welcome to the Candora Staff Portal, ${employee.first_name}!</h2>
      <p>Your staff account has been created. You can log in to the Candora Staff Portal using the link below:</p>
      <p style="margin: 24px 0;">
        <a href="${loginUrl}" style="background-color:#f5c116;color:#0f1f6b;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
          Log In to Staff Portal
        </a>
      </p>
      <p>Or copy this link into your browser:<br/><a href="${loginUrl}">${loginUrl}</a></p>
      <p>You should have received a separate email from Base44 to set your password. Once your password is set, use the button above to access the portal.</p>
      <p>If you have any questions, please reach out to your manager or HR.</p>
      <p>Welcome aboard,<br/>The Candora Society Team</p>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: employee.email,
      subject: `Welcome to the Candora Staff Portal, ${employee.first_name}!`,
      body,
      from_name: 'The Candora Society'
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});