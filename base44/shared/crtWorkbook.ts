// Shared constants + helpers for CRT workbook integration (SharePoint + Graph API)

export const SITE_ID = 'candorasociety.sharepoint.com,f2b11287-ba40-4ff8-8b9e-3f3878083f2c,5320ae2f-1df9-4fd5-9164-f070316e3f53';
export const DRIVE_ID = 'b!hxKx8kC6-E-Lnj84eAg_LC-uIFP5HdVPkWTwcDFuP1P7ca7jYKZ5Ra_M7gnd5aOy';
export const PATHWAYS_FOLDER = '_DEPT_Pathways';
export const FINANCE_FOLDER = '_VAULT_Finance';
export const MASTER_TEMPLATE_NAME = 'CRT_Master_Template.xlsx';
export const CLIENT_DATA_SHEET = 'Client Data';
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
  // Sort by name descending — CRT_March_2026.xlsx > CRT_February_2026.xlsx
  crtFiles.sort((a, b) => b.name.localeCompare(a.name));
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
  crtFiles.sort((a, b) => b.name.localeCompare(a.name));
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
export function mapClientToCrtRow(client) {
  const fullName = `${(client.last_name || '').trim()}, ${(client.first_name || '').trim()}`.trim();

  // CEIS (DEA) — Y/N
  const ceis = client.service_type === 'direct_to_employment' ? 'Yes' : 'No';

  // Service Element
  const serviceElementMap = {
    'direct_to_employment': 'CEIS',
    'pathways': 'WD',
  };
  const serviceElement = serviceElementMap[client.service_type] || '';

  // Service Outcome
  const serviceOutcomeMap = {
    'in_progress': 'In Progress',
    'complete': 'Complete',
    'incomplete': 'Incomplete',
    'cancelled': 'Cancelled',
  };
  const serviceOutcome = serviceOutcomeMap[client.program_status] || '';

  // Placement Outcome (map portal values to CRT-accepted values)
  let placementOutcome = '';
  if (client.post_completion_employment_status) {
    const raw = client.post_completion_employment_status;
    if (CRT_PLACEMENT_VALUES.includes(raw)) {
      placementOutcome = raw;
    } else if (raw === 'UE') placementOutcome = 'UE-LFW';
    else if (raw === 'UE-S') placementOutcome = 'UE-NLF';
    else if (raw === 'E-PT') placementOutcome = 'E-RF'; // Part-time → related field default
  }

  // 90 Day Outcome
  let day90Outcome = '';
  if (client.followup_90day_status) {
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
    '',                                                // D: DEA Start Date
    serviceElement,                                    // E: Service Element
    formatDateForCrt(client.service_start_date),       // F: Service Start Date
    serviceOutcome,                                    // G: Service Outcome
    formatDateForCrt(client.completion_date),           // H: Service Outcome Date
    placementOutcome,                                  // I: Placement Outcome
    formatDateForCrt(client.post_completion_employment_date), // J: Placement Outcome Date
    '',                                                // K: 30 Day Outcome
    '',                                                // L: 30 Day Outcome Date
    '',                                                // M: 60 Day Outcome
    '',                                                // N: 60 Day Outcome Date
    day90Outcome,                                      // O: 90 Day Outcome
    formatDateForCrt(client.followup_90day_date),     // P: 90 Day Outcome Date
    '',                                                // Q: 180 Day Outcome
    '',                                                // R: 180 Day Outcome Date
    client.intake_notes || '',                         // S: Comments
    '',                                                // T: EDA Completion Date
    workExposure,                                      // U: Work Exposure Y/N
    'No',                                              // V: Wage subsidy accessed Y/N
    employedFtPt,                                      // W: Employed FT/PT
    serviceNav,                                        // X: Service Navigation Support Y/N
    formatDateForCrt(client.service_navigation_date), // Y: Service Nav Billing Month
  ];
}