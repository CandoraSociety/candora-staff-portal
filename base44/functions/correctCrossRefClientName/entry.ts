import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';
import { patchClientRows } from '../../shared/crtRowPatch.ts';
import { properUserName } from '../../shared/userName.ts';

// Name correction from the Cross-Reference Name Verification sub-tab.
//
// Staff record the client's correct legal name as it appears in Compass, then
// push the correction:
//  - Client WITH a portal record (matched by HSID, then by normalized name):
//    the Client entity's first/last name is updated and a progress note is
//    appended. The "CRT Sync on Client Update" automation then re-derives the
//    CRT row from the entity, and the Pathways → Resource Centre automation
//    keeps the central database in step — this function deliberately does no
//    workbook writes on that path (it kept the call under a few seconds).
//  - Client with NO portal record: the participant name cell (column A) is
//    patched directly in the matched row of every open CRT workbook.

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

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch { /* service-role fallback */ }

    const payload = await req.json().catch(() => ({}));
    const hsid = String(payload.hsid || '').trim();
    const currentName = String(payload.current_name || '').trim();
    const correctedName = String(payload.corrected_name || '').trim();
    if (!correctedName) return Response.json({ error: 'corrected_name required' }, { status: 400 });
    if (!hsid && !currentName) return Response.json({ error: 'hsid or current_name required' }, { status: 400 });

    const { first_name, last_name } = parseName(correctedName);
    if (!first_name && !last_name) return Response.json({ error: 'corrected_name is empty' }, { status: 400 });

    // Match a portal Client record — HSID first (a fast indexed filter), then
    // a slim name scan only when the HSID doesn't turn one up.
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
          allClients = await base44.asServiceRole.entities.Client.list() || [];
        } catch { /* no fallback */ }
        matched = allClients.find(c => NORM(`${c.last_name || ''}, ${c.first_name || ''}`) === nk) || null;
      }
    }

    // --- Portal client: correct the name on the entity. The CRT Sync on
    // Client Update automation re-derives the workbook row from the entity.
    if (matched) {
      const notes = Array.isArray(matched.roadmap_progress_notes) ? matched.roadmap_progress_notes : [];
      const entry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        date: new Date().toISOString().split('T')[0],
        event_type: 'manual',
        item_label: 'Name Corrected (Cross-Reference Name Verification)',
        item_key: 'crt_name_correction',
        note: `Name corrected from "${currentName || hsid}" to "${correctedName}" per Compass`,
        logged_by: user?.email || '',
        logged_by_name: properUserName(user),
        compass_entered: false,
      };
      await base44.asServiceRole.entities.Client.update(matched.id, {
        first_name,
        last_name,
        roadmap_progress_notes: [entry, ...notes],
      });
      return Response.json({
        status: 'success',
        matched: true,
        client_id: matched.id,
        corrected_name: correctedName,
      });
    }

    // --- No portal record: patch the participant name cell (column A) on the
    // matched row of every open CRT workbook directly.
    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);
    let closedNames = new Set();
    try {
      const closed = await base44.asServiceRole.entities.CrtWorkbook.filter({ status: 'closed' });
      closedNames = new Set(closed.map(r => r.file_name));
    } catch { /* default: nothing closed */ }
    const openFiles = files.filter(f => !closedNames.has(f.name));
    const results = await patchClientRows({
      accessToken,
      files: openFiles,
      hsid,
      clientName: currentName,
      writeVals: { 0: correctedName },
    });

    const patched = results.filter(r => r.status === 'patched').length;
    return Response.json({
      status: 'success',
      matched: false,
      corrected_name: correctedName,
      workbooks_patched: patched,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}