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

// Folder access rules — determines which SharePoint root folders a user can see
const VAULT_FOLDER_ACCESS = {
  'Board of Directors': ['admin'],
  'Candora Board': ['admin'],
  'Corporate': ['admin'],
  'Executive Director': ['admin'],
  'Executive Director Portal': ['admin'],
  'Financial': ['admin'],
  'Human Resources': ['admin'],
  'HR Management': ['admin'],
};

// Folder → module mapping. If a folder is tied to a portal module,
// the user must have access to that module to see the folder.
const FOLDER_TO_MODULE = {
  'NexusHR': 'nexushr',
  'Pathways CM': 'pathways',
  'Grants and Reports': 'grants',
  'Volunteer Manager': 'volunteermgr',
  'EventsProjectsPrograms Manager': 'eventsmgr',
  'Marketing & Fundraising': 'marketing',
  'Reports Portal': 'reporting',
  'Food Services': 'food',
  'Executive Director Portal': 'ed',
  'Community Programs': 'community',
  'Digital Literacy': 'digilit',
  'ELL': 'ell',
  'EmpowerU': 'empoweru',
  'Resource Centre': 'rc',
  'Winter Wonderland Festival': 'winter-wonderland',
  'Childminding': 'childminding',
  'Reception': 'reception',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.role === 'admin';

    // Fetch user's file access permissions
    const filePerms = await base44.entities.AccessPermission.filter({
      target_type: 'file_access',
      scope_type: 'individual',
      scope_value: user.email,
      permission: 'allow',
      is_active: true,
    });
    const grantedFileLevels = filePerms.map(p => p.target_id);

    // Fetch user's module/portal access permissions
    const modulePerms = await base44.entities.AccessPermission.filter({
      target_type: 'module',
      scope_type: 'individual',
      scope_value: user.email,
      permission: 'allow',
      is_active: true,
    });
    const grantedModules = modulePerms.map(p => p.target_id);

    // Fetch OrgSettings for tier_portal_access and owner_email
    const settings = await base44.asServiceRole.entities.OrgSettings.filter({});
    const orgSettings = settings[0] || {};
    const ownerEmail = orgSettings.owner_email;
    const isOwner = ownerEmail === user.email;

    // Fetch Employee record for org_tier
    const employees = await base44.asServiceRole.entities.Employee.filter({ email: user.email });
    const employee = employees[0];
    const orgTier = employee?.org_tier;
    const tierPortalAccess = orgSettings.tier_portal_access || {};

    // Determine accessible modules
    const tierModules = (orgTier && tierPortalAccess[orgTier]) ? tierPortalAccess[orgTier] : [];
    const accessibleModules = new Set([...grantedModules, ...tierModules]);
    if (isAdmin) {
      // Admins see all portal folders
      Object.values(FOLDER_TO_MODULE).forEach(m => accessibleModules.add(m));
    }

    // === FILE ENTITY FILTERING (server-side) ===
    // Build the access filter so unauthorized files never leave the server
    const accessibleLevels = ['universal'];
    if (isAdmin) {
      accessibleLevels.push('manager', 'finance', 'corporate', 'personal');
    } else {
      // Personal files: only their own
      // Restricted levels: only if explicitly granted
      for (const level of ['manager', 'finance', 'corporate']) {
        if (grantedFileLevels.includes(level)) {
          accessibleLevels.push(level);
        }
      }
    }

    // Query files: use $or to get files matching any accessible level
    // For personal files, also filter by owner_email
    const orConditions = [
      { access_level: { $in: accessibleLevels.filter(l => l !== 'personal') } },
    ];

    // Add personal files condition
    if (isAdmin) {
      // Admins see all personal files
      orConditions.push({ access_level: 'personal' });
    } else {
      // Non-admins only see their own personal files
      orConditions.push({ access_level: 'personal', owner_email: user.email });
    }

    const files = await base44.asServiceRole.entities.File.filter({
      $or: orConditions,
    }, '-created_date', 1000);

    // Double-check: strip personal files that don't belong to this user (safety net)
    const safeFiles = files.filter(f => {
      if (f.access_level === 'personal' && !isAdmin) {
        return f.owner_email === user.email;
      }
      return true;
    });

    // === SHAREPOINT FOLDER FILTERING ===
    const accessToken = await getAccessToken();
    const listRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root/children?$select=name,folder,id,webUrl`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    let accessibleFolders = [];
    if (listRes.ok) {
      const listData = await listRes.json();
      const allFolders = (listData.value || []).filter(item => item.folder);

      accessibleFolders = allFolders.filter(folder => {
        const name = folder.name;

        // 1. Private employee folders — only owner or admin
        if (name.startsWith('_PRIVATE_')) {
          const folderOwner = name.replace('_PRIVATE_', '');
          return folderOwner === user.email || isAdmin || isOwner;
        }

        // 2. Archives folder — visible to admins and anyone with archives module access
        if (name.startsWith('_ARCHIVES_')) {
          return isAdmin || accessibleModules.has('archives');
        }

        // 3. Vault folders — only authorized roles
        if (VAULT_FOLDER_ACCESS[name]) {
          return VAULT_FOLDER_ACCESS[name].includes(user.role) || isAdmin || isOwner;
        }

        // 4. Module-linked folders — must have module access
        const moduleId = FOLDER_TO_MODULE[name];
        if (moduleId) {
          return accessibleModules.has(moduleId) || isAdmin;
        }

        // 5. General/shared folders (e.g. "All staff", "Office Documents", "presentations")
        //    Visible to all authenticated users
        return true;
      }).map(folder => ({
        id: folder.id,
        name: folder.name,
        webUrl: folder.webUrl,
        childCount: folder.folder?.childCount || 0,
      }));
    }

    return Response.json({
      status: 'success',
      user: {
        email: user.email,
        role: user.role,
        org_tier: orgTier,
        is_admin: isAdmin,
        is_owner: isOwner,
      },
      files: safeFiles,
      file_count: safeFiles.length,
      folders: accessibleFolders,
      folder_count: accessibleFolders.length,
      granted_file_levels: isAdmin ? ['manager', 'finance', 'corporate'] : grantedFileLevels,
      granted_modules: [...accessibleModules],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});