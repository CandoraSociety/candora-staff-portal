import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW,
  getGraphToken, getActiveCrtWorkbook
} from '../../shared/crtWorkbook.ts';

// Convert MM/DD/YY (or MM/DD/YYYY) Excel date string → YYYY-MM-DD
function parseCrtDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;
  // Already ISO?
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return s.slice(0, 10);
  // MM/DD/YY or MM/DD/YYYY
  const parts = s.split('/');
  if (parts.length === 3) {
    let [mm, dd, yy] = parts;
    mm = mm.padStart(2, '0');
    dd = dd.padStart(2, '0');
    if (yy.length === 2) yy = '20' + yy;
    if (yy.length === 4) yy = yy;
    if (mm && dd && yy && Number(mm) <= 12 && Number(dd) <= 31) {
      return `${yy}-${mm}-${dd}`;
    }
  }
  // Excel serial date number
  const num = Number(s);
  if (!isNaN(num) && num > 30000 && num < 80000) {
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }
  return null;
}

// Parse "Last, First" → { first_name, last_name }
function parseName(fullName) {
  const s = String(fullName || '').trim();
  if (!s) return { first_name: '', last_name: '' };
  const idx = s.indexOf(',');
  if (idx >= 0) {
    return {
      last_name: s.slice(0, idx).trim(),
      first_name: s.slice(idx + 1).trim(),
    };
  }
  const parts = s.split(/\s+/);
  if (parts.length >= 2) {
    return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
  }
  return { first_name: s, last_name: '' };
}

// Reverse-map a CRT row (25 columns A–Y) → Client entity fields
function parseCrtRowToClient(row) {
  const name = parseName(row[0]);
  const serviceElement = String(row[4] || '').trim().toUpperCase();
  const ceisFlag = String(row[2] || '').trim().toUpperCase();
  const serviceOutcome = String(row[6] || '').trim().toLowerCase().replace(/\s+/g, '_');
  const placementOutcome = String(row[8] || '').trim();
  const day90Outcome = String(row[14] || '').trim();
  const workExposure = String(row[20] || '').trim().toUpperCase() === 'YES';
  const employedFtPt = String(row[22] || '').trim().toUpperCase();
  const serviceNav = String(row[23] || '').trim().toUpperCase() === 'YES';

  // Determine service_type from Service Element (E) or CEIS flag (C)
  let serviceType = '';
  if (serviceElement === 'CEIS') serviceType = 'direct_to_employment';
  else if (serviceElement === 'WD') serviceType = 'pathways';
  else if (ceisFlag === 'YES') serviceType = 'direct_to_employment';

  // Map service outcome → program_status
  const outcomeMap = {
    'in_progress': 'in_progress',
    'complete': 'complete',
    'completed': 'complete',
    'incomplete': 'incomplete',
    'cancelled': 'cancelled',
  };
  const programStatus = outcomeMap[serviceOutcome] || '';

  // Map placement outcome → post_completion_employment_status
  let postCompletionStatus = '';
  if (placementOutcome === 'E-RF') postCompletionStatus = 'E-RF';
  else if (placementOutcome === 'E-UF') postCompletionStatus = 'E-UF';
  else if (placementOutcome === 'E-PT') postCompletionStatus = 'E-PT';
  else if (placementOutcome === 'SE') postCompletionStatus = 'E-PT';
  else if (placementOutcome === 'UE-LFW') postCompletionStatus = 'UE-LFW';
  else if (placementOutcome === 'UE-NLF') postCompletionStatus = 'UE-S';
  else if (placementOutcome === 'FTT') postCompletionStatus = 'E-PT';
  else if (placementOutcome === 'AoP') postCompletionStatus = 'E-PT';

  // Map 90 day outcome → followup_90day_status
  let followupStatus = '';
  if (day90Outcome === 'E-RF') followupStatus = 'E-RF';
  else if (day90Outcome === 'E-UF') followupStatus = 'E-UF';
  else if (day90Outcome === 'E-PT') followupStatus = 'E-PT';
  else if (day90Outcome === 'SE') followupStatus = 'E-PT';
  else if (day90Outcome === 'UE-LFW') followupStatus = 'UE-LFW';
  else if (day90Outcome === 'UE-NLF') followupStatus = 'UE-NLFW';
  else if (day90Outcome === 'FTT') followupStatus = 'E-PT';
  else if (day90Outcome === 'UTC') followupStatus = 'UTC';
  else if (day90Outcome === 'C') followupStatus = 'no_contact';
  else if (day90Outcome === 'P') followupStatus = 'no_contact';

  const client = {
    first_name: name.first_name,
    last_name: name.last_name,
    compass_hsid: String(row[1] || '').trim() || null,
    service_type: serviceType || null,
    service_start_date: parseCrtDate(row[5]),
    program_status: programStatus || null,
    completion_date: parseCrtDate(row[7]),
    post_completion_employment_status: postCompletionStatus || null,
    post_completion_employment_date: parseCrtDate(row[9]),
    followup_90day_status: followupStatus || null,
    followup_90day_date: parseCrtDate(row[15]),
    intake_notes: String(row[18] || '').trim() || null,
    paid_external_placement: workExposure || null,
    exposure_course: workExposure || null,
    job_hours: employedFtPt === 'FT' ? 'Full-time' : employedFtPt === 'PT' ? 'Part-time' : null,
    service_navigation_supports: serviceNav || null,
    service_navigation_date: parseCrtDate(row[24]),
    status: 'active',
    self_registered: false,
  };

  // Remove null values to keep the record clean
  Object.keys(client).forEach(k => {
    if (client[k] === null) delete client[k];
  });

  return client;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get the user's name from Employee entity (fallback to user.full_name)
    let workerName = user.full_name || user.email;
    let workerEmail = user.email;
    try {
      const emp = await base44.entities.Employee.filter({ email: user.email });
      if (emp.length > 0 && emp[0].first_name) {
        workerName = `${emp[0].first_name} ${emp[0].last_name || ''}`.trim();
      }
    } catch { /* Employee lookup is best-effort */ }

    const accessToken = await getGraphToken();
    const activeWorkbook = await getActiveCrtWorkbook(accessToken);
    if (!activeWorkbook) {
      return Response.json({ error: 'No active CRT workbook found in SharePoint.' }, { status: 404 });
    }

    // Read the Client Data sheet
    const rangeRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${activeWorkbook.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!rangeRes.ok) {
      return Response.json({ error: 'Failed to read Client Data sheet', details: await rangeRes.text() }, { status: 500 });
    }
    const rangeData = await rangeRes.json();
    const allValues = rangeData.values || [];

    // Collect CRT client rows (from row 15, 1-based → index 14)
    const crtRows = [];
    for (let i = CLIENT_DATA_START_ROW - 1; i < allValues.length; i++) {
      const row = allValues[i];
      if (row && row[0] && String(row[0]).trim()) {
        // Ensure row has at least 25 columns
        const padded = [...row];
        while (padded.length < 25) padded.push('');
        crtRows.push(padded);
      }
    }

    if (crtRows.length === 0) {
      return Response.json({
        status: 'success',
        message: 'No client rows found in the CRT workbook (rows from row 15 with a name in column A).',
        created: 0,
        skipped: 0,
      });
    }

    // Get existing HSIDs to avoid duplicates
    const existingClients = await base44.asServiceRole.entities.Client.list();
    const existingHsids = new Set(
      existingClients.filter(c => c.compass_hsid).map(c => String(c.compass_hsid).trim())
    );
    const existingNames = new Set(
      existingClients.map(c => `${(c.first_name || '').toLowerCase()}|${(c.last_name || '').toLowerCase()}`)
    );

    // Build new client records
    const newClients = [];
    let skipped = 0;
    for (const row of crtRows) {
      const client = parseCrtRowToClient(row);
      if (!client.first_name && !client.last_name) { skipped++; continue; }

      const hsidKey = client.compass_hsid ? String(client.compass_hsid).trim() : null;
      const nameKey = `${(client.first_name || '').toLowerCase()}|${(client.last_name || '').toLowerCase()}`;

      if (hsidKey && existingHsids.has(hsidKey)) { skipped++; continue; }
      if (!hsidKey && existingNames.has(nameKey)) { skipped++; continue; }

      // Assign to current user
      client.assigned_worker = workerEmail;
      client.assigned_worker_name = workerName;

      newClients.push(client);
      if (hsidKey) existingHsids.add(hsidKey);
      existingNames.add(nameKey);
    }

    if (newClients.length === 0) {
      return Response.json({
        status: 'success',
        message: 'All CRT clients already exist in the portal (matched by HSID or name).',
        created: 0,
        skipped,
        totalCrtRows: crtRows.length,
      });
    }

    // Bulk create (max 500 per call)
    let created = 0;
    for (let i = 0; i < newClients.length; i += 500) {
      const batch = newClients.slice(i, i + 500);
      const result = await base44.asServiceRole.entities.Client.bulkCreate(batch);
      created += Array.isArray(result) ? result.length : batch.length;
    }

    return Response.json({
      status: 'success',
      workbook: activeWorkbook.name,
      totalCrtRows: crtRows.length,
      created,
      skipped,
      assignedTo: workerName,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}