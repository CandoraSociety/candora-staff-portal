import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as XLSX from 'npm:xlsx@0.18.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });

    // Download the uploaded file
    const response = await fetch(file_url);
    if (!response.ok) return Response.json({ error: 'Failed to download file' }, { status: 502 });
    const arrayBuffer = await response.arrayBuffer();

    // Parse the workbook
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

    // Find the header row — CRT format has "Participant Legal Name" in col 0
    let headerIdx = -1;
    let isCRT = false;
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const firstCell = String((rows[i] || [])[0] || '').toLowerCase();
      if (firstCell.includes('participant legal name')) {
        headerIdx = i;
        isCRT = true;
        break;
      }
    }

    // Fallback: standard column headers (First Name, Last Name, etc.)
    if (!isCRT) {
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const rowStr = (rows[i] || []).map(c => String(c || '').toLowerCase()).join('|');
        if (rowStr.includes('first name') || rowStr.includes('last name')) {
          headerIdx = i;
          break;
        }
      }
    }

    if (headerIdx === -1) {
      return Response.json({ error: 'Could not find a header row. Use the CRT format or include First Name / Last Name columns.' }, { status: 400 });
    }

    let records = [];

    if (isCRT) {
      // Extract counsellor name from metadata rows above the header
      let prevCounsellor = "Other";
      let counsellorOther = "";
      for (let i = 0; i < headerIdx; i++) {
        if (String((rows[i] || [])[0] || '').includes('Career Counsellor')) {
          const name = String((rows[i] || [])[1] || '').toLowerCase();
          if (name.includes('priscilla')) prevCounsellor = "Priscilla";
          else if (name.includes('lola')) prevCounsellor = "Lola";
          else counsellorOther = String((rows[i] || [])[1] || '').trim();
          break;
        }
      }

      // CRT data starts after header row + format hint row
      const dataRows = rows.slice(headerIdx + 2).filter(r => r[0] && String(r[0]).trim());

      // Excel serial date → ISO date string
      const serialToDate = (val) => {
        if (!val && val !== 0) return null;
        const num = Number(val);
        if (!isNaN(num) && num > 30000 && num < 60000) {
          const d = new Date(Math.round((num - 25569) * 86400 * 1000));
          return d.toISOString().split('T')[0];
        }
        const str = String(val).trim();
        if (!str) return null;
        // Try parsing date strings like MM/DD/YY or MM/DD/YYYY
        const m = str.match(/^(\d{1,2})[\/\\](\d{1,2})[\/\\](\d{2,4})$/);
        if (m) {
          let [_, mm, dd, yy] = m;
          if (yy.length === 2) yy = '20' + yy;
          return `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
        const parsed = new Date(str);
        if (!isNaN(parsed)) return parsed.toISOString().split('T')[0];
        return str;
      };

      const ynToBool = (val) => String(val || '').trim().toLowerCase() === 'y' || String(val || '').trim().toLowerCase() === 'yes';

      records = dataRows.map(row => {
        const fullName = String(row[0] || '').trim();
        let firstName = '', lastName = '';
        if (fullName.includes(',')) {
          const parts = fullName.split(',').map(s => s.trim()).filter(Boolean);
          lastName = parts[0] || '';
          firstName = parts.slice(1).join(' ');
        } else {
          const parts = fullName.split(/\s+/);
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }

        const serviceOutcome = String(row[8] || '').trim();
        const serviceElement = String(row[6] || '').trim();
        const comments = String(row[20] || '').trim().replace(/<br\s*\/?>/gi, '\n');
        const employedFtPt = String(row[24] || '').trim();

        return {
          first_name: firstName,
          last_name: lastName,
          phone: String(row[3] || '').trim(),
          email: String(row[2] || '').trim(),
          compass_hsid: String(row[1] || '').trim(),
          previous_counsellor: prevCounsellor,
          previous_counsellor_other: counsellorOther,
          new_counsellor: "Olena",
          transition_status: "not_started",
          priority: "medium",
          next_checkin_date: null,
          last_checkin_date: null,
          checkin_frequency: "weekly",
          checkin_notes: "",
          program_stage: serviceOutcome || serviceElement || "",
          service_element: serviceElement,
          service_start_date: serialToDate(row[7]),
          service_outcome: serviceOutcome,
          service_outcome_date: serialToDate(row[9]),
          placement_outcome: String(row[10] || '').trim(),
          placement_outcome_date: serialToDate(row[11]),
          outcome_30day: String(row[12] || '').trim(),
          outcome_30day_date: serialToDate(row[13]),
          outcome_60day: String(row[14] || '').trim(),
          outcome_60day_date: serialToDate(row[15]),
          outcome_90day: String(row[16] || '').trim(),
          outcome_90day_date: serialToDate(row[17]),
          outcome_180day: String(row[18] || '').trim(),
          outcome_180day_date: serialToDate(row[19]),
          employed_ftpt: employedFtPt,
          service_navigation_support: ynToBool(row[25]),
          work_exposure: ynToBool(row[22]),
          wage_subsidy: ynToBool(row[23]),
          notes: comments,
          milestones: [],
        };
      }).filter(r => r.first_name && r.last_name);
    } else {
      // Standard format with named columns
      const headers = (rows[headerIdx] || []).map(h => String(h || '').toLowerCase().trim());
      const dataRows = rows.slice(headerIdx + 1).filter(r => r.some(c => String(c || '').trim()));

      const getVal = (row, ...keys) => {
        for (const k of keys) {
          const idx = headers.findIndex(h => h.includes(k));
          if (idx >= 0 && row[idx]) return String(row[idx]).trim();
        }
        return "";
      };

      records = dataRows.map(row => {
        const prevRaw = getVal(row, 'previous counsellor', 'counsellor', 'from').toLowerCase();
        let prevCounsellor = "Lola";
        let counsellorOther = "";
        if (prevRaw.includes('priscilla')) prevCounsellor = "Priscilla";
        else if (prevRaw.includes('lola')) prevCounsellor = "Lola";
        else if (prevRaw) { prevCounsellor = "Other"; counsellorOther = prevRaw; }

        const priorityRaw = getVal(row, 'priority').toLowerCase();
        let priority = "medium";
        if (priorityRaw.includes('high')) priority = "high";
        else if (priorityRaw.includes('low')) priority = "low";

        return {
          first_name: getVal(row, 'first name', 'first_name', 'given name'),
          last_name: getVal(row, 'last name', 'last_name', 'surname', 'family name'),
          phone: getVal(row, 'phone', 'telephone', 'tel'),
          email: getVal(row, 'email', 'e-mail'),
          previous_counsellor: prevCounsellor,
          previous_counsellor_other: counsellorOther,
          new_counsellor: "Olena",
          transition_status: "not_started",
          priority,
          next_checkin_date: getVal(row, 'next check', 'next_checkin') || null,
          last_checkin_date: getVal(row, 'last check', 'last_checkin') || null,
          checkin_frequency: "weekly",
          checkin_notes: getVal(row, 'checkin notes', 'check-in notes'),
          program_stage: getVal(row, 'program stage', 'stage', 'service element'),
          notes: getVal(row, 'notes', 'comments'),
          milestones: [],
        };
      }).filter(r => r.first_name && r.last_name);
    }

    return Response.json({ records, count: records.length, isCRT });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});