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

    const redirectUri = 'https://api.base44.com/v2/connectors/app-user/callback';

    // All scopes the Outlook integration needs — these MUST all have admin consent in Azure
    const scopes = [
      'openid',
      'profile',
      'offline_access',
      'User.Read',
      'Mail.Read',
      'Mail.ReadWrite',
      'Mail.Send',
      'Calendars.Read',
      'Calendars.ReadWrite',
    ].join(' ');

    const encodedScopes = encodeURIComponent(scopes);

    // Admin consent URL using v2 authorize endpoint with prompt=admin_consent — this explicitly
    // lists ALL scopes so the admin sees and consents to every permission at once.
    const adminConsentUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodedScopes}&prompt=admin_consent`;

    // User consent URL with explicit scopes — for testing individual sign-in
    const userConsentUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodedScopes}&prompt=select_account`;

    return Response.json({
      clientId,
      tenantId,
      redirectUri,
      requiredScopes: scopes.split(' '),
      adminConsentUrl,
      userConsentUrl,
      checklist: {
        step1: `In Azure → App registrations → ${clientId} → Authentication: ensure Redirect URI is exactly: ${redirectUri}`,
        step2: 'In Azure → API permissions: ensure ALL of these Microsoft Graph delegated permissions are added: ' + scopes,
        step3: 'In Azure → API permissions: click "Grant admin consent for [tenant]" — a green checkmark must appear next to EVERY permission',
        step4: 'After steps 1-3, try the userConsentUrl — if it still shows "need admin approval", one of the scopes is missing admin consent',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});