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

// Parse a CRT date cell (MM/DD/YY, MM/DD/YYYY, ISO YYYY-MM-DD, or Excel serial)
// → YYYY-MM-DD, or null if unparseable/empty. Shared with importCrtClients.
export function parseCrtDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return s.slice(0, 10);
  const parts = s.split('/');
  if (parts.length === 3) {
    let [mm, dd, yy] = parts;
    mm = mm.padStart(2, '0');
    dd = dd.padStart(2, '0');
    if (yy.length === 2) yy = '20' + yy;
    if (mm && dd && yy && Number(mm) <= 12 && Number(dd) <= 31) return `${yy}-${mm}-${dd}`;
  }
  const num = Number(s);
  if (!isNaN(num) && num > 30000 && num < 80000) {
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  return null;
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



  // Most recently completed EDA activity date (DEA clients) — the actual last
  // activity completion date from the dea_activities log. Used as the Service
  // Outcome Date for DEA clients (per reporting requirement). Falls back to
  // eda_completion_date when no individual activity completion dates are recorded.
  const deaActivities = Array.isArray(client.dea_activities) ? client.dea_activities : [];
  const completedEdaDates = deaActivities.map(a => a.completed_date).filter(Boolean).sort();
  const mostRecentEdaDate = completedEdaDates.length ? completedEdaDates[completedEdaDates.length - 1] : null;

  // CEIS (DEA) — Y/N
  const ceis = isDea ? 'Yes' : 'No';

  // Service Element
  const serviceElementMap = {
    'direct_to_employment': 'CEIS',
    'pathways': 'WD',
  };
  const serviceElement = serviceElementMap[client.service_type] || '';

  // Service Outcome — Complete is triggered by EDA completion
  // (eda_completion_date), not full program completion. For DEA clients the
  // Service Outcome Date is the most recently completed EDA activity date.
  // Incomplete/Cancelled follow program_status.
  const edaOK = gate(client.eda_completion_date);
  let serviceOutcome = 'In Progress';
  let serviceOutcomeDate = '';
  if (edaOK && client.eda_completion_date) {
    serviceOutcome = 'Complete';
    const sodSource = isDea ? (mostRecentEdaDate || client.eda_completion_date) : client.eda_completion_date;
    serviceOutcomeDate = gate(sodSource) ? formatDateForCrt(sodSource) : '';
  } else if (client.program_status === 'complete') {
    // Legacy: program marked complete before eda_completion_date was tracked
    serviceOutcome = 'Complete';
    serviceOutcomeDate = gate(client.completion_date) ? formatDateForCrt(client.completion_date) : '';
  } else if (client.program_status === 'cancelled') {
    serviceOutcome = 'Cancelled';
  } else if (client.program_status === 'incomplete') {
    serviceOutcome = 'Incomplete';
  }

  // Placement Outcome — WD only. Once the Service Outcome is "Complete", default
  // to "P" (Pending) until an actual post-completion employment outcome is
  // recorded. DEA clients: columns I and J stay blank (not applicable).
  const placementOK = gate(client.post_completion_employment_date);
  const placementOutcome = (isWd && serviceOutcome === 'Complete')
    ? ((placementOK && client.post_completion_employment_status) || 'P')
    : '';

  // 90 Day follow-up is "triggered" (projected) once employment is found (WD) or
  // EDAs are marked complete (DEA). Before the actual outcome is recorded, the
  // 90 Day Outcome shows 'P' (Pending) and the date is the projected date
  // (90 days after the trigger event). For DEA clients the projected 90-day
  // date is 90 days after the Service Outcome Date (most recent EDA activity).
  const followupTriggered = isDea
    ? (!!client.eda_completion_date && gate(client.eda_completion_date))
    : (!!client.employment_start_date && gate(client.employment_start_date));

  // 90 Day Outcome — actual status if recorded, else 'P' once triggered. NOT
  // month-bound: a Pending ('P') entry and its scheduled date must remain
  // visible in the CRT even when the 90-day date falls after the workbook's
  // month-end, because 'P' means the 90-day follow-up is scheduled for that
  // future date. (Other date columns stay gated; 90-day is intentionally
  // forward-looking.)
  const day90Outcome = client.followup_90day_status || (followupTriggered ? 'P' : '');

  // 90 Day Outcome Date — the recorded follow-up date when a 90-day outcome
  // has been entered (status + date), otherwise the projected/scheduled date
  // (90 days after the trigger event: most recent EDA activity for DEA,
  // employment_start_date for WD). Not month-bound — see day90Outcome above.
  let day90DateForCrt = '';
  if (client.followup_90day_status && client.followup_90day_date) {
    day90DateForCrt = formatDateForCrt(client.followup_90day_date);
  } else if (followupTriggered) {
    const triggerDate = isDea ? (mostRecentEdaDate || client.eda_completion_date) : client.employment_start_date;
    if (triggerDate) {
      const projected = new Date(triggerDate + 'T12:00:00');
      projected.setDate(projected.getDate() + 90);
      day90DateForCrt = formatDateForCrt(projected);
    }
  }

  // Work Exposure Y/N — Y when a completed work exposure placement exists, or
  // when the action-plan flags indicate a paid external placement / exposure course.
  const workExposure = (client.paid_external_placement || client.exposure_course) ? 'Yes' : 'No';

  // Wage Subsidy Accessed Y/N — set when a work exposure placement was completed
  const wageSubsidy = client.wage_subsidy_accessed ? 'Yes' : 'No';

  // Service Navigation Support Y/N — WD: blank until a 90 Day Outcome is
  // entered. Once entered, "Yes" only if >= 2 barriers were resolved AND the
  // 90 Day Outcome is E-RF, E-UF, or SE; otherwise "No". DEA: 'N' while in the
  // 90-day follow-up period (EDAs complete, no outcome yet), blank otherwise.
  const resolvedBarriers = [1, 2, 3].filter(
    (i) => client[`barrier_${i}`] && client[`barrier_${i}_status`] === 'resolved'
  ).length;
  const inDeaFollowup = isDea && followupTriggered && !client.followup_90day_status;
  const SERVICENAV_OUTCOMES = ['E-RF', 'E-UF', 'SE'];
  const day90OutcomeEntered = !!(gate(client.followup_90day_date) && client.followup_90day_status);
  let serviceNav = '';
  if (isWd) {
    if (day90OutcomeEntered) {
      serviceNav = (resolvedBarriers >= 2 && SERVICENAV_OUTCOMES.includes(client.followup_90day_status)) ? 'Yes' : 'No';
    }
    // else: blank until a 90 Day Outcome is entered
  } else {
    serviceNav = inDeaFollowup ? 'N' : '';
  }

  // Service Navigation Support Billing Month — WD only. When column X is "Yes",
  // column Y mirrors column P (the 90 Day Outcome Date).
  let serviceNavBillingMonth = '';
  if (isWd && serviceNav === 'Yes') {
    serviceNavBillingMonth = day90DateForCrt;
  }

  // Employed FT/PT — explicit selection takes priority, else derive from job_hours text
  let employedFtPt = client.employed_ftpt || '';
  if (!employedFtPt && client.job_hours) {
    const hours = String(client.job_hours).toLowerCase();
    if (hours.includes('full') || hours.includes('ft')) employedFtPt = 'FT';
    else if (hours.includes('part') || hours.includes('pt')) employedFtPt = 'PT';
  }

  // Column S (Comments) — fully recomposed from CURRENT client state on every
  // sync (intake notes + resolved barrier notes + EDA/action-plan completions).
  // It is never append-only: each part is derived from a live field, so when an
  // action is undone (a barrier changed back to unresolved/in_progress, EDAs
  // un-marked complete, etc.) that part simply drops out of the recomposed
  // value. The entity-triggered sync force-writes column S (even when empty)
  // so the undone line is removed from the cell rather than left behind.
  // PRINCIPLE FOR FUTURE AUTOMATED COLUMN S POPULATION: always compose from
  // current client state — never append to the existing cell — so an undo
  // naturally clears the corresponding comment.
  const resolutionParts = [];
  for (let i = 1; i <= 3; i++) {
    if (client[`barrier_${i}`] && client[`barrier_${i}_status`] === 'resolved') {
      const note = String(client[`barrier_${i}_resolution_notes`] || '').trim();
      const endDate = client[`barrier_${i}_timeline_end`]
        ? formatDateForCrt(client[`barrier_${i}_timeline_end`])
        : '';
      if (note) {
        const dateTag = endDate ? ` (resolved ${endDate})` : '';
        resolutionParts.push(`Barrier ${i} resolved${dateTag}: ${note}`);
      }
    }
  }
  // EDA activity completion notes — each individually completed EDA, plus an
  // overall Action Plan completion note when all EDAs are marked complete (via
  // the "Mark EDAs as Complete" status action). Completion date is required for
  // individual EDAs, so each entry includes its MM/DD/YY completion date.
  const edaParts = [];
  if (isDea) {
    deaActivities.forEach(a => {
      if (a.completed_date && gate(a.completed_date)) {
        const label = String(a.type || 'EDA Activity').trim() || 'EDA Activity';
        edaParts.push(`EDA: ${label} completed (${formatDateForCrt(a.completed_date)})`);
      }
    });
  } else if (isWd) {
    const SDP_LABELS = {
      job_search_workshop: 'Job Search Workshop',
      resume_writing_workshop: 'Resume Writing Workshop',
      interview_skills_workshop: 'Interview Skills Workshop',
      workplace_readiness_workshop: 'Workplace Readiness Workshop',
      financial_literacy_workshop: 'Financial Literacy Workshop',
      digital_literacy_workshop: 'Digital Literacy Workshop',
      empoweru: 'EmpowerU',
      ell_classes: 'ELL Classes',
      skills_assessment: 'Skills Assessment',
      exposure_course: 'Exposure Course',
      employment_supports: 'Employment Supports',
      job_applications: 'Job Applications',
      networking: 'Networking',
      other: 'Other',
    };
    const EXCLUDED_SDP = ['barrier_support', 'internal_placement', 'paid_external_placement'];
    const roadmapStatus = client.roadmap_item_status || {};
    (client.sdp_items || []).forEach(key => {
      if (EXCLUDED_SDP.includes(key)) return;
      const st = roadmapStatus[key] || {};
      if (st.status === 'completed' && st.completed_date && gate(st.completed_date)) {
        const label = SDP_LABELS[key] || key.replace(/_/g, ' ');
        edaParts.push(`EDA: ${label} completed (${formatDateForCrt(st.completed_date)})`);
      }
    });
  }
  // Overall Action Plan completion — when all EDAs are marked complete
  if (client.eda_completion_date && gate(client.eda_completion_date)) {
    edaParts.push(`Action Plan completed (${formatDateForCrt(client.eda_completion_date)})`);
  }

  // Found Employment (WD only) — recorded via the "Found Employment" status
  // menu action. State-derived from the employment fields, so the line drops
  // out when "Undo Found Employment" clears them. Includes the employer name,
  // job title, hours/week, wage, and FT/PT where available.
  const employmentParts = [];
  if (isWd && client.post_completion_employment_date && gate(client.post_completion_employment_date)) {
    const bits = [];
    if (client.employer_name) bits.push(`Employer: ${client.employer_name}`);
    if (client.job_title) bits.push(`Job Title: ${client.job_title}`);
    if (client.job_hours) bits.push(`Hours/week: ${client.job_hours}`);
    if (client.job_wage !== undefined && client.job_wage !== null && client.job_wage !== '') {
      bits.push(`Wage: $${client.job_wage}/hr`);
    }
    if (client.employed_ftpt) {
      bits.push(client.employed_ftpt === 'FT' ? 'Full-Time' : 'Part-Time');
    }
    employmentParts.push(`Found Employment (${formatDateForCrt(client.post_completion_employment_date)}): ${bits.join('; ')}`);
  }

  // 90-Day Follow-up Outcome (WD and DEA) — recorded via the "Enter 90-Day
  // Follow-up Outcome" status menu action. State-derived from followup_90day_status
  // and followup_90day_date, so the line drops out when "Undo 90-Day Follow-up
  // Outcome" clears the status. For employment outcomes (E-RF, E-UF, SE) the
  // comment includes the same employment details as the Found Employment line
  // (employer, job title, hours/week, wage, FT/PT). For other outcomes the
  // comment reflects the selected status.
  const EMPLOYED_OUTCOMES = ['E-RF', 'E-UF', 'SE'];
  const OUTCOME_DESC = {
    'E-RF': 'Employed, Related Field',
    'E-UF': 'Employed, Unrelated Field',
    'SE': 'Self-Employed',
    'UE-LFW': 'Unemployed, Looking for Work',
    'UE-NLF': 'Unemployed, Not in Labour Force',
    'FTT': 'Further Training',
    'AoP': 'Attending other Program',
    'UTC': 'Unable to Contact',
    'P': 'Pending',
    'C': 'Cancelled',
  };
  const followupParts = [];
  if (client.followup_90day_status && gate(client.followup_90day_date)) {
    const fDate = formatDateForCrt(client.followup_90day_date);
    if (EMPLOYED_OUTCOMES.includes(client.followup_90day_status)) {
      const bits = [];
      if (client.employer_name) bits.push(`Employer: ${client.employer_name}`);
      if (client.job_title) bits.push(`Job Title: ${client.job_title}`);
      if (client.job_hours) bits.push(`Hours/week: ${client.job_hours}`);
      if (client.job_wage !== undefined && client.job_wage !== null && client.job_wage !== '') {
        bits.push(`Wage: $${client.job_wage}/hr`);
      }
      if (client.employed_ftpt) {
        bits.push(client.employed_ftpt === 'FT' ? 'Full-Time' : 'Part-Time');
      }
      followupParts.push(`At the 90 Day Follow up, the client was employed (${fDate})${bits.length ? ': ' + bits.join('; ') : ''}`);
    } else {
      const desc = OUTCOME_DESC[client.followup_90day_status] || client.followup_90day_status;
      followupParts.push(`At the 90 Day Follow up, the client was ${desc} (${client.followup_90day_status}) (${fDate})`);
    }
  }

  const commentsParts = [];
  if (client.intake_notes && String(client.intake_notes).trim()) {
    commentsParts.push(String(client.intake_notes).trim());
  }
  commentsParts.push(...resolutionParts);
  commentsParts.push(...edaParts);
  commentsParts.push(...employmentParts);
  commentsParts.push(...followupParts);
  // Staff-entered additional comments (from the Additional CRT Comments card
  // under the status menu). State-derived — drops out when the field is cleared.
  if (client.crt_additional_comments && String(client.crt_additional_comments).trim()) {
    commentsParts.push(String(client.crt_additional_comments).trim());
  }
  const comments = commentsParts.join(' | ');

  return [
    fullName,                                          // A: Client Legal Name
    client.compass_hsid || '',                         // B: COMPASS HSID #
    ceis,                                              // C: CEIS (DEA)
    isDea ? startDateForCrt : '',                      // D: DEA Start Date (DEA only)
    serviceElement,                                    // E: Service Element
    (isWd || isDea) ? startDateForCrt : '',              // F: Service Start Date (WD; DEA mirrors DEA Start Date — no other DEA auto-population keys off this column)
    serviceOutcome,                                    // G: Service Outcome
    serviceOutcomeDate,                                 // H: Service Outcome Date
    placementOutcome,                                  // I: Placement Outcome
    (isWd && placementOK) ? formatDateForCrt(client.post_completion_employment_date) : '', // J: Placement Outcome Date
    '',                                                // K: 30 Day Outcome
    '',                                                // L: 30 Day Outcome Date
    '',                                                // M: 60 Day Outcome
    '',                                                // N: 60 Day Outcome Date
    day90Outcome,                                      // O: 90 Day Outcome
    day90DateForCrt,                                    // P: 90 Day Outcome Date
    '',                                                // Q: 180 Day Outcome
    '',                                                // R: 180 Day Outcome Date
    comments,                                          // S: Comments
    (isWd && gate(client.eda_completion_date)) ? formatDateForCrt(client.eda_completion_date) : '',  // T: EDA Completion Date (WD only — CEIS/DEA leaves this blank, per the actual CRT convention)
    workExposure,                                      // U: Work Exposure Y/N
    wageSubsidy,                                       // V: Wage subsidy accessed Y/N
    employedFtPt,                                      // W: Employed FT/PT
    serviceNav,                                        // X: Service Navigation Support Y/N
    serviceNavBillingMonth,                            // Y: Service Nav Billing Month
  ];
}