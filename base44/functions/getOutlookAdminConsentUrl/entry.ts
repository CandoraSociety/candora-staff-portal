import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = Deno.env.get('AZURE_CLIENT_ID');
    const tenantId = Deno.env.get('AZURE_TENANT_ID');

    if (!clientId || !tenantId) {
      return Response.json({ error: 'Azure credentials not configured' }, { status: 500 });
    }

    // This must match a Redirect URI registered in Azure → App registrations → Authentication
    const redirectUri = 'https://auth.base44.io/api/v1/integrations/oauth/callback';

    const adminConsentUrl = `https://login.microsoftonline.com/${tenantId}/adminconsent?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return Response.json({
      clientId,
      tenantId,
      redirectUri,
      adminConsentUrl,
      instructions: 'Open adminConsentUrl in a browser and sign in with a Global Admin account. After consent is granted, individual users can connect their Outlook without seeing "need admin approval".',
      checklist: {
        step1: `In Azure → App registrations → ${clientId} → Authentication: ensure Redirect URI is exactly: ${redirectUri}`,
        step2: 'In Azure → API permissions: ensure all required Microsoft Graph delegated permissions are added (Mail.Read, Mail.ReadWrite, Mail.Send, Calendars.Read, Calendars.ReadWrite, offline_access, User.Read)',
        step3: 'After steps 1-2, open the adminConsentUrl and sign in with a Global Admin account to grant tenant-wide consent',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});