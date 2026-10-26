import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getGraphAccessToken, getVaultFolderPath, uploadFileToVault } from '../../shared/vaultStorage.ts';

// One-time migration: copies files still stored on the old public Base44
// links into the SharePoint vault, then repoints the record at SharePoint.
// Admin only; processes up to 40 records per run — re-run until remaining = 0.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const files = await base44.asServiceRole.entities.File.filter({
      storage_backend: { $ne: 'sharepoint' },
      file_url: { $regex: 'media\\.base44\\.com' },
    }, '-created_date', 200);

    const toProcess = files.slice(0, 40);
    const accessToken = await getGraphAccessToken();

    let migrated = 0;
    const failures = [];
    // Process in small batches so a few large files can't starve the run
    for (let i = 0; i < toProcess.length; i += 5) {
      const batch = toProcess.slice(i, i + 5);
      const results = await Promise.allSettled(batch.map(async (f) => {
        const res = await fetch(f.file_url, { signal: AbortSignal.timeout(120000) });
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        const bytes = await res.arrayBuffer();
        const folderPath = getVaultFolderPath(f.category, f.subcategory);
        const { itemId } = await uploadFileToVault(accessToken, folderPath, f.original_name || 'file', bytes);
        await base44.asServiceRole.entities.File.update(f.id, {
          file_url: '',
          sp_item_id: itemId,
          sp_path: folderPath,
          storage_backend: 'sharepoint',
        });
      }));
      results.forEach((r, j) => {
        if (r.status === 'fulfilled') migrated++;
        else failures.push({ name: batch[j].original_name, error: r.reason?.message || String(r.reason) });
      });
    }

    return Response.json({
      migrated,
      failed: failures.length,
      failures: failures.slice(0, 5),
      remaining: files.length - migrated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}