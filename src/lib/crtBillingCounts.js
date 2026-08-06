// Computes billing-relevant counts for a CRT viewing month by mirroring the
// column-derivation logic in base44/shared/crtWorkbook.ts (mapClientToCrtRow).
// We replicate the column logic here (rather than importing the shared module)
// because that module uses Deno APIs unsuitable for the browser bundle.
//
// Counts only include clients whose relevant CRT column date falls WITHIN the
// viewing calendar month (derived from the CRT_<Month>_<Year>.xlsx filename).

const CRT_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function parseCrtMonth(fileName) {
  if (!fileName) return null;
  const m = String(fileName).match(/CRT_(\w+)_(\d{4})/i);
  if (!m) return null;
  const monthName = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  const month = CRT_MONTHS.indexOf(monthName);
  if (month < 0) return null;
  return { year: parseInt(m[2], 10), month };
}

// Format any date-like input (ISO string, 'YYYY-MM-DD', or Date) as YYYY-MM-DD
// using local time, so ISO string comparison reflects the viewer's calendar.
function toISO(d) {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(typeof d === 'string' && d.length === 10 ? d + 'T12:00:00' : d);
  if (isNaN(date.getTime())) return '';
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

// Mirror of mapClientToCrtRow (crtWorkbook.ts) — returns only the columns needed
// for the billing summary, with dates as ISO YYYY-MM-DD (gated by monthEnd so
// the values match exactly what the CRT would show for that month).
function mapClientToCrtRowLite(client, monthEnd) {
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
  } else if (client.program_status === 'incomplete') {
    serviceOutcome = 'Incomplete';
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
  if (followupTriggered) {
    if (isDea) {
      const sod = mostRecentEdaDate || client.eda_completion_date;
      if (sod) {
        const projected = new Date(sod.length === 10 ? sod + 'T12:00:00' : sod);
        projected.setDate(projected.getDate() + 90);
        day90Date = toISO(projected);
      }
    } else if (client.followup_90day_date) {
      day90Date = toISO(client.followup_90day_date);
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
  if (isWd && serviceNav === 'Yes') {
    serviceNavBillingMonth = day90Date;
  }

  return {
    isDea,
    isWd,
    D: isDea ? startDateGated : '', // DEA Start Date
    G: serviceOutcome, // Service Outcome
    H: serviceOutcomeDate, // Service Outcome Date
    I: placementOutcome, // Placement Outcome
    J: placementOutcomeDate, // Placement Outcome Date
    O: day90Outcome, // 90 Day Outcome
    P: day90Date, // 90 Day Outcome Date
    X: serviceNav, // Service Navigation Support Y/N
    Y: serviceNavBillingMonth, // Service Nav Billing Month
  };
}

const EMPLOYED = ['E-RF', 'E-UF', 'SE'];

function inMonth(iso, startISO, endISO) {
  if (!iso) return false;
  return iso >= startISO && iso <= endISO;
}

export function computeCrtBillingCounts(clients, fileName) {
  const parsed = parseCrtMonth(fileName);
  if (!parsed || !Array.isArray(clients)) {
    return {
      hasMonth: false,
      monthLabel: '',
      deaStarters: 0,
      wdPlacementCompletion: 0,
      wdComplete: 0,
      dea90Day: 0,
      wd90Day: 0,
      serviceNavFee: 0,
    };
  }
  const { year, month } = parsed;
  // monthEnd = last day of viewing month (the CRT point-in-time gate)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
  const startISO = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endISO = toISO(new Date(year, month + 1, 0));
  const monthLabel = `${CRT_MONTHS[month]} ${year}`;

  let deaStarters = 0;
  let wdPlacementCompletion = 0;
  let wdComplete = 0;
  let dea90Day = 0;
  let wd90Day = 0;
  let serviceNavFee = 0;

  for (const client of clients) {
    const row = mapClientToCrtRowLite(client, monthEnd);
    // 1. CEIS (DEA) Starters — DEA Start Date (D) in viewing month
    if (row.isDea && inMonth(row.D, startISO, endISO)) deaStarters++;
    // 2. WD Placement (EDA Completion) — Service Outcome (G) Complete + Service Outcome Date (H) in viewing month
    if (row.isWd && row.G === 'Complete' && inMonth(row.H, startISO, endISO)) wdPlacementCompletion++;
    // 3. WD Complete — Placement Outcome (I) in E-RF/E-UF/SE + Placement Outcome Date (J) in viewing month
    if (row.isWd && EMPLOYED.includes(row.I) && inMonth(row.J, startISO, endISO)) wdComplete++;
    // 4. CEIS (DEA) 90 Day — 90 Day Outcome (O) in E-RF/E-UF/SE + 90 Day Outcome Date (P) in viewing month
    if (row.isDea && EMPLOYED.includes(row.O) && inMonth(row.P, startISO, endISO)) dea90Day++;
    // 5. WD 90 Day — 90 Day Outcome (O) in E-RF/E-UF/SE + 90 Day Outcome Date (P) in viewing month
    if (row.isWd && EMPLOYED.includes(row.O) && inMonth(row.P, startISO, endISO)) wd90Day++;
    // 6. Service Navigation Fee — Service Nav (X) Yes + Service Nav Billing Month (Y) in viewing month
    if ((row.X === 'Yes' || row.X === 'Y') && inMonth(row.Y, startISO, endISO)) serviceNavFee++;
  }

  return {
    hasMonth: true,
    monthLabel,
    deaStarters,
    wdPlacementCompletion,
    wdComplete,
    dea90Day,
    wd90Day,
    serviceNavFee,
  };
}