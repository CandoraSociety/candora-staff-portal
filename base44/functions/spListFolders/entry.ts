import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = Deno.env.get('AZURE_CLIENT_ID');
    const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET');
    const tenantId = Deno.env.get('AZURE_TENANT_ID');
    if (!clientId || !clientSecret || !tenantId) {
      return Response.json({ error: 'Missing Azure credentials' }, { status: 500 });
    }

    // Get access token
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

    // Site + drive IDs (from msGraphTest)
    const siteId = 'candorasociety.sharepoint.com,f2b11287-ba40-4ff8-8b9e-3f3878083f2c,5320ae2f-1df9-4fd5-9164-f070316e3f53';
    const driveId = 'b!hxKx8kC6-E-Lnj84eAg_LC-uIFP5HdVPkWTwcDFuP1P7ca7jYKZ5Ra_M7gnd5aOy';

    // List top-level children of the Documents library
    const itemsRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!itemsRes.ok) {
      const errText = await itemsRes.text();
      return Response.json({ error: 'Failed to list items', details: errText }, { status: 500 });
    }

    const itemsData = await itemsRes.json();
    const folders = (itemsData.value || [])
      .filter(item => item.folder)
      .map(item => item.name);

    return Response.json({ status: 'success', folderCount: folders.length, folders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});