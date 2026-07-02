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

    // Teams scopes — these MUST all have admin consent in Azure
    const scopes = [
      'openid',
      'profile',
      'offline_access',
      'User.Read',
      'Chat.ReadWrite',
      'ChannelMessage.Send',
      'Team.ReadBasic.All',
      'Channel.ReadBasic.All',
      'OnlineMeetings.ReadWrite',
    ].join(' ');

    const encodedScopes = encodeURIComponent(scopes);

    const adminConsentUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodedScopes}&prompt=admin_consent`;

    return Response.json({
      clientId,
      tenantId,
      redirectUri,
      requiredScopes: scopes.split(' '),
      adminConsentUrl,
      instructions: 'Have your IT admin open the adminConsentUrl in a browser and sign in with an admin account. This grants admin consent for ALL Teams scopes at once. After that, users can connect without seeing the "need admin approval" error.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});