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

    // Construct the admin consent URL — a Global Admin must visit this once
    const adminConsentUrl = `https://login.microsoftonline.com/${tenantId}/adminconsent?client_id=${clientId}&redirect_uri=https://api.base44.com/v2/connectors/app-user/callback`;

    return Response.json({
      adminConsentUrl,
      clientId,
      tenantId,
      instructions: 'A Global Admin must visit the adminConsentUrl and click Accept. This grants consent for all users in the tenant.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});