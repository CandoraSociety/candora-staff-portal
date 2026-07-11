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

// Vault folder definitions — vaultType controls which access level maps to it
// Recipients are now built dynamically from AccessPermission + hardcoded roles
const VAULT_FOLDER_TYPES: Record<string, string> = {
  '_VAULT_ED': 'ed_only',
  '_VAULT_Finance': 'finance',
  '_VAULT_HR': 'hr',
  '_VAULT_Corporate': 'corporate',
  '_VAULT_Board': 'board',
  // Legacy names
  'Executive Director Portal': 'ed_only',
  'Financial': 'finance',
  'Human Resources': 'hr',
  'Corporate': 'corporate',
  'Board of Directors': 'board',
};

// Maps vaultType to the file_access level that grants access (from Access Broker)
const VAULT_TYPE_TO_FILE_LEVEL: Record<string, string> = {
  finance: 'finance',
  hr: 'corporate',
  corporate: 'corporate',
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

    // Fetch all file_access permissions from AccessPermission entity
    const fileAccessPerms = await base44.asServiceRole.entities.AccessPermission.filter({
      target_type: 'file_access',
      permission: 'allow',
      is_active: true,
    });

    // Group file_access permission emails by level
    const fileLevelEmails: Record<string, Set<string>> = {};
    for (const perm of fileAccessPerms) {
      const level = perm.target_id;
      const email = perm.scope_value?.toLowerCase();
      if (!level || !email) continue;
      if (!fileLevelEmails[level]) fileLevelEmails[level] = new Set();
      fileLevelEmails[level].add(email);
    }

    // Find Executive Director employee (always included in all vaults)
    const edEmployees = await base44.asServiceRole.entities.Employee.filter({ org_tier: 'executive_director' });
    const edEmail = edEmployees.find(e => e.email)?.email?.toLowerCase();

    // Find Finance Director employee (always included in Finance vault — hardcoded)
    const directorEmployees = await base44.asServiceRole.entities.Employee.filter({ org_tier: 'director' });
    const financeDirectorEmail = directorEmployees.find(e => e.department === 'Finance')?.email?.toLowerCase();

    const results = [];

    for (const folder of folders) {
      const vaultType = VAULT_FOLDER_TYPES[folder.name];
      if (!vaultType) {
        results.push({ name: folder.name, action: 'skipped', reason: 'not a vault folder' });
        continue;
      }

      // Build recipient list based on vault type
      const recipientEmails = new Set<string>();
      recipientEmails.add(ownerEmail.toLowerCase());

      if (vaultType === 'ed_only' || vaultType === 'board') {
        // ED-only and Board vaults: ONLY site owner + Executive Director, nobody else
        if (edEmail) recipientEmails.add(edEmail);
      } else {
        // Finance/HR/Corporate vaults: site owner + ED + hardcoded Finance Director (finance only) + AccessPermission grants
        if (edEmail) recipientEmails.add(edEmail);

        if (vaultType === 'finance' && financeDirectorEmail) {
          recipientEmails.add(financeDirectorEmail);
        }

        // Add anyone granted the corresponding file_access level via Access Broker
        const fileLevel = VAULT_TYPE_TO_FILE_LEVEL[vaultType];
        if (fileLevel && fileLevelEmails[fileLevel]) {
          for (const email of fileLevelEmails[fileLevel]) {
            recipientEmails.add(email);
          }
        }
      }

      const recipients = [...recipientEmails].map(email => ({ email }));

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
          vaultType: vaultType,
          granted_to: recipients.map(r => r.email),
          inheritance_broken: true
        });
      } else {
        const errText = await inviteRes.text();
        results.push({
          name: folder.name,
          action: 'ERROR',
          vaultType: vaultType,
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