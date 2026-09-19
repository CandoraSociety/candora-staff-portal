import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import {
  BACKUP_GROUPS,
  BACKUP_ROOT_NAME,
  DRIVE_ID,
  backupFile,
  collectFileUrls,
  ensureFolderPath,
  findGroup,
  getGraphToken,
  sanitizeFolderName,
  toCsv,
  MAX_FILES_PER_GROUP,
} from "../../shared/appBackup.ts";

// Fetch every record of an entity, paginating on updated_date so entities
// larger than one page are fully exported.
async function fetchAllRecords(base44, entityName) {
  const client = base44.asServiceRole.entities[entityName];
  if (!client) throw new Error(`Unknown entity: ${entityName}`);
  const all = [];
  const seen = new Set();
  let cursor = null;
  while (true) {
    const batch = cursor
      ? await client.filter({ updated_date: { $gt: cursor } }, 'updated_date', 200)
      : await client.list('updated_date', 200);
    for (const record of batch) {
      if (!seen.has(record.id)) {
        seen.add(record.id);
        all.push(record);
      }
    }
    if (batch.length < 200) break;
    cursor = batch[batch.length - 1].updated_date;
  }
  return all;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'super_admin', 'executive_director'].includes(user.role)) {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    // One portal group per invocation (the weekly workflow calls this once per
    // group); no group arg = run every group.
    let groupKey = null;
    try {
      const body = await req.json();
      groupKey = body?.group || null;
    } catch (_parseErr) {
      groupKey = null;
    }
    const groups = groupKey ? [findGroup(groupKey)] : BACKUP_GROUPS;
    if (groupKey && !groups[0]) {
      return Response.json({ error: `Unknown backup group: ${groupKey}` }, { status: 400 });
    }

    // Resolve portal folder names the same way syncPortalFolders created them:
    // the enabled internal PortalCard's display name.
    const cards = await base44.asServiceRole.entities.PortalCard.list();
    const folderByModule = {};
    for (const card of cards) {
      if (!card.is_enabled || !card.url || card.is_external) continue;
      const moduleId = card.url.replace(/^\//, '').split('/')[0];
      if (!moduleId || moduleId === 'admin') continue;
      if (!folderByModule[moduleId]) {
        folderByModule[moduleId] = sanitizeFolderName(card.name) || undefined;
      }
    }

    const accessToken = await getGraphToken();
    const today = new Date().toISOString().slice(0, 10);
    const results = [];

    for (const group of groups) {
      const folderName = folderByModule[group.key] || group.fallbackFolder;
      const groupResult = { group: group.key, folder: folderName, backed_up: [], errors: [] };
      const groupFiles = [];
      const seenFileUrls = new Set();

      let backupPath;
      try {
        backupPath = await ensureFolderPath(accessToken, [folderName, BACKUP_ROOT_NAME, today]);
      } catch (err) {
        groupResult.errors.push(`folder: ${err.message}`);
        results.push(groupResult);
        continue;
      }

      for (const entityName of group.entities) {
        try {
          const records = await fetchAllRecords(base44, entityName);
          for (const foundFile of collectFileUrls(entityName, records)) {
            if (!seenFileUrls.has(foundFile.url)) {
              seenFileUrls.add(foundFile.url);
              groupFiles.push(foundFile);
            }
          }
          if (!records.length) {
            groupResult.backed_up.push({ entity: entityName, count: 0, status: 'empty — no file created' });
            continue;
          }
          const csv = toCsv(records);
          const fileName = `${entityName}_${today}.csv`;
          const uploadRes = await fetch(
            `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:${backupPath}/${fileName}:/content`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'text/csv',
              },
              body: csv,
            }
          );
          if (!uploadRes.ok) {
            throw new Error(`upload failed: ${(await uploadRes.text()).slice(0, 200)}`);
          }
          groupResult.backed_up.push({ entity: entityName, count: records.length, file: fileName });
        } catch (err) {
          groupResult.errors.push(`${entityName}: ${err.message}`);
        }
      }
      if (groupFiles.length) {
        groupResult.files_found = groupFiles.length;
        try {
          const filesPath = await ensureFolderPath(accessToken, [folderName, BACKUP_ROOT_NAME, today, 'Uploaded Files']);
          const toBackup = groupFiles.slice(0, MAX_FILES_PER_GROUP);
          let copied = 0;
          for (const file of toBackup) {
            try {
              await backupFile(accessToken, filesPath, file);
              copied++;
            } catch (err) {
              groupResult.errors.push(`file ${file.name}: ${err.message}`);
            }
          }
          groupResult.files_backed_up = copied;
          if (groupFiles.length > toBackup.length) {
            groupResult.files_skipped = groupFiles.length - toBackup.length;
          }
        } catch (err) {
          groupResult.errors.push(`files folder: ${err.message}`);
        }
      }
      results.push(groupResult);
    }

    return Response.json({
      status: 'success',
      backup_date: today,
      groups: results.map((r) => r.group),
      total_errors: results.reduce((sum, r) => sum + r.errors.length, 0),
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});