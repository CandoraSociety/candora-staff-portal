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
      return Response.json({ error: 'Missing Azure credentials. Set AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET in app secrets.' }, { status: 500 });
    }

    // Step 1: Get an access token using the client credentials flow
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return Response.json({ error: 'Failed to get access token', details: errText }, { status: 500 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Step 2: Verify the token works by calling Microsoft Graph /sites endpoint
    // Look up the Candora SharePoint site by hostname + site path
    const siteRes = await fetch('https://graph.microsoft.com/v1.0/sites/candorasociety.sharepoint.com:/sites/CandoraStaffPortal', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!siteRes.ok) {
      const errText = await siteRes.text();
      return Response.json({ 
        error: 'Token obtained but Graph API call failed', 
        status: siteRes.status,
        details: errText 
      }, { status: 500 });
    }

    const siteData = await siteRes.json();

    // Step 3: List the document libraries (drives) on this site
    const drivesRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteData.id}/drives`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    let drives = [];
    if (drivesRes.ok) {
      const drivesData = await drivesRes.json();
      drives = (drivesData.value || []).map(d => ({
        id: d.id,
        name: d.name,
        driveType: d.driveType,
        webUrl: d.webUrl
      }));
    }

    return Response.json({
      status: 'success',
      message: 'Microsoft Graph connection is working!',
      site: {
        id: siteData.id,
        name: siteData.name,
        displayName: siteData.displayName,
        webUrl: siteData.webUrl
      },
      drives,
      tokenExpiresIn: tokenData.expires_in
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});