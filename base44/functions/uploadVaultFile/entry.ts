import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getGraphAccessToken, getVaultFolderPath, uploadFileToVault } from '../../shared/vaultStorage.ts';

// Moves a freshly uploaded file (handed in as a short-lived signed URL from
// private storage) into the File Manager's SharePoint vault, mirroring the
// selected category/subcategory folders. No public storage is involved.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { signed_url, original_name, category, subcategory } = body;
    if (!signed_url || !original_name) {
      return Response.json({ error: 'signed_url and original_name are required' }, { status: 400 });
    }

    const fileRes = await fetch(signed_url, { signal: AbortSignal.timeout(120000) });
    if (!fileRes.ok) {
      return Response.json({ error: `Could not read the uploaded file (${fileRes.status})` }, { status: 400 });
    }
    const bytes = await fileRes.arrayBuffer();

    const accessToken = await getGraphAccessToken();
    const folderPath = getVaultFolderPath(category, subcategory);
    const { itemId, name } = await uploadFileToVault(accessToken, folderPath, original_name, bytes);

    return Response.json({ item_id: itemId, path: folderPath, name, size: bytes.byteLength });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}