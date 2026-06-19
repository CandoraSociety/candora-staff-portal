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
    const registerUrl = `${appUrl}/register`;

    const body = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background-color:#0f1f6b;padding:24px;text-align:center;">
          <h1 style="color:#f5c116;margin:0;font-size:24px;">Candora Society</h1>
          <p style="color:#ffffff;margin:8px 0 0;">Staff Portal</p>
        </div>
        <div style="padding:32px;background:#ffffff;border:1px solid #e5e7eb;">
          <h2 style="color:#0f1f6b;">Welcome, ${employee.first_name}!</h2>
          <p style="color:#374151;line-height:1.6;">You've been added to the <strong>Candora Staff Portal</strong>. To set up your account, simply click the button below and register using <strong>this email address (${employee.email})</strong>.</p>
          <p style="margin:32px 0;text-align:center;">
            <a href="${registerUrl}" style="background-color:#f5c116;color:#0f1f6b;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
              Set Up My Account →
            </a>
          </p>
          <p style="color:#6b7280;font-size:14px;">Or copy this link into your browser:<br/><a href="${registerUrl}" style="color:#0f1f6b;">${registerUrl}</a></p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <p style="color:#6b7280;font-size:13px;"><strong>Important:</strong> Use <strong>${employee.email}</strong> when registering — this is the email your account is linked to.</p>
          <p style="color:#374151;">If you have any questions, contact your manager or HR.</p>
          <p style="color:#374151;">Welcome aboard,<br/><strong>The Candora Society Team</strong></p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">Candora Society Staff Portal · Confidential</p>
        </div>
      </div>
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