import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const res = await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'candora-reset-delivery-test@example.com',
      subject: 'Candora employer reset — delivery test',
      body: '<p>This is an automated delivery test for the employer portal password-reset feature.</p>',
      from_name: 'Candora Portal'
    });
    return Response.json({ ok: true, res });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
});