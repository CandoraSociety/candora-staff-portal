import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';
import { patchClientRows } from '../../shared/crtRowPatch.ts';
import { properUserName } from '../../shared/userName.ts';

// Name verification on the Master List.
//
// Staff confirm a client's legal name on the CRT and correct it when it is
// wrong. One press of Done sends the corrected name here, and this function:
//  - updates the matching portal Client record (matched by HSID, then by
//    normalized name) so the CRT sync never overwrites the correction, and
//  - writes the participant name cell (column A) into EVERY CRT workbook
//    version — open and closed — so all months agree on the name.

const NORM = (s) => String(s || '').toLowerCase().replace(/,/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

// "Last, First" or "First Last" → first/last name parts.
function parseName(full) {
  const s = String(full || '').trim();
  if (!s) return { first_name: '', last_name: '' };
  if (s.includes(',')) {
    const [last, ...rest] = s.split(',').map(x => x.trim());
    return { first_name: rest.join(' ').trim(), last_name: last };
  }
  const parts = s.split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const hsid = String(payload.hsid || '').trim();
    const currentName = String(payload.current_name || '').trim();
    const correctedName = String(payload.corrected_name || '').replace(/\s+/g, ' ').trim();
    if (!correctedName) return Response.json({ error: 'corrected_name required' }, { status: 400 });
    if (!hsid && !currentName) return Response.json({ error: 'hsid or current_name required' }, { status: 400 });

    const { first_name, last_name } = parseName(correctedName);
    if (!first_name && !last_name) return Response.json({ error: 'corrected_name is empty' }, { status: 400 });

    // --- Portal client: keep the entity in step so the CRT sync doesn't write
    // the old name back on the next update.
    let matched = null;
    if (hsid) {
      try {
        const byId = await base44.asServiceRole.entities.Client.filter({ compass_hsid: hsid }, { limit: 5 });
        matched = byId?.items?.[0] || byId?.[0] || null;
      } catch { /* fall through to name match */ }
    }
    if (!matched && currentName) {
      const nk = NORM(currentName);
      if (nk) {
        let allClients = [];
        try {
          allClients = (await base44.asServiceRole.entities.Client.list()) || [];
        } catch { /* no fallback */ }
        matched = allClients.find(c => NORM(`${c.last_name || ''}, ${c.first_name || ''}`) === nk) || null;
      }
    }

    let clientUpdated = false;
    if (matched) {
      const notes = Array.isArray(matched.roadmap_progress_notes) ? matched.roadmap_progress_notes : [];
      const entry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        date: new Date().toISOString().split('T')[0],
        event_type: 'manual',
        item_label: 'Name Verified (Master List Name Verification)',
        item_key: 'crt_name_verification',
        note: `Name verified as "${correctedName}"${currentName && currentName !== correctedName ? ` (was "${currentName}")` : ''}`,
        logged_by: user?.email || '',
        logged_by_name: properUserName(user),
        compass_entered: false,
      };
      await base44.asServiceRole.entities.Client.update(matched.id, {
        first_name,
        last_name,
        roadmap_progress_notes: [entry, ...notes],
      });
      clientUpdated = true;
    }

    // --- Every CRT workbook version gets the participant name (column A).
    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);
    const results = await patchClientRows({
      accessToken,
      files,
      hsid,
      clientName: currentName,
      writeVals: { 0: correctedName },
    });

    const patched = results.filter(r => r.status === 'patched').length;
    const failed = results.filter(r => r.status === 'error');

    return Response.json({
      status: 'success',
      corrected_name: correctedName,
      client_updated: clientUpdated,
      workbooks_patched: patched,
      workbooks_total: files.length,
      results,
      ...(failed.length ? { warning: failed.map(f => f.file).join(', ') } : {}),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}