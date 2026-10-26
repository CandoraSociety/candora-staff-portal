import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getGraphAccessToken, getItemDownloadUrl } from '../../shared/vaultStorage.ts';

// Returns a short-lived download URL for a vault file, after enforcing the
// same access rules getAccessibleFiles uses when listing files. Falls back to
// the legacy file_url for records not yet migrated to SharePoint.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { file_id } = body;
    if (!file_id) return Response.json({ error: 'file_id is required' }, { status: 400 });

    const file = await base44.entities.File.get(file_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!file) return Response.json({ error: 'File not found' }, { status: 404 });

    // Legacy record still on the old storage link
    if (!file.sp_item_id && file.file_url) {
      return Response.json({ url: file.file_url });
    }
    if (!file.sp_item_id) {
      return Response.json({ error: 'File has no stored content' }, { status: 404 });
    }

    // Access check — mirrors getAccessibleFiles rules
    if (user.role !== 'admin') {
      const level = file.access_level;
      if (level === 'personal' && file.owner_email !== user.email) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (level === 'manager' || level === 'finance' || level === 'corporate') {
        const perms = await base44.asServiceRole.entities.AccessPermission.filter({
          target_type: 'file_access',
          scope_type: 'individual',
          scope_value: user.email,
          target_id: level,
          permission: 'allow',
          is_active: true,
        });
        if (perms.length === 0) return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const accessToken = await getGraphAccessToken();
    const url = await getItemDownloadUrl(accessToken, file.sp_item_id);
    return Response.json({ url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}