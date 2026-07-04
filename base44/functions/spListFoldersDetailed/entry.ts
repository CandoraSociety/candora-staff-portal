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

    const accessToken = await getAccessToken();

    // List all top-level children of the Documents library
    const itemsRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root/children?$select=name,folder,lastModifiedDateTime,size,webUrl`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!itemsRes.ok) {
      const errText = await itemsRes.text();
      return Response.json({ error: 'Failed to list folders', details: errText }, { status: 500 });
    }

    const itemsData = await itemsRes.json();
    const folders = (itemsData.value || [])
      .filter(item => item.folder)
      .map(item => ({
        name: item.name,
        itemCount: item.folder?.childCount || 0,
        lastModified: item.lastModifiedDateTime,
        size: item.size || 0,
        webUrl: item.webUrl
      }))
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    return Response.json({ status: 'success', folderCount: folders.length, folders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});