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

// Folder rename mapping: old name → new prefixed name
// _VAULT_   = sensitive, inheritance-broken folders (admin/director only)
// _DEPT_    = department/portal module folders
// _PROGRAM_ = program-specific folders (festivals, community programs)
const RENAME_MAP: Record<string, string> = {
  // Vault folders
  'Board of Directors': '_VAULT_Board',
  'Executive Director Portal': '_VAULT_ED',
  'Financial': '_VAULT_Finance',
  'Human Resources': '_VAULT_HR',
  'Corporate': '_VAULT_Corporate',

  // Dept / portal module folders
  'NexusHR': '_DEPT_HR',
  'HR Management': '_DEPT_HR',
  '_DEPT_NexusHR': '_DEPT_HR',
  'Pathways CM': '_DEPT_Pathways',
  'Grants and Reports': '_DEPT_Grants',
  'Grant  Proposal Manager': '_DEPT_Grants',
  'Grant / Proposal Manager': '_DEPT_Grants',
  'Volunteer Manager': '_DEPT_VolunteerMgr',
  'EventsProjectsPrograms Manager': '_DEPT_EventsMgr',
  'Events/Projects/Programs Manager': '_DEPT_EventsMgr',
  'Marketing & Fundraising': '_DEPT_Marketing',
  'Reports Portal': '_DEPT_Reporting',
  'Food Services': '_DEPT_Food',
  'Community Programs': '_DEPT_Community',
  'Digital Literacy': '_DEPT_DigiLit',
  'ELL': '_DEPT_ELL',
  'ELL Program Manager': '_DEPT_ELL',
  'EmpowerU': '_DEPT_EmpowerU',
  'Resource Centre': '_DEPT_RC',
  'Learning Management System': '_DEPT_LMS',
  'Childminding': '_DEPT_Childminding',
  'Reception': '_DEPT_Reception',
  'PHAC Programs': '_DEPT_PHAC',
  'FRN Programs': '_DEPT_FRN',

  // Program folders
  'Winter Wonderland Festival': '_PROGRAM_WinterWonderland',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

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
      const newName = RENAME_MAP[folder.name];

      // Skip folders not in our rename map
      if (!newName) {
        results.push({ oldName: folder.name, status: 'skipped', reason: 'not in rename map' });
        continue;
      }

      // Already renamed (folder already has the target name)
      if (folder.name === newName) {
        results.push({ oldName: folder.name, status: 'already_renamed', newName });
        continue;
      }

      // PATCH to rename
      const patchRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folder.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      });

      if (patchRes.ok) {
        results.push({ oldName: folder.name, status: 'RENAMED', newName });
      } else {
        const errText = await patchRes.text();
        results.push({ oldName: folder.name, status: 'error', newName, error: errText.substring(0, 300) });
      }
    }

    const renamedCount = results.filter(r => r.status === 'RENAMED').length;
    const alreadyCount = results.filter(r => r.status === 'already_renamed').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return Response.json({
      status: 'success',
      renamed: renamedCount,
      already_renamed: alreadyCount,
      errors: errorCount,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});