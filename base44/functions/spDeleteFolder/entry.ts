import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DRIVE_ID = 'b!hxKx8kC6-E-Lnj84eAg_LC-uIFP5HdVPkWTwcDFuP1P7ca7jYKZ5Ra_M7gnd5aOy';

async function getAccessToken() {
  const clientId = Deno.env.get('AZURE_CLIENT_ID');
  const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET');
  const tenantId = Deno.env.get('AZURE_TENANT_ID');

  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    })
  });
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { folderPath } = body;

    if (!folderPath) {
      return Response.json({ error: 'folderPath is required' }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const delRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${folderPath}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!delRes.ok && delRes.status !== 404) {
      const errText = await delRes.text();
      return Response.json({ error: 'Failed to delete folder', details: errText }, { status: 500 });
    }

    return Response.json({ status: 'deleted', folderPath });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});