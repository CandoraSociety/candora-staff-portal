// Shared constants + helpers for CRT workbook integration (SharePoint + Graph API)

export const SITE_ID = 'candorasociety.sharepoint.com,f2b11287-ba40-4ff8-8b9e-3f3878083f2c,5320ae2f-1df9-4fd5-9164-f070316e3f53';
export const DRIVE_ID = 'b!hxKx8kC6-E-Lnj84eAg_LC-uIFP5HdVPkWTwcDFuP1P7ca7jYKZ5Ra_M7gnd5aOy';
export const PATHWAYS_FOLDER = '_DEPT_Pathways';
export const FINANCE_FOLDER = '_VAULT_Finance';
export const MASTER_TEMPLATE_NAME = 'CRT_Master_Template.xlsx';
export const CLIENT_DATA_SHEET = 'Client Data';

// Month names in calendar order — used to sort CRT_<Month>_<Year> files chronologically
// (alphabetical sort is wrong: "April" < "March" even though April is the later month).
const CRT_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function crtFileDate(file) {
  const m = file.name.match(/CRT_(\w+)_(\d{4})/i);
  if (!m) return null;
  const month = CRT_MONTHS.indexOf(m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase());
  if (month < 0) return null;
  return { year: parseInt(m[2], 10), month };
}

function sortCrtFilesDesc(files) {
  return files.sort((a, b) => {
    const da = crtFileDate(a), db = crtFileDate(b);
    if (!da || !db) return b.name.localeCompare(a.name);
    return (db.year * 12 + db.month) - (da.year * 12 + da.month);
  });
}
// Parse a CRT_<Month>_<Year>.xlsx filename → the last day of that month (UTC Date),
// or null if the name doesn't parse. Used for month-bound sync so each monthly
// CRT only includes information dated through that month.
export function crtMonthEnd(fileName) {
  const m = String(fileName).match(/CRT_(\w+)_(\d{4})/i);
  if (!m) return null;
  const monthName = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  const monthIdx = CRT_MONTHS.indexOf(monthName);
  if (monthIdx < 0) return null;
  const year = parseInt(m[2], 10);
  return new Date(Date.UTC(year, monthIdx + 1, 0)); // day 0 of next month = last day of this month
}

export const CLIENT_DATA_START_ROW = 15; // 1-based Excel row where client data begins
export const NUM_COLUMNS = 25; // A through Y

// CRT accepted values (from Outcomes_Database sheet)
export const CRT_PLACEMENT_VALUES = ['E-RF', 'E-UF', 'SE', 'UE-LFW', 'UE-NLF', 'FTT', 'AoP', 'C', 'P'];
export const CRT_DAY_OUTCOME_VALUES = ['E-RF', 'E-UF', 'SE', 'UE-LFW', 'UE-NLF', 'FTT', 'AoP', 'UTC', 'C', 'P'];

// Get a Microsoft Graph access token using client credentials
export async function getGraphToken() {
  const tokenRes = await fetch(`https://login.microsoftonline.com/${Deno.env.get('AZURE_TENANT_ID')}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('AZURE_CLIENT_ID'),
      client_secret: Deno.env.get('AZURE_CLIENT_SECRET'),
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    })
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error('Failed to get Graph token: ' + JSON.stringify(tokenData));
  }
  return tokenData.access_token;
}

// Get the _DEPT_Pathways folder item
export async function getPathwaysFolder(accessToken) {
  const foldersRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root/children`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!foldersRes.ok) {
    throw new Error('Failed to list root folders: ' + await foldersRes.text());
  }
  const foldersData = await foldersRes.json();
  const folder = (foldersData.value || []).find(f => f.name === PATHWAYS_FOLDER);
  if (!folder) {
    throw new Error(`Pathways folder "${PATHWAYS_FOLDER}" not found in SharePoint`);
  }
  return folder;
}

// Find the active (latest) CRT workbook in _DEPT_Pathways (files matching CRT_*.xlsx, excluding Master)
export async function getActiveCrtWorkbook(accessToken) {
  const folder = await getPathwaysFolder(accessToken);
  const filesRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folder.id}/children`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!filesRes.ok) {
    throw new Error('Failed to list Pathways files: ' + await filesRes.text());
  }
  const filesData = await filesRes.json();
  const crtFiles = (filesData.value || []).filter(f =>
    /^CRT_.*\.xlsx$/i.test(f.name) && !/master/i.test(f.name)
  );
  if (crtFiles.length === 0) {
    return null;
  }
  // Sort by parsed month/year descending so the latest month is active
  // (alphabetical sort is wrong — "April" sorts before "March").
  sortCrtFilesDesc(crtFiles);
  return crtFiles[0];
}

// List all CRT files in Pathways folder (for display)
export async function listCrtFiles(accessToken) {
  const folder = await getPathwaysFolder(accessToken);
  const filesRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folder.id}/children`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!filesRes.ok) return [];
  const filesData = await filesRes.json();
  const crtFiles = (filesData.value || []).filter(f =>
    /^CRT_.*\.xlsx$/i.test(f.name) && !/master/i.test(f.name)
  );
  sortCrtFilesDesc(crtFiles);
  return crtFiles;
}

// Format a date string (ISO or YYYY-MM-DD) as MM/DD/YY for CRT
export function formatDateForCrt(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

// Map a Client entity to a CRT Client Data row (25 columns A–Y)
export function mapClientToCrtRow(client, monthEnd) {
  // monthEnd (Date|null): when set, date fields dated after monthEnd are blanked
  // (along with their companion status fields) so a monthly CRT only contains
  // information through that month — a point-in-time snapshot.
  const gate = (dateStr) => {
    if (!monthEnd || !dateStr) return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    return d.getTime() <= monthEnd.getTime();
  };

  const fullName = `${(client.last_name || '').trim()}, ${(client.first_name || '').trim()}`.trim();

  // Stream: DEA (CEIS) vs WD
  const isDea = client.service_type === 'direct_to_employment';
  const isWd = client.service_type === 'pathways';

  // Program start date (service_start_date), month-bound. Routed to either the
  // DEA Start Date column (DEA clients) or the Service Start Date column (WD
  // clients) — never both.
  const startDateForCrt = gate(client.service_start_date) ? formatDateForCrt(client.service_start_date) : '';

  // EDA completion date, month-bound (Service Outcome Date + WD EDA Completion column)
  const edaDateForCrt = gate(client.eda_completion_date) ? formatDateForCrt(client.eda_completion_date) : '';

  // CEIS (DEA) — Y/N
  const ceis = isDea ? 'Yes' : 'No';

  // Service Element
  const serviceElementMap = {
    'direct_to_employment': 'CEIS',
    'pathways': 'WD',
  };
  const serviceElement = serviceElementMap[client.service_type] || '';

  // Service Outcome — Complete is triggered by EDA completion
  // (eda_completion_date), not full program completion. The Service Outcome
  // Date is the EDA completion date. Incomplete/Cancelled follow program_status.
  const edaOK = gate(client.eda_completion_date);
  let serviceOutcome = 'In Progress';
  let serviceOutcomeDate = '';
  if (edaOK && client.eda_completion_date) {
    serviceOutcome = 'Complete';
    serviceOutcomeDate = formatDateForCrt(client.eda_completion_date);
  } else if (client.program_status === 'complete') {
    // Legacy: program marked complete before eda_completion_date was tracked
    serviceOutcome = 'Complete';
    serviceOutcomeDate = gate(client.completion_date) ? formatDateForCrt(client.completion_date) : '';
  } else if (client.program_status === 'cancelled') {
    serviceOutcome = 'Cancelled';
  } else if (client.program_status === 'incomplete') {
    serviceOutcome = 'Incomplete';
  }

  // Placement Outcome (map portal values to CRT-accepted values)
  const placementOK = gate(client.post_completion_employment_date);
  let placementOutcome = '';
  if (placementOK && client.post_completion_employment_status) {
    const raw = client.post_completion_employment_status;
    if (CRT_PLACEMENT_VALUES.includes(raw)) {
      placementOutcome = raw;
    } else if (raw === 'UE') placementOutcome = 'UE-LFW';
    else if (raw === 'UE-S') placementOutcome = 'UE-NLF';
    else if (raw === 'E-PT') placementOutcome = 'E-RF'; // Part-time → related field default
  }

  // 90 Day Outcome
  const day90OK = gate(client.followup_90day_date);
  let day90Outcome = '';
  if (day90OK && client.followup_90day_status) {
    const raw = client.followup_90day_status;
    if (CRT_DAY_OUTCOME_VALUES.includes(raw)) {
      day90Outcome = raw;
    } else if (raw === 'UE') day90Outcome = 'UE-LFW';
    else if (raw === 'UE-S') day90Outcome = 'UE-NLF';
    else if (raw === 'UE-NLFW') day90Outcome = 'UE-NLF';
    else if (raw === 'no_contact') day90Outcome = 'UTC';
    else if (raw === 'E-PT') day90Outcome = 'E-RF';
    else if (raw === 'E-URF') day90Outcome = 'E-UF';
  }

  // 90 Day Outcome Date — DEA: anticipated (EDA completion + 90 days), shown
  // from the month of the Service Outcome date onward (not gated by the future
  // 90-day date itself). WD: actual follow-up date, month-bound.
  const day90DateForCrt = isDea
    ? (gate(client.eda_completion_date) ? formatDateForCrt(client.followup_90day_date) : '')
    : (day90OK ? formatDateForCrt(client.followup_90day_date) : '');

  // Work Exposure Y/N
  const workExposure = (client.paid_external_placement || client.exposure_course) ? 'Yes' : 'No';

  // Service Navigation Support Y/N
  const serviceNav = client.service_navigation_supports ? 'Yes' : 'No';

  // Employed FT/PT
  let employedFtPt = '';
  if (client.job_hours) {
    const hours = String(client.job_hours).toLowerCase();
    if (hours.includes('full') || hours.includes('ft')) employedFtPt = 'FT';
    else if (hours.includes('part') || hours.includes('pt')) employedFtPt = 'PT';
  }
  if (!employedFtPt && client.post_completion_employment_status === 'E-PT') {
    employedFtPt = 'PT';
  }

  return [
    fullName,                                          // A: Client Legal Name
    client.compass_hsid || '',                         // B: COMPASS HSID #
    ceis,                                              // C: CEIS (DEA)
    isDea ? startDateForCrt : '',                      // D: DEA Start Date (DEA only)
    serviceElement,                                    // E: Service Element
    isWd ? startDateForCrt : '',                        // F: Service Start Date (WD only)
    serviceOutcome,                                    // G: Service Outcome
    serviceOutcomeDate,                                 // H: Service Outcome Date
    placementOutcome,                                  // I: Placement Outcome
    placementOK ? formatDateForCrt(client.post_completion_employment_date) : '', // J: Placement Outcome Date
    '',                                                // K: 30 Day Outcome
    '',                                                // L: 30 Day Outcome Date
    '',                                                // M: 60 Day Outcome
    '',                                                // N: 60 Day Outcome Date
    day90Outcome,                                      // O: 90 Day Outcome
    day90DateForCrt,                                    // P: 90 Day Outcome Date
    '',                                                // Q: 180 Day Outcome
    '',                                                // R: 180 Day Outcome Date
    client.intake_notes || '',                         // S: Comments
    isWd ? edaDateForCrt : '',                          // T: EDA Completion Date (WD only)
    workExposure,                                      // U: Work Exposure Y/N
    'No',                                              // V: Wage subsidy accessed Y/N
    employedFtPt,                                      // W: Employed FT/PT
    serviceNav,                                        // X: Service Navigation Support Y/N
    gate(client.service_navigation_date) ? formatDateForCrt(client.service_navigation_date) : '', // Y: Service Nav Billing Month
  ];
}