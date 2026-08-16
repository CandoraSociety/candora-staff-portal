import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW, NUM_COLUMNS,
  getGraphToken, listCrtFiles, mapClientToCrtRow, parseCrtDate
} from '../../shared/crtWorkbook.ts';

// Push "Updated" cross-reference rows into the live CRT.
//
// For clients that match a portal Client record, the cross-reference CRT
// field values are written BACK into the client file fields (service type,
// start date, EDA completion, placement, 90-day outcome, etc.) so the normal
// "CRT Sync on Client Update" automation re-derives the CRT row from the
// (now cross-ref-matching) entity. The 90 Day Outcome Date is therefore
// calculated the usual way — never taken from the cross-ref. A progress note
// listing every cross-ref CRT field is appended to the client file.
//
// For clients with NO portal record, the cross-ref row is written directly
// into every open CRT workbook (new row appended, or matched row updated by
// HSID/name). There is no entity to calculate the 90-day date from, so it is
// left blank.

const FIELD_LABELS = {
  participant_name: 'Participant Legal Name',
  hsid: 'COMPASS HSID #',
  ceis_dea: 'CEIS (DEA)',
  dea_start_date: 'DEA Start Date',
  service_element: 'Service Element',
  service_start_date: 'Service Start Date',
  service_outcome: 'Service Outcome',
  service_outcome_date: 'Service Outcome Date',
  placement_outcome: 'Placement Outcome',
  placement_outcome_date: 'Placement Outcome Date',
  day90_outcome: '90 Day Outcome',
  day90_outcome_date: '90 Day Outcome Date',
  comments: 'CRT Comments',
  eda_completion_date: 'EDA Completion Date',
  work_exposure: 'Work Exposure Y/N',
  wage_subsidy: 'Wage Subsidy Y/N',
  employed_ftpt: 'Employed FT/PT',
  service_nav_support: 'Service Nav Support Y/N',
  service_nav_billing_month: 'Service Nav Billing Month',
};

const FIELD_TO_COL = {
  participant_name: 0, hsid: 1, ceis_dea: 2, dea_start_date: 3, service_element: 4,
  service_start_date: 5, service_outcome: 6, service_outcome_date: 7,
  placement_outcome: 8, placement_outcome_date: 9, day90_outcome: 14,
  comments: 18, eda_completion_date: 19, work_exposure: 20, wage_subsidy: 21,
  employed_ftpt: 22, service_nav_support: 23, service_nav_billing_month: 24,
};

// 30/60/180-day columns are not tracked in the cross-reference tab — preserve
// whatever the live CRT already holds for those when updating a matched row.
const PRESERVE_COLS = new Set([10, 11, 12, 13, 16, 17]);

const NORM = (s) => String(s || '').toLowerCase().replace(/,/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

function buildCrossRefRow(cf, day90Date) {
  const row = new Array(NUM_COLUMNS).fill('');
  for (const [k, c] of Object.entries(FIELD_TO_COL)) row[c] = String(cf[k] ?? '').trim();
  row[15] = String(day90Date || ''); // P: 90 Day Outcome Date — calculated, never from cross-ref
  return row;
}

function buildNoteText(cf, day90Date) {
  const parts = [];
  for (const [k, label] of Object.entries(FIELD_LABELS)) {
    if (k === 'day90_outcome_date') {
      if (day90Date) parts.push(`${label}: ${day90Date} (calculated)`);
      continue;
    }
    const v = String(cf[k] ?? '').trim();
    if (v) parts.push(`${label}: ${v}`);
  }
  return parts.join(' | ');
}

// Reverse-map cross-reference CRT field values back into the Client entity
// fields that the normal CRT sync derives them from. Only sets fields the
// cross-ref actually provides. The 90-day DATE is intentionally never set —
// the sync calculates it.
function applyCrossRefToClient(client, cf) {
  const u = {};
  const hsid = String(cf.hsid || '').trim();
  if (hsid && hsid !== String(client.compass_hsid || '').trim()) u.compass_hsid = hsid;

  const se = String(cf.service_element || '').trim().toUpperCase();
  if (se === 'CEIS') u.service_type = 'direct_to_employment';
  else if (se === 'WD') u.service_type = 'pathways';

  const startDateRaw = se === 'CEIS' ? (cf.dea_start_date || '') : (cf.service_start_date || '');
  if (startDateRaw) {
    const iso = parseCrtDate(startDateRaw);
    if (iso) u.service_start_date = iso;
  }

  const so = String(cf.service_outcome || '').trim();
  if (so === 'Complete') {
    if (cf.service_outcome_date) {
      const iso = parseCrtDate(cf.service_outcome_date);
      if (iso) u.eda_completion_date = iso;
    }
    u.program_status = 'complete';
  } else if (so === 'Cancelled') {
    u.program_status = 'cancelled';
    if (client.eda_completion_date) u.eda_completion_date = '';
  } else if (so === 'Incomplete') {
    u.program_status = 'incomplete';
    if (client.eda_completion_date) u.eda_completion_date = '';
  }

  const po = String(cf.placement_outcome || '').trim();
  if (po && po !== 'P') u.post_completion_employment_status = po;
  if (cf.placement_outcome_date) {
    const iso = parseCrtDate(cf.placement_outcome_date);
    if (iso) u.post_completion_employment_date = iso;
  }

  const d90 = String(cf.day90_outcome || '').trim();
  if (d90 && d90 !== 'P') u.followup_90day_status = d90;

  if (cf.employed_ftpt) u.employed_ftpt = String(cf.employed_ftpt).trim();
  if (cf.wage_subsidy) u.wage_subsidy_accessed = String(cf.wage_subsidy).toLowerCase() === 'yes';
  if (cf.work_exposure) u.paid_external_placement = String(cf.work_exposure).toLowerCase() === 'yes';

  // Comments are a composed (state-derived) field. Store the reviewed cross-ref
  // comments as the client's additional CRT comment so they flow through the
  // normal composition and stay removable by clearing the field.
  if (cf.comments !== undefined && cf.comments !== null) u.crt_additional_comments = String(cf.comments);

  return u;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch { /* service-role fallback */ }

    const payload = await req.json().catch(() => ({}));
    const updates = Array.isArray(payload.updates) ? payload.updates : (payload.update ? [payload.update] : []);
    if (!updates.length) return Response.json({ error: 'No updates provided' }, { status: 400 });

    const allClients = await base44.asServiceRole.entities.Client.list();
    const byHsid = new Map();
    const byName = new Map();
    for (const c of allClients) {
      const h = String(c.compass_hsid || '').trim();
      if (h) byHsid.set(h, c);
      byName.set(NORM(`${c.last_name || ''}, ${c.first_name || ''}`), c);
    }
    const matchClient = (u) => {
      const cf = u.crt_fields || {};
      const hsid = String(u.hsid || cf.hsid || '').trim();
      const name = String(u.client_name || cf.participant_name || '').trim();
      if (hsid && byHsid.has(hsid)) return byHsid.get(hsid);
      if (name) { const nk = NORM(name); if (byName.has(nk)) return byName.get(nk); }
      return null;
    };

    const results = [];
    const nonPortal = [];

    for (let i = 0; i < updates.length; i++) {
      const u = updates[i];
      const cf = u.crt_fields || {};
      const matched = matchClient(u);
      if (!matched) {
        nonPortal.push({ idx: i, cf });
        results[i] = { hsid: cf.hsid || '', name: cf.participant_name || '', matched: false, added_to_crt: false };
        continue;
      }
      const entityUpdates = applyCrossRefToClient(matched, cf);
      const projected = { ...matched, ...entityUpdates };
      const day90Date = mapClientToCrtRow(projected, null)[15] || '';
      const notes = Array.isArray(matched.roadmap_progress_notes) ? matched.roadmap_progress_notes : [];
      const entry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        date: new Date().toISOString().split('T')[0],
        event_type: 'manual',
        item_label: 'CRT Cross-Reference Update',
        item_key: 'crt_crossref_update',
        note: buildNoteText(cf, day90Date),
        logged_by: user?.email || '',
        logged_by_name: user?.full_name || '',
        compass_entered: false,
      };
      try {
        await base44.asServiceRole.entities.Client.update(matched.id, {
          ...entityUpdates,
          roadmap_progress_notes: [entry, ...notes],
        });
        results[i] = { hsid: cf.hsid || '', name: cf.participant_name || '', matched: true, client_updated: true, day90_date: day90Date };
      } catch (e) {
        results[i] = { hsid: cf.hsid || '', name: cf.participant_name || '', matched: true, client_updated: false, error: e.message };
      }
    }

    // Non-portal clients: write directly to the live CRT (new row, or update a
    // row matched by HSID/name). No entity → no 90-day date calculation.
    if (nonPortal.length) {
      const accessToken = await getGraphToken();
      const files = await listCrtFiles(accessToken);
      let closedNames = new Set();
      try {
        const closed = await base44.asServiceRole.entities.CrtWorkbook.filter({ status: 'closed' });
        closedNames = new Set(closed.map(r => r.file_name));
      } catch { /* default: nothing closed */ }

      for (const { idx, cf } of nonPortal) {
        const row = buildCrossRefRow(cf, '');
        const fileStatuses = [];
        for (const f of files) {
          if (closedNames.has(f.name)) { fileStatuses.push({ file: f.name, status: 'skipped_closed' }); continue; }
          try {
            const rangeRes = await fetch(
              `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!rangeRes.ok) { fileStatuses.push({ file: f.name, status: 'error', error: 'read failed' }); continue; }
            const rangeData = await rangeRes.json();
            const allValues = (rangeData.values || []).map(r => {
              const p = [...r];
              while (p.length < NUM_COLUMNS) p.push('');
              return p.slice(0, NUM_COLUMNS);
            });

            const hsid = String(cf.hsid || '').trim();
            let rowIdx = -1;
            if (hsid) {
              for (let i = CLIENT_DATA_START_ROW - 1; i < allValues.length; i++) {
                const rr = allValues[i];
                if (rr && String(rr[1] || '').trim() === hsid) { rowIdx = i; break; }
              }
            }
            if (rowIdx < 0) {
              const nk = NORM(cf.participant_name || '');
              for (let i = CLIENT_DATA_START_ROW - 1; i < allValues.length; i++) {
                const rr = allValues[i];
                if (!rr) continue;
                const rh = String(rr[1] || '').trim();
                if (!rh && String(rr[0] || '').trim() && NORM(rr[0]) === nk) { rowIdx = i; break; }
              }
            }

            let targetRow1, rowToWrite;
            if (rowIdx >= 0) {
              targetRow1 = rowIdx + 1;
              const existing = allValues[rowIdx] || [];
              rowToWrite = row.map((v, c) => (PRESERVE_COLS.has(c) ? (existing[c] ?? '') : v));
            } else {
              let last = CLIENT_DATA_START_ROW - 2;
              for (let i = allValues.length - 1; i >= CLIENT_DATA_START_ROW - 1; i--) {
                if (allValues[i] && allValues[i].some(v => v !== '' && v !== null && v !== undefined)) { last = i; break; }
              }
              targetRow1 = last + 2;
              rowToWrite = row;
            }

            const rangeAddress = `A${targetRow1}:Y${targetRow1}`;
            const patchRes = await fetch(
              `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='${rangeAddress}')`,
              { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values: [rowToWrite] }) }
            );
            fileStatuses.push({ file: f.name, status: patchRes.ok ? (rowIdx >= 0 ? 'updated' : 'added') : 'error', row: targetRow1 });
          } catch (e) {
            fileStatuses.push({ file: f.name, status: 'error', error: e.message });
          }
        }
        results[idx].added_to_crt = fileStatuses.some(s => s.status === 'updated' || s.status === 'added');
        results[idx].files = fileStatuses;
      }
    }

    return Response.json({ status: 'success', results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}