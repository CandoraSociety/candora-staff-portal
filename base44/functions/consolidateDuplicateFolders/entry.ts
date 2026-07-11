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

// Duplicates to delete — each entry: { delete: "folder name", keep: "canonical folder name" }
const DUPLICATES = [
  { delete: 'Candora Board', keep: 'Board of Directors' },
  { delete: 'Executive Director', keep: 'Executive Director Portal' },
  { delete: 'HR Management', keep: 'Human Resources' },
  { delete: 'Marketing', keep: 'Marketing & Fundraising' },
  { delete: 'Pathways', keep: 'Pathways CM' },
  { delete: 'PHAC Family Programs', keep: 'PHAC Programs' },
  { delete: 'FRN Family Programs', keep: 'FRN Programs' },
  { delete: 'ELL Program Manager', keep: 'ELL' },
  { delete: 'Events', keep: 'EventsProjectsPrograms Manager' },
  { delete: 'Grant  Proposal Manager', keep: 'Grants and Reports' },
  { delete: 'Resource Centre and Resource Workers', keep: 'Resource Centre' },
  { delete: 'Volunteer', keep: 'Volunteer Manager' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const accessToken = await getAccessToken();

    // List all root-level folders once, build a name→{id, childCount} map
    const listRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root/children?$select=name,folder,id`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!listRes.ok) {
      const errText = await listRes.text();
      return Response.json({ error: 'Failed to list folders', details: errText }, { status: 500 });
    }
    const listData = await listRes.json();
    const folderMap = {};
    for (const item of (listData.value || [])) {
      if (item.folder) {
        folderMap[item.name] = { id: item.id, childCount: item.folder.childCount ?? 0 };
      }
    }

    const results = [];

    for (const dup of DUPLICATES) {
      const dupInfo = folderMap[dup.delete];
      const keepInfo = folderMap[dup.keep];

      if (!dupInfo) {
        results.push({ deleted: dup.delete, status: 'already gone' });
        continue;
      }

      if (!keepInfo) {
        results.push({ deleted: dup.delete, status: 'SKIPPED — canonical folder missing', keep: dup.keep });
        continue;
      }

      // SAFETY: Only delete if the folder is empty (0 children)
      if (dupInfo.childCount > 0) {
        results.push({
          deleted: dup.delete,
          status: 'SKIPPED — folder not empty',
          childCount: dupInfo.childCount,
          keep: dup.keep,
          reason: `Has ${dupInfo.childCount} items — manual review needed before merging`
        });
        continue;
      }

      // Delete the empty duplicate by ID
      const delRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${dupInfo.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (delRes.ok || delRes.status === 404) {
        results.push({ deleted: dup.delete, status: 'DELETED', keep: dup.keep, childCount: 0 });
      } else {
        const errText = await delRes.text();
        results.push({ deleted: dup.delete, status: 'error', error: errText.substring(0, 200) });
      }
    }

    const deletedCount = results.filter(r => r.status === 'DELETED').length;
    const skippedCount = results.filter(r => r.status?.includes('SKIPPED')).length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return Response.json({
      status: 'success',
      deleted: deletedCount,
      skipped: skippedCount,
      errors: errorCount,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});