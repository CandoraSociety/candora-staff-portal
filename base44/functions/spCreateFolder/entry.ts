import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const folderName = body.folder_name;
    if (!folderName) return Response.json({ error: 'folder_name is required' }, { status: 400 });

    const clientId = Deno.env.get('AZURE_CLIENT_ID');
    const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET');
    const tenantId = Deno.env.get('AZURE_TENANT_ID');
    if (!clientId || !clientSecret || !tenantId) {
      return Response.json({ error: 'Missing Azure credentials' }, { status: 500 });
    }

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
    const accessToken = tokenData.access_token;

    const driveId = 'b!hxKx8kC6-E-Lnj84eAg_LC-uIFP5HdVPkWTwcDFuP1P7ca7jYKZ5Ra_M7gnd5aOy';

    // Create folder at root of Documents library
    const createRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'fail'
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return Response.json({ error: 'Failed to create folder', status: createRes.status, details: errText }, { status: 500 });
    }

    const folderData = await createRes.json();
    return Response.json({
      status: 'success',
      folder: {
        id: folderData.id,
        name: folderData.name,
        webUrl: folderData.webUrl
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});