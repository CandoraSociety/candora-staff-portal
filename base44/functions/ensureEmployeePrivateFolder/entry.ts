import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DRIVE_ID = 'b!hxKx8kC6-E-Lnj84eAg_LC-uIFP5HdVPkWTwcDFuP1P7ca7jYKZ5Ra_M7gnd5aOy';

async function getAccessToken() {
  const clientId = Deno.env.get('AZURE_CLIENT_ID');
  const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET');
  const tenantId = Deno.env.get('AZURE_TENANT_ID');

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const tokenBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to get access token: ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    // Support both direct calls { email } and entity-automation calls { data: { email } }
    const email = body.email || body.data?.email;

    if (!email) {
      return Response.json({ error: 'email is required' }, { status: 400 });
    }

    const folderName = `_PRIVATE_${email}`;
    const folderPath = `/${folderName}`;
    const accessToken = await getAccessToken();

    // Check if folder already exists
    const getRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${folderPath}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (getRes.ok) {
      const existing = await getRes.json();
      return Response.json({
        status: 'exists',
        folder: { id: existing.id, name: existing.name, webUrl: existing.webUrl }
      });
    }

    // Create folder
    const createRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root/children`, {
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
      // Race condition — another request may have created it. Try fetching again.
      const retryRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${folderPath}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (retryRes.ok) {
        const retryData = await retryRes.json();
        return Response.json({
          status: 'exists',
          folder: { id: retryData.id, name: retryData.name, webUrl: retryData.webUrl }
        });
      }
      const errText = await createRes.text();
      return Response.json({ error: 'Failed to create folder', details: errText }, { status: 500 });
    }

    const folderData = await createRes.json();

    // Break permission inheritance (retainInheritedPermissions: false) and grant
    // access to: (1) the folder owner, and (2) the app owner (stored in OrgSettings.owner_email).
    const recipients = [{ email }];
    const settings = await base44.asServiceRole.entities.OrgSettings.filter({});
    if (settings.length > 0 && settings[0].owner_email && settings[0].owner_email !== email) {
      recipients.push({ email: settings[0].owner_email });
    }

    const inviteRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folderData.id}/invite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipients: recipients,
        roles: ['write'],
        requireSignIn: true,
        sendInvitation: false,
        retainInheritedPermissions: false
      })
    });

    if (!inviteRes.ok) {
      const errText = await inviteRes.text();
      console.log(`Warning: could not set folder permissions for ${email}: ${errText}`);
    }

    return Response.json({
      status: 'created',
      folder: { id: folderData.id, name: folderData.name, webUrl: folderData.webUrl }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});