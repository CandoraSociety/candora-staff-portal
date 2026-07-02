import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DRIVE_ID = 'b!hxKx8kC6-E-Lnj84eAg_LC-uIFP5HdVPkWTwcDFuP1P7ca7jYKZ5Ra_M7gnd5aOy';
const FOLDER_NAME = '_ARCHIVES_Candora_History';
const FOLDER_PATH = `/${FOLDER_NAME}`;

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
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = await getAccessToken();

    // Check if folder already exists
    const getRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${FOLDER_PATH}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (getRes.ok) {
      const existing = await getRes.json();
      return Response.json({ id: existing.id, name: existing.name, path: FOLDER_PATH, exists: true });
    }

    // Create the folder
    const createRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root/children`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'fail'
      })
    });

    if (!createRes.ok) {
      // Race condition — another request may have created it
      const retryRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${FOLDER_PATH}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (retryRes.ok) {
        const retryData = await retryRes.json();
        return Response.json({ id: retryData.id, name: retryData.name, path: FOLDER_PATH, exists: true });
      }
      const errText = await createRes.text();
      throw new Error(`Failed to create archives folder: ${errText}`);
    }

    const folderData = await createRes.json();

    // Break inheritance and grant access to calling user + app owner
    const recipients = [{ email: user.email }];
    try {
      const settings = await base44.asServiceRole.entities.OrgSettings.filter({});
      if (settings.length > 0 && settings[0].owner_email && settings[0].owner_email !== user.email) {
        recipients.push({ email: settings[0].owner_email });
      }
    } catch (e) {
      // Non-critical
    }

    const inviteRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folderData.id}/invite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipients,
        roles: ['write'],
        requireSignIn: true,
        sendInvitation: false,
        retainInheritedPermissions: false
      })
    });

    if (!inviteRes.ok) {
      console.log(`Warning: could not set archives folder permissions: ${await inviteRes.text()}`);
    }

    return Response.json({ id: folderData.id, name: folderData.name, path: FOLDER_PATH, exists: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});