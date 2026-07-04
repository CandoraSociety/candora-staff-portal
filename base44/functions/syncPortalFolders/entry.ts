import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'executive_director') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    // 1. Get all enabled, non-external PortalCards with internal URLs
    const cards = await base44.asServiceRole.entities.PortalCard.list();
    const portals = cards
      .filter(c => c.is_enabled && c.url && !c.is_external)
      .map(c => ({
        name: c.name,
        moduleId: c.url.replace(/^\//, '').split('/')[0],
      }))
      .filter(p => p.moduleId && p.moduleId !== 'admin')
      .filter((p, i, arr) => arr.findIndex(x => x.moduleId === p.moduleId) === i);

    // 2. Get Azure token
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

    // 3. List existing top-level folders
    const itemsRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!itemsRes.ok) {
      const errText = await itemsRes.text();
      return Response.json({ error: 'Failed to list SharePoint folders', details: errText }, { status: 500 });
    }
    const itemsData = await itemsRes.json();
    const existingFolders = (itemsData.value || [])
      .filter(item => item.folder)
      .map(item => item.name.toLowerCase());

    // 4. Create missing folders
    const invalidChars = /["#%*:<>?/\\{|}]/g;
    const results = [];

    for (const portal of portals) {
      const folderName = portal.name.replace(invalidChars, '').trim();
      if (!folderName) {
        results.push({ portal: portal.name, folder: '(empty)', status: 'skipped' });
        continue;
      }

      if (existingFolders.includes(folderName.toLowerCase())) {
        results.push({ portal: portal.name, folder: folderName, status: 'exists' });
      } else {
        try {
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
          if (createRes.ok) {
            const folderData = await createRes.json();
            results.push({ portal: portal.name, folder: folderName, status: 'created', webUrl: folderData.webUrl });
          } else if (createRes.status === 409) {
            results.push({ portal: portal.name, folder: folderName, status: 'exists' });
          } else {
            const errText = await createRes.text();
            results.push({ portal: portal.name, folder: folderName, status: 'error', error: errText });
          }
        } catch (err) {
          results.push({ portal: portal.name, folder: folderName, status: 'error', error: err.message });
        }
      }
    }

    return Response.json({
      status: 'success',
      totalPortals: portals.length,
      created: results.filter(r => r.status === 'created').length,
      existing: results.filter(r => r.status === 'exists').length,
      errors: results.filter(r => r.status === 'error'),
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});