import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  getGraphToken, listCrtFiles, mapClientToCrtRow, parseCrtDate
} from '../../shared/crtWorkbook.ts';
import { refreshBillingCounts } from '../../shared/invoiceTrackerCounts.ts';

// Push "Updated" cross-reference rows into the live CRT.
//
// For clients that match a portal Client record, the cross-reference CRT
// field values are written BACK into the client file fields (service type,
// start date, EDA completion, placement, 90-day outcome + date, etc.) so the
// normal "CRT Sync on Client Update" automation re-derives the CRT row from
// the (now cross-ref-matching) entity. When a 90-day outcome date is supplied
// alongside a 90-day outcome (status), it's written to followup_90day_date and
// the sync surfaces it in column P; otherwise column P is calculated the
// usual way. A progress note listing every cross-ref CRT field is appended.
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

function buildNoteText(cf, day90Date) {
  const parts = [];
  for (const [k, label] of Object.entries(FIELD_LABELS)) {
    if (k === 'day90_outcome_date') {
      if (day90Date) parts.push(`${label}: ${day90Date}`);
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
  // 90 Day Outcome Date — written back to the client file so the next CRT sync
  // surfaces it in column P. Only applies when a 90-day outcome (status) is
  // also set, since column P's derivation keys off followup_90day_status.
  if (cf.day90_outcome_date) {
    const iso = parseCrtDate(cf.day90_outcome_date);
    if (iso) u.followup_90day_date = iso;
  }

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
    let anyClientUpdated = false;

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
        anyClientUpdated = true;
        results[i] = { hsid: cf.hsid || '', name: cf.participant_name || '', matched: true, client_updated: true, day90_date: day90Date };
      } catch (e) {
        results[i] = { hsid: cf.hsid || '', name: cf.participant_name || '', matched: true, client_updated: false, error: e.message };
      }
    }

    // Non-portal clients: create a Client entity record held in a triage
    // section ("New clients from Cross-Reference List") of the Master List.
    // The record is created with NO assigned counsellor and a pending-triage
    // flag so it stays out of the normal active lists and counsellor dashboards
    // until a manager assigns a counsellor, program stream, and program status
    // from the triage dropdowns — at which point the flag is cleared and the
    // client moves into the normal sections. The same cross-ref progress note
    // that matched clients get is attached on creation. The normal "CRT Sync on
    // Client Update" automation (which fires on create) adds them to the live
    // CRT; the 90-day date and derived CRT fields are calculated by the sync.
    let anyClientCreated = false;
    if (nonPortal.length) {
      for (const { idx, cf } of nonPortal) {
        const { first_name, last_name } = parseName(cf.participant_name);
        if (!first_name && !last_name) {
          results[idx] = { hsid: cf.hsid || '', name: cf.participant_name || '', matched: false, created: false, error: 'No name to create' };
          continue;
        }
        const entityUpdates = applyCrossRefToClient({ compass_hsid: '', eda_completion_date: '' }, cf);
        const entry = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          date: new Date().toISOString().split('T')[0],
          event_type: 'manual',
          item_label: 'CRT Cross-Reference Update',
          item_key: 'crt_crossref_update',
          note: buildNoteText(cf, ''),
          logged_by: user?.email || '',
          logged_by_name: user?.full_name || '',
          compass_entered: false,
        };
        const payload = {
          first_name,
          last_name,
          ...entityUpdates,
          status: 'new',
          crossref_pending_triage: true,
          roadmap_progress_notes: [entry],
        };
        try {
          const created = await base44.asServiceRole.entities.Client.create(payload);
          anyClientCreated = true;
          results[idx] = { hsid: cf.hsid || '', name: cf.participant_name || '', matched: false, created: true, client_id: created.id };
        } catch (e) {
          results[idx] = { hsid: cf.hsid || '', name: cf.participant_name || '', matched: false, created: false, error: e.message };
        }
      }
    }

    // A client file was updated or created (e.g. DEA start date, EDA completion,
    // 90-day outcome, or a brand-new client added to the cross-ref triage list). The Invoice
    // Tracker's billing-summary tallies — CEIS (DEA) Starters, WD Complete,
    // WD Placement, CEIS (DEA) 90 Day, WD 90 Day, Service Navigation Fee — are
    // derived from those same client fields, so refresh them on the active
    // workbook's Invoice Tracker now so the push flows through to the tallies
    // immediately instead of waiting for the monthly advance. (The CRT row
    // itself is re-synced by the "CRT Sync on Client Update" entity automation
    // that already fired on the update/create above.)
    // Refresh Invoice Tracker billing tallies on EVERY open workbook — not
    // just the active one. Each monthly CRT has its own Invoice Tracker sheet,
    // so a cross-ref field change (DEA start, EDA completion, 90-day outcome,
    // etc.) must flow through to all open months' tallies immediately, the
    // same way the CRT Client Data sync already writes to all open months.
    // Closed/frozen months are skipped.
    let billingCounts = null;
    if (anyClientUpdated || anyClientCreated) {
      try {
        const token = await getGraphToken();
        const files = await listCrtFiles(token);
        let closedNames = new Set();
        try {
          const closed = await base44.asServiceRole.entities.CrtWorkbook.filter({ status: 'closed' });
          closedNames = new Set(closed.map(r => r.file_name));
        } catch { /* default: nothing closed */ }
        const openFiles = files.filter(f => !closedNames.has(f.name));
        // Fetch ALL clients + financial records ONCE and reuse across every
        // workbook's Invoice Tracker refresh. Without this, each workbook
        // re-fetches up to 5000 clients + 5000 financial records — for 5 open
        // months that's 10 massive list calls and a 2+ minute runtime that
        // times out the frontend request.
        let allClients = [];
        try { allClients = await base44.asServiceRole.entities.Client.list('-created_date', 5000) || []; } catch { /* empty */ }
        let allFinancialRecords = [];
        try { allFinancialRecords = await base44.asServiceRole.entities.FinancialRecord.list('-date', 5000) || []; } catch { /* empty */ }
        const preFetched = { clients: allClients, financialRecords: allFinancialRecords };
        const perWorkbook = [];
        for (const f of openFiles) {
          try {
            const r = await refreshBillingCounts(base44, token, f, undefined, preFetched);
            perWorkbook.push({ workbook: f.name, status: r.status, countFilled: r.countFilled?.length || 0, dFilled: r.dFilled?.length || 0, countErrors: r.countErrors?.length || 0 });
          } catch (e) {
            perWorkbook.push({ workbook: f.name, status: 'error', error: String(e.message || e).slice(0, 200) });
          }
        }
        billingCounts = { status: 'success', workbooks: perWorkbook };
      } catch (e) {
        billingCounts = { status: 'error', error: String(e.message || e).slice(0, 200) };
      }
    }

    return Response.json({ status: 'success', results, billingCounts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}