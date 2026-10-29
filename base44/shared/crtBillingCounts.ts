// Shared billing-count computation for the Invoice Tracker. Mirrors the
// column-derivation logic in mapClientToCrtRow (crtWorkbook.ts) and the
// frontend computeCrtBillingCounts (src/lib/crtBillingCounts.js). Returns the
// six billing-summary counts for a given calendar month, used to populate the
// per-month quantity columns of the Invoice Tracker sheet.
//
// Counts only include clients whose relevant CRT date falls WITHIN the given
// calendar month (gated by that month's end so values match the point-in-time
// CRT snapshot for the month).

import { CLIENT_DATA_START_ROW } from './crtWorkbook.ts';

const EMPLOYED = ['E-RF', 'E-UF', 'SE'];

function toISO(d) {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(typeof d === 'string' && d.length === 10 ? d + 'T12:00:00' : d);
  if (isNaN(date.getTime())) return '';
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

// Lite version of mapClientToCrtRow — returns only the fields the billing
// counts need, with dates as ISO YYYY-MM-DD (gated by monthEnd so the values
// match exactly what the CRT would show for that month).
function mapClientLite(client, monthEnd) {
  const gate = (dateStr) => {
    if (!monthEnd || !dateStr) return true;
    const d = new Date(typeof dateStr === 'string' && dateStr.length === 10 ? dateStr + 'T12:00:00' : dateStr);
    if (isNaN(d.getTime())) return true;
    return d.getTime() <= monthEnd.getTime();
  };

  const isDea = client.service_type === 'direct_to_employment';
  const isWd = client.service_type === 'pathways';

  const startDateGated = gate(client.service_start_date) ? toISO(client.service_start_date) : '';

  const deaActivities = Array.isArray(client.dea_activities) ? client.dea_activities : [];
  const completedEdaDates = deaActivities.map((a) => a.completed_date).filter(Boolean).sort();
  const mostRecentEdaDate = completedEdaDates.length ? completedEdaDates[completedEdaDates.length - 1] : null;

  const edaOK = gate(client.eda_completion_date);
  let serviceOutcome = 'In Progress';
  let serviceOutcomeDate = '';
  if (edaOK && client.eda_completion_date) {
    serviceOutcome = 'Complete';
    const sodSource = isDea ? (mostRecentEdaDate || client.eda_completion_date) : client.eda_completion_date;
    serviceOutcomeDate = gate(sodSource) ? toISO(sodSource) : '';
  } else if (client.program_status === 'complete') {
    serviceOutcome = 'Complete';
    serviceOutcomeDate = gate(client.completion_date) ? toISO(client.completion_date) : '';
  } else if (client.program_status === 'cancelled') {
    serviceOutcome = 'Cancelled';
    serviceOutcomeDate = gate(client.completion_date) ? toISO(client.completion_date) : '';
  } else if (client.program_status === 'incomplete') {
    serviceOutcome = 'Incomplete';
    serviceOutcomeDate = gate(client.completion_date) ? toISO(client.completion_date) : '';
  }

  const placementOK = gate(client.post_completion_employment_date);
  const placementOutcome = (isWd && serviceOutcome === 'Complete')
    ? (placementOK && client.post_completion_employment_status ? client.post_completion_employment_status : 'P')
    : '';
  const placementOutcomeDate = isWd && placementOK ? toISO(client.post_completion_employment_date) : '';

  const followupTriggered = isDea
    ? !!client.eda_completion_date && gate(client.eda_completion_date)
    : !!client.employment_start_date && gate(client.employment_start_date);

  const day90Outcome =
    (gate(client.followup_90day_date) && client.followup_90day_status) || (followupTriggered ? 'P' : '');

  let day90Date = '';
  // Column P (90 Day Outcome Date): use the recorded follow-up date whenever a
  // 90-day outcome has been entered (status + date), independent of
  // employment_start_date (see crtWorkbook.ts for full rationale).
  if (client.followup_90day_status && client.followup_90day_date && gate(client.followup_90day_date)) {
    day90Date = toISO(client.followup_90day_date);
  } else if (followupTriggered) {
    if (isDea) {
      const sod = mostRecentEdaDate || client.eda_completion_date;
      if (sod) {
        const projected = new Date(sod.length === 10 ? sod + 'T12:00:00' : sod);
        projected.setDate(projected.getDate() + 90);
        day90Date = toISO(projected);
      }
    }
  }

  const resolvedBarriers = [1, 2, 3].filter(
    (i) => client[`barrier_${i}`] && client[`barrier_${i}_status`] === 'resolved'
  ).length;
  const SERVICENAV_OUTCOMES = ['E-RF', 'E-UF', 'SE'];
  const day90OutcomeEntered = !!(gate(client.followup_90day_date) && client.followup_90day_status);
  let serviceNav = '';
  if (isWd) {
    if (day90OutcomeEntered) {
      serviceNav = resolvedBarriers >= 2 && SERVICENAV_OUTCOMES.includes(client.followup_90day_status) ? 'Yes' : 'No';
    }
  } else {
    const inDeaFollowup = isDea && followupTriggered && !client.followup_90day_status;
    serviceNav = inDeaFollowup ? 'N' : '';
  }

  let serviceNavBillingMonth = '';
  if (isWd && serviceNav === 'Yes') serviceNavBillingMonth = day90Date;

  return {
    isDea, isWd,
    D: '',                                      // DEA Start Date (blank — date lives in F; writing both double-counts in L10)
    F: (isWd || isDea) ? startDateGated : '',   // Service Start Date
    G: serviceOutcome,                         // Service Outcome
    H: serviceOutcomeDate,                     // Service Outcome Date
    I: placementOutcome,                        // Placement Outcome
    J: placementOutcomeDate,                    // Placement Outcome Date
    O: day90Outcome,                            // 90 Day Outcome
    P: day90Date,                               // 90 Day Outcome Date
    X: serviceNav,                             // Service Navigation Support Y/N
    Y: serviceNavBillingMonth,                  // Service Nav Billing Month
  };
}

function inMonth(iso, startISO, endISO) {
  if (!iso) return false;
  return iso >= startISO && iso <= endISO;
}

const SHEET_MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];

// Normalize a Client Data cell to ISO YYYY-MM-DD. Handles Excel serial dates
// (what the Graph API returns), MM/DD/YY text, ISO text and "Month YYYY".
function sheetCellToISO(v) {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number') {
    if (v > 30000 && v < 80000) {
      const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }
    return '';
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let yy = m[3];
    if (yy.length === 2) yy = (Number(yy) > 50 ? '19' : '20') + yy;
    return `${yy}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const mi = SHEET_MONTHS.indexOf(m[1].toLowerCase());
    if (mi >= 0) return `${m[2]}-${String(mi + 1).padStart(2, '0')}-01`;
  }
  return '';
}

// Client Data column indices (0-based, A = 0)
const CD = {
  ceis: 2,          // C — CEIS (DEA) Yes/No
  element: 4,       // E — Service Element (WD / CEIS)
  start: 5,         // F — Service Start Date
  outcome: 6,       // G — Service Outcome
  outcomeDate: 7,   // H — Service Outcome Date
  placeOutcome: 8,  // I — Placement Outcome
  placeDate: 9,     // J — Placement Outcome Date
  d90Outcome: 14,   // O — 90 Day Outcome
  d90Date: 15,      // P — 90 Day Outcome Date
  navSupport: 23,   // X — Service Navigation Support
  navMonth: 24,     // Y — Service Nav Billing Month
};

// Same six billing-summary counts, but read straight from the workbook's
// Client Data sheet — so the Invoice Tracker tallies always match what the CRT
// shows for that month. A date in column H only counts when column G is
// "Complete" (and the client's row still exists on the sheet).
export function computeMonthBillingCountsFromClientData(rows, year: number, month0: number) {
  const startISO = `${year}-${String(month0 + 1).padStart(2, '0')}-01`;
  const endISO = toISO(new Date(year, month0 + 1, 0));

  let deaStarters = 0;
  let wdPlacementCompletion = 0;
  let wdComplete = 0;
  let dea90Day = 0;
  let wd90Day = 0;
  let serviceNavFee = 0;

  for (let i = CLIENT_DATA_START_ROW - 1; i < (rows || []).length; i++) {
    const row = rows[i] || [];
    const isDea = String(row[CD.ceis] ?? '').trim().toLowerCase() === 'yes';
    const isWd = String(row[CD.element] ?? '').trim().toUpperCase() === 'WD';
    const F = sheetCellToISO(row[CD.start]);
    const G = String(row[CD.outcome] ?? '').trim();
    const H = sheetCellToISO(row[CD.outcomeDate]);
    const I = String(row[CD.placeOutcome] ?? '').trim();
    const J = sheetCellToISO(row[CD.placeDate]);
    const O = String(row[CD.d90Outcome] ?? '').trim();
    const P = sheetCellToISO(row[CD.d90Date]);
    const X = String(row[CD.navSupport] ?? '').trim();
    const Y = sheetCellToISO(row[CD.navMonth]);

    if (isDea && inMonth(F, startISO, endISO)) deaStarters++;
    if (isWd && G === 'Complete' && inMonth(H, startISO, endISO)) wdComplete++;
    if (isWd && EMPLOYED.includes(I) && inMonth(J, startISO, endISO)) wdPlacementCompletion++;
    if (isDea && EMPLOYED.includes(O) && inMonth(P, startISO, endISO)) dea90Day++;
    if (isWd && EMPLOYED.includes(O) && inMonth(P, startISO, endISO)) wd90Day++;
    if ((X === 'Yes' || X === 'Y') && inMonth(Y, startISO, endISO)) serviceNavFee++;
  }

  return { deaStarters, wdPlacementCompletion, wdComplete, dea90Day, wd90Day, serviceNavFee };
}

// Compute the six billing-summary counts for a single calendar month.
//   year  — full year (e.g. 2026)
//   month0 — 0-based month (0 = January)
export function computeMonthBillingCounts(clients, year, month0) {
  const monthEnd = new Date(year, month0 + 1, 0, 23, 59, 59);
  const startISO = `${year}-${String(month0 + 1).padStart(2, '0')}-01`;
  const endISO = toISO(new Date(year, month0 + 1, 0));

  let deaStarters = 0;
  let wdPlacementCompletion = 0;
  let wdComplete = 0;
  let dea90Day = 0;
  let wd90Day = 0;
  let serviceNavFee = 0;

  for (const client of (clients || [])) {
    const r = mapClientLite(client, monthEnd);
    if (r.isDea && inMonth(r.F, startISO, endISO)) deaStarters++;
    // X (wdComplete) — WD clients with G="Complete" and Service Outcome Date (H) in month
    if (r.isWd && r.G === 'Complete' && inMonth(r.H, startISO, endISO)) wdComplete++;
    // AN (wdPlacementCompletion) — WD clients with placement employment date (T) in month.
    // T mirrors J when I is employed (E-RF/E-UF/SE); blank otherwise.
    if (r.isWd && EMPLOYED.includes(r.I) && inMonth(r.J, startISO, endISO)) wdPlacementCompletion++;
    if (r.isDea && EMPLOYED.includes(r.O) && inMonth(r.P, startISO, endISO)) dea90Day++;
    if (r.isWd && EMPLOYED.includes(r.O) && inMonth(r.P, startISO, endISO)) wd90Day++;
    if ((r.X === 'Yes' || r.X === 'Y') && inMonth(r.Y, startISO, endISO)) serviceNavFee++;
  }

  return { deaStarters, wdPlacementCompletion, wdComplete, dea90Day, wd90Day, serviceNavFee };
}

// Running dollar total of all paid work-exposure placements billed in a given
// calendar month. Sums the `total` of every paid_external_placement
// FinancialRecord whose billing_month matches the month. Used to populate
// column CJ (Paid Work Exposure) of the Invoice Tracker sheet.
export function computeMonthWorkExposureTotal(financialRecords, year, month0) {
  const prefix = `${year}-${String(month0 + 1).padStart(2, '0')}`;
  return (financialRecords || [])
    .filter((r) => r.record_type === 'paid_external_placement' && r.billing_month === prefix)
    .reduce((s, r) => s + (Number(r.total) || 0), 0);
}

// Running dollar total of all employment-supports purchases billed in a given
// calendar month. Sums the `amount` (EXCLUDING tax — tax is documented but never
// reimbursable) of every employment_supports FinancialRecord whose billing_month
// matches the month. Used to populate column CI (Employment Supports) of the
// Invoice Tracker sheet as a cumulative running total.
export function computeMonthEmploymentSupportsTotal(financialRecords, year, month0) {
  const prefix = `${year}-${String(month0 + 1).padStart(2, '0')}`;
  return (financialRecords || [])
    .filter((r) => r.record_type === 'employment_supports' && r.billing_month === prefix)
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);
}

// Running dollar total of all exposure-course purchases billed in a given
// calendar month, SPLIT by the client's program:
//   dea = DEA clients (service_type 'direct_to_employment')  → column CF
//   wd  = WD clients  (service_type 'pathways')              → column CG
// Sums the `amount` (EXCLUDING tax — tax is documented but never reimbursable)
// of every exposure_course FinancialRecord whose billing_month matches the
// month. Used to populate columns CF / CG of the Invoice Tracker sheet as
// cumulative running totals.
export function computeMonthExposureCourseTotals(financialRecords, clients, year, month0) {
  const prefix = `${year}-${String(month0 + 1).padStart(2, '0')}`;
  const clientProgram: Record<string, string> = {};
  for (const c of (clients || [])) {
    if (!c.id) continue;
    if (c.service_type === 'direct_to_employment') clientProgram[c.id] = 'dea';
    else if (c.service_type === 'pathways') clientProgram[c.id] = 'wd';
  }
  let dea = 0, wd = 0;
  for (const r of (financialRecords || [])) {
    if (r.record_type !== 'exposure_course' || r.billing_month !== prefix) continue;
    const amt = Number(r.amount) || 0;
    const prog = clientProgram[r.client_id];
    if (prog === 'dea') dea += amt;
    else if (prog === 'wd') wd += amt;
  }
  return { dea, wd };
}