import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getGraphAccessToken } from '../../shared/vaultStorage.ts';
import { uploadToPortalFolder, portalAccessLevel } from '../../shared/portalFiles.ts';

// Files uploaded from a portal's dashboard are stored in that portal's own
// SharePoint folder, and recorded as a File so they stay searchable in-app.
// Content is handed in as a short-lived signed URL from private storage.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { signed_url, original_name, portal, portal_name, description } = body;
    if (!signed_url || !original_name || !portal) {
      return Response.json({ error: 'signed_url, original_name and portal are required' }, { status: 400 });
    }

    const fileRes = await fetch(signed_url, { signal: AbortSignal.timeout(120000) });
    if (!fileRes.ok) {
      return Response.json({ error: `Could not read the uploaded file (${fileRes.status})` }, { status: 400 });
    }
    const bytes = await fileRes.arrayBuffer();

    const accessToken = await getGraphAccessToken();
    const stored = await uploadToPortalFolder(accessToken, portal, original_name, bytes, portal_name);
    const fileType = (original_name.split('.').pop() || '').toLowerCase();

    const record = await base44.entities.File.create({
      original_name,
      display_name: original_name.replace(/\.[^/.]+$/, ''),
      description: description || '',
      summary: description || '',
      keywords: [],
      file_url: '',
      storage_backend: 'sharepoint',
      sp_item_id: stored.itemId,
      sp_path: stored.path,
      file_type: fileType,
      file_size: bytes.byteLength,
      category: 'other',
      access_level: portalAccessLevel(portal),
      owner_email: user.email,
      owner_name: user.full_name,
      source_app: 'portal_quick_upload',
      portal_key: portal,
    });

    return Response.json({
      status: 'success',
      file_id: record.id,
      item_id: stored.itemId,
      name: stored.name,
      folder: stored.folderName,
      path: stored.path,
      size: bytes.byteLength,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}