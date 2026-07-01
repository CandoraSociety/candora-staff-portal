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

async function getOwnerEmail(base44, fallbackEmail) {
  const settings = await base44.asServiceRole.entities.OrgSettings.filter({});
  if (settings.length > 0 && settings[0].owner_email) {
    return settings[0].owner_email;
  }
  return fallbackEmail;
}

async function storeOwnerEmail(base44, email) {
  const settings = await base44.asServiceRole.entities.OrgSettings.filter({});
  if (settings.length > 0) {
    await base44.asServiceRole.entities.OrgSettings.update(settings[0].id, { owner_email: email });
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const ownerEmail = body.ownerEmail || user.email;

    if (!ownerEmail) {
      return Response.json({ error: 'Could not determine owner email' }, { status: 400 });
    }

    // Persist owner email in OrgSettings for future use by folder creation functions
    await storeOwnerEmail(base44, ownerEmail);

    const accessToken = await getAccessToken();

    // List all root-level folders
    const listRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root/children?$select=name,folder,id`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!listRes.ok) {
      const errText = await listRes.text();
      return Response.json({ error: 'Failed to list folders', details: errText }, { status: 500 });
    }

    const listData = await listRes.json();
    const folders = listData.value.filter(item => item.folder);

    const results = [];

    for (const folder of folders) {
      const isPrivate = folder.name.startsWith('_PRIVATE_');
      const folderOwner = isPrivate ? folder.name.replace('_PRIVATE_', '') : null;
      const isMemoryCtx = folderOwner === 'Memory_Context';

      // Only process private folders — shared folders stay as-is until department permissions are built
      if (!isPrivate) {
        results.push({ name: folder.name, action: 'skipped', reason: 'shared folder — department permissions TBD' });
        continue;
      }

      // Build recipient list: always include app owner; include folder owner if it's an employee folder
      const recipients = [{ email: ownerEmail }];
      if (folderOwner && !isMemoryCtx) {
        recipients.push({ email: folderOwner });
      }

      // Break inheritance (retainInheritedPermissions: false) and grant only the recipients
      const inviteRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folder.id}/invite`, {
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

      if (inviteRes.ok) {
        results.push({
          name: folder.name,
          action: 'permissions_fixed',
          granted_to: recipients.map(r => r.email)
        });
      } else {
        const errText = await inviteRes.text();
        results.push({ name: folder.name, action: 'error', error: errText.substring(0, 200) });
      }
    }

    return Response.json({
      success: true,
      owner_email: ownerEmail,
      stored_in_orgsettings: true,
      folders_processed: results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});