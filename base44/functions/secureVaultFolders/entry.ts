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

// Sensitive folder mapping: folder name → list of authorized email recipients
// "inheritance": false means we break inheritance and ONLY these people get access
// Uses _VAULT_ prefixed names (post-rename). Old names kept for backward compat.
const VAULT_FOLDERS: Record<string, { recipients: string[]; vaultType: string }> = {
  // ED-only
  '_VAULT_ED': { recipients: [], vaultType: 'ed_only' },

  // Finance — ED + Finance Director (not yet set up, so ED only for now)
  '_VAULT_Finance': { recipients: [], vaultType: 'finance' },

  // HR — ED + Carla (HR admin)
  '_VAULT_HR': { recipients: ['carla.bosse@candorasociety.com'], vaultType: 'hr' },

  // Corporate — ED + Directors
  '_VAULT_Corporate': { recipients: [], vaultType: 'corporate' },

  // Board — ED only for now (board members access via separate flow)
  '_VAULT_Board': { recipients: [], vaultType: 'board' },

  // Legacy names (pre-rename) — still recognized so securing works during migration
  'Executive Director Portal': { recipients: [], vaultType: 'ed_only' },
  'Financial': { recipients: [], vaultType: 'finance' },
  'Human Resources': { recipients: ['carla.bosse@candorasociety.com'], vaultType: 'hr' },
  'Corporate': { recipients: [], vaultType: 'corporate' },
  'Board of Directors': { recipients: [], vaultType: 'board' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    // Get app owner email from OrgSettings
    const settings = await base44.asServiceRole.entities.OrgSettings.filter({});
    const ownerEmail = settings.length > 0 ? settings[0].owner_email : user.email;
    if (!ownerEmail) {
      return Response.json({ error: 'Could not determine owner email — set it in OrgSettings' }, { status: 400 });
    }

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
    const folders = (listData.value || []).filter(item => item.folder);

    const results = [];

    for (const folder of folders) {
      const vaultConfig = VAULT_FOLDERS[folder.name];
      if (!vaultConfig) {
        results.push({ name: folder.name, action: 'skipped', reason: 'not a vault folder' });
        continue;
      }

      // Build recipient list: always include app owner, plus any additional recipients
      const recipients = [{ email: ownerEmail }];
      for (const email of vaultConfig.recipients) {
        if (email !== ownerEmail) {
          recipients.push({ email });
        }
      }

      // Break inheritance (retainInheritedPermissions: false) and grant ONLY the recipients
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
          action: 'SECURED',
          vaultType: vaultConfig.vaultType,
          granted_to: recipients.map(r => r.email),
          inheritance_broken: true
        });
      } else {
        const errText = await inviteRes.text();
        results.push({
          name: folder.name,
          action: 'ERROR',
          vaultType: vaultConfig.vaultType,
          error: errText.substring(0, 300)
        });
      }
    }

    const securedCount = results.filter(r => r.action === 'SECURED').length;
    const errorCount = results.filter(r => r.action === 'ERROR').length;

    return Response.json({
      status: 'success',
      owner_email: ownerEmail,
      secured: securedCount,
      errors: errorCount,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});