import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';
import { syncOneClientIntoAllOpenWorkbooks } from '../../shared/crtSync.ts';
import { patchClientRows } from '../../shared/crtRowPatch.ts';
import { properUserName } from '../../shared/userName.ts';

// Name correction from the Cross-Reference Name Verification sub-tab.
//
// Staff record the client's correct legal name as it appears in Compass, then
// push the correction:
//  - Client WITH a portal record (matched by HSID or normalized name): the
//    Client entity's first/last name is updated, a progress note is appended,
//    and the corrected name is synced into every open CRT workbook. The
//    normal "CRT Sync on Client Update" and "Pathways → Resource Centre"
//    automations keep the rest of the app in step from the entity update.
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

    // Match a portal Client record by HSID first, then by normalized name.
    const allClients = await base44.asServiceRole.entities.Client.list('-created_date', 5000) || [];
    let matched = null;
    if (hsid) {
      matched = allClients.find(c => String(c.compass_hsid || '').trim() === hsid) || null;
    }
    if (!matched && currentName) {
      const nk = NORM(currentName);
      matched = allClients.find(c => NORM(`${c.last_name || ''}, ${c.first_name || ''}`) === nk) || null;
    }

    const graphToken = await getGraphToken();

    // --- Portal client: correct the name on the entity, then sync the CRT row
    // directly into every open workbook so the fix lands immediately.
    if (matched) {
      const notes = Array.isArray(matched.roadmap_progress_notes) ? matched.roadmap_progress_notes : [];
      const entry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        date: new Date().toISOString().split('T')[0],
        event_type: 'manual',
        item_label: 'Name Corrected (Cross-Reference Name Verification)',
        item_key: 'crt_name_correction',
        note: `Name corrected from "${currentName || matched.compass_hsid}" to "${correctedName}" per Compass`,
        logged_by: user?.email || '',
        logged_by_name: properUserName(user),
        compass_entered: false,
      };
      const updated = await base44.asServiceRole.entities.Client.update(matched.id, {
        first_name,
        last_name,
        roadmap_progress_notes: [entry, ...notes],
      });
      let crt = null;
      if (graphToken) {
        try { await syncOneClientIntoAllOpenWorkbooks(base44, graphToken, updated); crt = 'synced'; }
        catch (e) { crt = 'sync_error: ' + String(e.message || e).slice(0, 200); }
      }
      return Response.json({
        status: 'success',
        matched: true,
        client_id: matched.id,
        corrected_name: correctedName,
        crt,
      });
    }

    // --- No portal record: patch the participant name cell (column A) on the
    // matched row of every open CRT workbook directly.
    const files = await listCrtFiles(graphToken);
    let closedNames = new Set();
    try {
      const closed = await base44.asServiceRole.entities.CrtWorkbook.filter({ status: 'closed' });
      closedNames = new Set(closed.map(r => r.file_name));
    } catch { /* default: nothing closed */ }
    const openFiles = files.filter(f => !closedNames.has(f.name));
    const results = await patchClientRows({
      accessToken: graphToken,
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