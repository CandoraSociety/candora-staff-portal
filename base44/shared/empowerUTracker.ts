// Shared helpers for the EmpowerU official funder-reporting tracker workbook.
// The EmpowerU portal remains the operational interface; these helpers keep the
// official Excel workbook (stored in SharePoint) synchronized automatically via
// the Graph Excel REST API — edits happen on the real file, so formatting,
// formulas, worksheets and binder list structure are preserved.
// EmpowerU-only: fully independent of the Pathways CRT integration.
import { DRIVE_ID, getGraphToken } from "./crtWorkbook.ts";

export { getGraphToken };

export const TRACKER_ROOT_PATH = "EmpowerU/Funder Reports";
export const TEMPLATE_FOLDER_PATH = "EmpowerU/Funder Reports/_PRIVATE_Master Templates";
export const MASTER_TEMPLATE_NAME = "EmpowerU_Tracker_Master_Template.xlsx";
// The official EmpowerU workbook supplied with the build — stored once as the
// protected master template, then duplicated per cohort. Never edited afterwards.
export const MASTER_TEMPLATE_URL =
  "https://media.base44.com/files/public/6a249282cb496579542673b7/1bd62419c_ListofParticipants-Fall2026.xlsx";

const GRAPH = "https://graph.microsoft.com/v1.0";
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const SYNCED_STATUSES = ["enrolled", "completed"];

// The official workbook's full width: columns A–Y (the tracker's 25 columns).
const TRACKER_WIDTH = 25;

// ---------- small utils ----------

export function asArray(page) {
  if (!page) return [];
  return Array.isArray(page) ? page : (page.items || []);
}

export function formatWrittenDate(startStr) {
  if (!startStr) return null;
  const m = String(startStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${MONTHS[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}, ${m[1]}`;
  const d = new Date(startStr);
  if (isNaN(d.getTime())) return null;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Cohort program date range in the official funder format:
// "Month D, YYYY to Month D, YYYY" (full month names — never numeric/abbreviated).
export function formatWrittenDateRange(startStr, endStr) {
  const a = formatWrittenDate(startStr);
  const b = formatWrittenDate(endStr);
  if (a && b) return `${a} to ${b}`;
  return a || b || "";
}

export function sanitizeFileName(name) {
  return String(name || "Tracker").replace(/["#%*:<>?/\\|{}]/g, "").trim() || "Tracker";
}

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function colLettersToIndex(letters) {
  let n = 0;
  for (const ch of String(letters).toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function indexToColLetters(i) {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

async function gfetch(url, token, init = {}) {
  return fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

// ---------- workbook structure detection ----------

// Header row = the row containing the official "No." and "NAME" headings.
export function findTrackerHeaderRow(values) {
  for (let r = 0; r < Math.min(values.length, 10); r++) {
    const row = values[r] || [];
    if (norm(row[1]) === "no" && norm(row[2]) === "name") return r;
    const hasName = row.some((c) => norm(c) === "name");
    const hasNo = row.some((c) => norm(c) === "no");
    if (hasName && hasNo) return r;
  }
  return -1;
}

// Matches the template's own style ("October 15 - December 17, 2026") AND the
// required written format ("October 15, 2026 to December 17, 2026").
const DATE_RANGE_RE = /^[A-Za-z]{3,9}\s+\d{1,2}(,\s*\d{4})?\s*(–|-|—|to)\s*[A-Za-z]{3,9}\s+\d{1,2}.*$/;

export function isDateRangeString(v) {
  return typeof v === "string" && DATE_RANGE_RE.test(v.trim());
}

// The date-range cell = wherever the template itself carried its date range
// (same location/formatting preserved; only the value is replaced). Returns
// MATRIX indices within the used range — convert with sheet.startRow/startCol
// before using absolute cell() coordinates.
export function findDateRangeCell(values) {
  for (let r = 0; r < Math.min(values.length, 8); r++) {
    const row = values[r] || [];
    for (let c = 0; c < row.length; c++) {
      const v = row[c];
      if (isDateRangeString(v)) return { row: r, col: c, value: v };
    }
  }
  return null;
}

// Map the tracker's actual headings to fields — never assume fixed column
// letters. Disambiguates the two "phone number" headings (participant vs bank
// representative section) positionally.
export function buildTrackerColumnMap(headerRow) {
  const byNormAll = {};
  (headerRow || []).forEach((h, i) => {
    const n = norm(h);
    if (n) (byNormAll[n] = byNormAll[n] || []).push(i);
  });
  const first = (n) => {
    const a = byNormAll[n];
    return a && a.length ? a[0] : -1;
  };
  const after = (n, fromIdx) => {
    if (fromIdx < 0) return first(n);
    const hit = (byNormAll[n] || []).find((i) => i > fromIdx);
    return hit !== undefined ? hit : -1;
  };
  const repIdx = first("bankrepresentative");
  const curEmailIdx = first("currentemail");
  const phones = byNormAll["phonenumber"] || [];
  const map = {
    no: first("no"),
    name: first("name"),
    phone: phones.find((i) => curEmailIdx < 0 || i < curEmailIdx) ?? -1,
    email: curEmailIdx,
    cp_registration_form: first("registrationform"),
    cp_qualtrics: first("qualtrics"),
    cp_binder: first("binder"),
    bank_account_opened: first("bankaccountopened"),
    ambassador_name: first("ambasadorname"), // official workbook spelling preserved
    bank_representative: repIdx,
    bank_representative_phone: after("phonenumber", repIdx),
    bank_representative_email: after("email", repIdx),
    atb_amount: first("atb"),
    saved_amount: first("saved"),
    total_amount: first("total"),
    bank: first("bank"),
    account_type: first("typeaccount"),
    savings_goal: first("goal"),
    cp_pre_asset_map: first("preassetmap"),
    cp_post_asset_map: first("postassetmap"),
    cp_post_questionnaire: first("postquestionnaire"),
    cp_completion_form: first("programcompletionform"),
    cp_asset_description: first("assetdescriptionform"),
    notes: first("notes"),
  };
  const required = [
    "name", "phone", "email", "cp_registration_form", "cp_qualtrics", "cp_binder",
    "bank_account_opened", "ambassador_name", "cp_pre_asset_map", "cp_post_asset_map",
    "cp_post_questionnaire", "cp_completion_form", "cp_asset_description", "notes",
  ];
  return { map, missingRequired: required.filter((k) => map[k] === undefined || map[k] < 0) };
}

// ---------- Graph Excel / SharePoint primitives ----------

export async function listWorksheetNames(token, fileId) {
  const res = await gfetch(`${GRAPH}/drives/${DRIVE_ID}/items/${fileId}/workbook/worksheets`, token);
  if (!res.ok) throw new Error("Could not list workbook worksheets: " + (await res.text()).slice(0, 200));
  const data = await res.json();
  return (data.value || []).map((s) => s.name);
}

// Reads a worksheet's used range with values AND formulas (one call) so cells
// governed by a formula (e.g. TOTAL) can be preserved instead of overwritten.
export async function readSheet(token, fileId, sheetName) {
  const res = await gfetch(
    `${GRAPH}/drives/${DRIVE_ID}/items/${fileId}/workbook/worksheets('${sheetName}')/usedRange`,
    token
  );
  if (!res.ok) throw new Error(`Could not read worksheet '${sheetName}': ` + (await res.text()).slice(0, 200));
  const data = await res.json();
  // Address arrives as "Sheet1!A2:Y31" (sheet-prefixed) or "A2:Y31" — take the
  // top-left cell of the range. A failed parse would silently offset every
  // matrix→Excel row conversion, so match the segment before the colon.
  const m = String(data.address || "A1").match(/([A-Z]+)(\d+):/);
  return {
    values: data.values || [],
    formulas: data.formulas || [],
    startRow: m ? parseInt(m[2], 10) : 1,
    startCol: m ? colLettersToIndex(m[1]) : 0,
    address: data.address,
  };
}

export async function patchRangeValues(token, fileId, sheetName, address, values) {
  const res = await gfetch(
    `${GRAPH}/drives/${DRIVE_ID}/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='${address}')`,
    token,
    { method: "PATCH", body: JSON.stringify({ values }) }
  );
  if (!res.ok) throw new Error(`Excel write failed (${sheetName}!${address}): ` + (await res.text()).slice(0, 200));
  return true;
}

// Patch a cell given as USED-RANGE MATRIX indices (values[r][c]) — converts
// to absolute sheet coordinates accounting for the used range's start offset.
export async function patchSheetCellByIndex(token, fileId, sheetName, sheet, matrixRow, matrixCol, value) {
  const excelRow = sheet.startRow + matrixRow; // 1-based Excel row
  const colIdx = sheet.startCol + matrixCol;    // 0-based Excel column
  return patchCell(token, fileId, sheetName, excelRow - 1, colIdx, value);
}

export async function patchCell(token, fileId, sheetName, row, col, value) {
  const res = await gfetch(
    `${GRAPH}/drives/${DRIVE_ID}/items/${fileId}/workbook/worksheets('${sheetName}')/cell(row=${row},column=${col})`,
    token,
    { method: "PATCH", body: JSON.stringify({ values: [[value]] }) }
  );
  if (!res.ok) {
    throw new Error(`Excel cell write failed (${sheetName} r${row}c${col}): ` + (await res.text()).slice(0, 200));
  }
  return true;
}

export async function ensureFolderPath(token, segments) {
  let parentId = "root";
  let path = "";
  for (const seg of segments) {
    path += (path ? "/" : "") + seg;
    let res = await gfetch(`${GRAPH}/drives/${DRIVE_ID}/root:/${path}`, token);
    if (res.ok) {
      parentId = (await res.json()).id;
      continue;
    }
    const create = await gfetch(`${GRAPH}/drives/${DRIVE_ID}/items/${parentId}/children`, token, {
      method: "POST",
      body: JSON.stringify({ name: seg, folder: {}, "@microsoft.graph.conflictBehavior": "fail" }),
    });
    if (create.ok) {
      parentId = (await create.json()).id;
      continue;
    }
    res = await gfetch(`${GRAPH}/drives/${DRIVE_ID}/root:/${path}`, token);
    if (res.ok) {
      parentId = (await res.json()).id;
      continue;
    }
    throw new Error(`Could not create SharePoint folder '${path}': ` + (await create.text()).slice(0, 200));
  }
  return { id: parentId, path };
}

// Stores the attached official workbook as the protected master template
// (once). The master is only ever duplicated — participant data is never
// written into it.
export async function ensureMasterTemplate(token) {
  const folder = await ensureFolderPath(token, TEMPLATE_FOLDER_PATH.split("/"));
  const list = await gfetch(`${GRAPH}/drives/${DRIVE_ID}/items/${folder.id}/children`, token);
  const children = list.ok ? (await list.json()).value || [] : [];
  const existing = children.find((f) => f.name === MASTER_TEMPLATE_NAME);
  if (existing) return existing.id;
  const fileRes = await fetch(MASTER_TEMPLATE_URL);
  if (!fileRes.ok) throw new Error("Could not fetch the official master template workbook");
  const bytes = await fileRes.arrayBuffer();
  const up = await fetch(`${GRAPH}/drives/${DRIVE_ID}/items/${folder.id}:/${MASTER_TEMPLATE_NAME}:/content`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream" },
    body: bytes,
  });
  if (!up.ok) throw new Error("Could not store the master template in SharePoint: " + (await up.text()).slice(0, 200));
  const item = await up.json();
  return item.id;
}

export async function copyWorkbook(token, templateFileId, destFolderId, fileName) {
  const copyRes = await gfetch(`${GRAPH}/drives/${DRIVE_ID}/items/${templateFileId}/copy`, token, {
    method: "POST",
    body: JSON.stringify({ parentReference: { id: destFolderId }, name: fileName }),
  });
  if (!copyRes.ok && copyRes.status !== 202) {
    throw new Error("Workbook copy request failed: " + (await copyRes.text()).slice(0, 200));
  }
  const loc = copyRes.headers.get("Location");
  if (loc) {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const poll = await fetch(loc, { headers: { Authorization: `Bearer ${token}` } });
        if (poll.status === 200) break;
      } catch { /* keep polling */ }
    }
  }
  const got = await gfetch(`${GRAPH}/drives/${DRIVE_ID}/root:/${TRACKER_ROOT_PATH}/${fileName}`, token);
  if (!got.ok) throw new Error("Cohort workbook was not found after copy");
  return await got.json();
}

// Find the worksheet that holds the participant tracker (No./NAME headings).
export async function getTrackerSheet(token, fileId) {
  const names = await listWorksheetNames(token, fileId);
  for (const n of names) {
    const sheet = await readSheet(token, fileId, n);
    if (findTrackerHeaderRow(sheet.values) >= 0) return { name: n, sheet };
  }
  throw new Error("Could not find the participant tracker worksheet — the workbook's structure does not match the official template");
}

// The official template carries its cohort date range in the top area of the
// tracker (the template's date-range cell(s)). Update every matching cell so
// both of the template's date lines reflect the cohort range.
export async function writeAllDateRangeCells(token, fileId, sheetName, sheet, dateRangeStr) {
  let updated = false;
  for (let r = 0; r < Math.min(sheet.values.length, 8); r++) {
    const row = sheet.values[r] || [];
    for (let c = 0; c < row.length; c++) {
      if (isDateRangeString(row[c]) && String(row[c]).trim() !== dateRangeStr) {
        await patchSheetCellByIndex(token, fileId, sheetName, sheet, r, c, dateRangeStr);
        updated = true;
      }
    }
  }
  return updated;
}

// Prepares a freshly copied cohort workbook: writes the cohort's date range
// into the same cell(s) the template used, and clears any binder-list names
// carried over from the master so each cohort starts clean (numbering kept).
export async function initCohortWorkbook(token, fileId, dateRangeStr) {
  const names = await listWorksheetNames(token, fileId);
  const tracker = await getTrackerSheet(token, fileId);
  await writeAllDateRangeCells(token, fileId, tracker.name, tracker.sheet, dateRangeStr);
  for (const n of names) {
    if (n === tracker.name) continue;
    const s = await readSheet(token, fileId, n);
    const rowsToClear = [];
    for (let r = 0; r < s.values.length; r++) {
      const row = s.values[r] || [];
      if (typeof row[1] === "string" && row[1].trim() && row[0] !== "" && !isNaN(Number(row[0]))) {
        rowsToClear.push(r);
      }
    }
    if (rowsToClear.length) {
      const first = s.startRow + rowsToClear[0];
      const last = s.startRow + rowsToClear[rowsToClear.length - 1];
      await patchRangeValues(token, fileId, n, `B${first}:B${last}`, rowsToClear.map(() => [""]));
    }
  }
  return { trackerSheet: tracker.name };
}

// Updates the date range in an EXISTING cohort workbook (cohort dates changed).
// Never re-creates the workbook for a date change.
export async function refreshCohortDateRange(token, fileId, dateRangeStr) {
  const tracker = await getTrackerSheet(token, fileId);
  if (!findDateRangeCell(tracker.sheet.values)) {
    throw new Error("Date-range cell not found in the cohort workbook — structure may have changed");
  }
  return writeAllDateRangeCells(token, fileId, tracker.name, tracker.sheet, dateRangeStr);
}

export async function fileItemToBase64(token, fileId) {
  const res = await fetch(`${GRAPH}/drives/${DRIVE_ID}/items/${fileId}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Could not read the workbook file (${res.status})`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

// ---------- Base44 record helpers ----------

export async function getWorkbookRecord(base44, cohortId) {
  const page = await base44.asServiceRole.entities.EmpowerUCohortWorkbook.filter({ cohort_id: cohortId });
  return asArray(page)[0] || null;
}

export async function logSync(base44, cohort, action, result, message, participantName) {
  try {
    await base44.asServiceRole.entities.EmpowerUTrackerSyncLog.create({
      cohort_id: cohort.id,
      cohort_name: cohort.name,
      participant_name: participantName || "",
      action,
      result,
      message: String(message || "").slice(0, 500),
    });
  } catch { /* audit logging must never break the sync itself */ }
}

// Creates (once) or returns the cohort-specific official workbook record.
// Idempotent — safe to retry after a failure without duplicating the cohort.
export async function ensureCohortWorkbook(base44, token, cohort) {
  let record = await getWorkbookRecord(base44, cohort.id);
  if (record && record.workbook_file_id) return { record, created: false };

  const dateRange = formatWrittenDateRange(cohort.start_date, cohort.end_date);
  if (!record) {
    record = await base44.asServiceRole.entities.EmpowerUCohortWorkbook.create({
      cohort_id: cohort.id,
      cohort_name: cohort.name,
      status: "error",
      last_sync_error: "Workbook creation in progress",
    });
  }
  try {
    const destFolder = await ensureFolderPath(token, TRACKER_ROOT_PATH.split("/"));
    const templateId = await ensureMasterTemplate(token);
    const fileName = sanitizeFileName(`EmpowerU Tracker - ${cohort.name}`) + ".xlsx";
    const item = await copyWorkbook(token, templateId, destFolder.id, fileName);
    await initCohortWorkbook(token, item.id, dateRange);
    const updates = await base44.asServiceRole.entities.EmpowerUCohortWorkbook.update(record.id, {
      workbook_file_id: item.id,
      workbook_file_name: item.name,
      date_range: dateRange,
      status: "ready",
      last_sync_error: "",
      last_sync_result: "created",
      participant_count: 0,
      row_map: [],
    });
    return { record: { ...record, ...updates }, created: true };
  } catch (e) {
    await base44.asServiceRole.entities.EmpowerUCohortWorkbook.update(record.id, {
      status: "error",
      last_sync_error: String(e.message || e).slice(0, 500),
    });
    throw e;
  }
}

// ---------- the sync engine ----------

// Writes mapped participant information into the correct existing row of the
// cohort workbook. Row identity = backend row_map keyed by registration_id
// (no ID column is added to the official workbook). New participants claim the
// first available numbered row; cells governed by formulas are never touched.
export async function syncRegistrationsToWorkbook(token, wbRecord, registrations, participantsById) {
  const tracker = await getTrackerSheet(token, wbRecord.workbook_file_id);
  const sheet = tracker.sheet;
  const headerIdx = findTrackerHeaderRow(sheet.values);
  if (headerIdx < 0) throw new Error("Tracker headings not found — workbook structure mismatch");
  const { map, missingRequired } = buildTrackerColumnMap(sheet.values[headerIdx] || []);
  if (missingRequired.length) {
    throw new Error(`Tracker headings missing or changed (${missingRequired.join(", ")}) — workbook not updated`);
  }

  const colCount = Math.max(TRACKER_WIDTH, (sheet.values[headerIdx] || []).length);
  const dataStartIdx = headerIdx + 1;
  const rowMap = Array.isArray(wbRecord.row_map) ? [...wbRecord.row_map] : [];

  // Next sequential tracker number for appended rows (No. is per-cohort, not a DB id)
  let maxNo = 0;
  for (let r = dataStartIdx; r < sheet.values.length; r++) {
    const v = (sheet.values[r] || [])[map.no];
    const n = Number(v);
    if (v !== "" && v !== null && v !== undefined && !isNaN(n)) maxNo = Math.max(maxNo, n);
  }

  // cursor for appending rows beyond the current used range
  let appendCursor = Math.max(sheet.values.length, dataStartIdx);
  const mappedExcelRows = new Set(rowMap.map((e) => e.row_number));
  const results = [];
  let newRowsAdded = 0;

  for (const reg of registrations) {
    try {
      if (!SYNCED_STATUSES.includes(reg.status)) {
        results.push({ registration_id: reg.id, status: "skipped", reason: reg.status });
        continue;
      }
      const p = participantsById[reg.participant_id] || null;
      let entry = rowMap.find((e) => e.registration_id === reg.id);
      let rowIdx;
      let excelRow;
      let isNewRow = false;

      if (entry && entry.row_number - sheet.startRow >= dataStartIdx) {
        rowIdx = entry.row_number - sheet.startRow;
        excelRow = entry.row_number;
      } else {
        // claim the first available numbered/empty data row — never the header
        // row or above, even if a stale/offset read shifts the indices
        for (let r = dataStartIdx; r < sheet.values.length; r++) {
          const row = sheet.values[r] || [];
          const nameV = row[map.name] ?? "";
          const noV = row[map.no] ?? "";
          const excel = sheet.startRow + r;
          if (r <= headerIdx) continue;
          if (!String(nameV).trim() && (noV === "" || !isNaN(Number(noV))) && !mappedExcelRows.has(excel)) {
            rowIdx = r;
            excelRow = excel;
            break;
          }
        }
        if (rowIdx === undefined) {
          rowIdx = appendCursor;
          appendCursor += 1;
          excelRow = sheet.startRow + rowIdx;
        }
        isNewRow = true;
        entry = {
          registration_id: reg.id,
          participant_id: reg.participant_id,
          participant_name: reg.participant_name || (p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() : ""),
          row_number: excelRow,
        };
        rowMap.push(entry);
        mappedExcelRows.add(excelRow);
        newRowsAdded += 1;
      }

      // compose the row: start from existing values, replace only mapped fields,
      // never overwriting cells governed by a formula (e.g. a TOTAL formula).
      const existing = [...(sheet.values[rowIdx] || [])];
      while (existing.length < colCount) existing.push("");
      const formulas = [...(sheet.formulas[rowIdx] || [])];
      while (formulas.length < colCount) formulas.push("");
      const out = existing.map((v) => (v === null || v === undefined ? "" : v));
      const writeCol = (idx, v) => {
        if (idx === undefined || idx < 0) return;
        const f = formulas[idx];
        if (typeof f === "string" && f.trim().startsWith("=")) return; // preserve formulas
        out[idx] = v;
      };

      if (isNewRow && map.no >= 0 && String(out[map.no] ?? "").trim() === "") {
        maxNo += 1;
        out[map.no] = maxNo;
      }

      const ck = (b) => (b ? "✓" : "");
      writeCol(map.name, p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() : (reg.participant_name || ""));
      writeCol(map.phone, (p && p.phone) || "");
      writeCol(map.email, (p && p.email) || "");
      writeCol(map.cp_registration_form, ck(reg.cp_registration_form));
      writeCol(map.cp_qualtrics, ck(reg.cp_qualtrics));
      writeCol(map.cp_binder, ck(reg.cp_binder));
      writeCol(map.bank_account_opened, ck(reg.bank_account_opened));
      writeCol(map.ambassador_name, reg.ambassador_name || "");
      writeCol(map.bank_representative, reg.bank_representative || "");
      writeCol(map.bank_representative_phone, reg.bank_representative_phone || "");
      writeCol(map.bank_representative_email, reg.bank_representative_email || "");
      writeCol(map.atb_amount, typeof reg.atb_amount === "number" ? reg.atb_amount : (reg.atb_amount ?? ""));
      writeCol(map.saved_amount, typeof reg.saved_amount === "number" ? reg.saved_amount : (reg.saved_amount ?? ""));
      writeCol(map.total_amount, typeof reg.total_amount === "number" ? reg.total_amount : (reg.total_amount ?? ""));
      writeCol(map.bank, reg.bank || "");
      writeCol(map.account_type, reg.account_type || "");
      writeCol(map.savings_goal, reg.savings_goal || "");
      writeCol(map.cp_pre_asset_map, ck(reg.cp_pre_asset_map));
      writeCol(map.cp_post_asset_map, ck(reg.cp_post_asset_map));
      writeCol(map.cp_post_questionnaire, ck(reg.cp_post_questionnaire));
      writeCol(map.cp_completion_form, ck(reg.cp_completion_form));
      writeCol(map.cp_asset_description, ck(reg.cp_asset_description));
      writeCol(map.notes, reg.progress_notes || "");

      // Write starting at the used range's actual first column — hardcoding "A"
      // would shift the whole row left whenever the sheet's used range doesn't
      // begin at column A (this template keeps column A entirely empty).
      const startColLetters = indexToColLetters(sheet.startCol);
      await patchRangeValues(
        token,
        wbRecord.workbook_file_id,
        tracker.name,
        `${startColLetters}${excelRow}:${indexToColLetters(sheet.startCol + colCount - 1)}${excelRow}`,
        [out]
      );
      results.push({
        registration_id: reg.id,
        participant_name: entry.participant_name,
        row: excelRow,
        status: isNewRow ? "added" : "updated",
      });
    } catch (e) {
      results.push({
        registration_id: reg.id,
        status: "error",
        error: String(e.message || e).slice(0, 300),
      });
    }
  }

  return { results, rowMap, newRowsAdded, trackerSheet: tracker.name };
}

// End-to-end sync for one cohort: ensures the workbook exists, loads the
// cohort's enrolled/completed registrations + participant profiles, writes the
// mapped rows, and updates the workbook record's sync status + row map.
export async function syncCohort(base44, token, cohortId) {
  const cohort = await base44.asServiceRole.entities.EmpowerUCohort.get(cohortId);
  if (!cohort) throw new Error("Cohort not found: " + cohortId);
  const { record, created } = await ensureCohortWorkbook(base44, token, cohort);

  const regPage = await base44.asServiceRole.entities.EmpowerURegistration.filter({
    cohort_id: cohortId,
    status: { $in: SYNCED_STATUSES },
  });
  const regs = asArray(regPage);
  const byId = {};
  const pIds = [...new Set(regs.map((r) => r.participant_id).filter(Boolean))];
  for (const pid of pIds) {
    try {
      const p = await base44.asServiceRole.entities.EmpowerUParticipant.get(pid);
      if (p) byId[pid] = p;
    } catch { /* participant record missing — fall back to registration data */ }
  }

  const { results, rowMap, newRowsAdded } = await syncRegistrationsToWorkbook(token, record, regs, byId);
  const errors = results.filter((r) => r.status === "error");
  const now = new Date().toISOString();
  const updated = await base44.asServiceRole.entities.EmpowerUCohortWorkbook.update(record.id, {
    row_map: rowMap,
    participant_count: rowMap.length,
    last_synced_at: now,
    last_sync_result: errors.length ? "error" : "success",
    last_sync_error: errors.length ? errors.map((r) => r.error).join("; ").slice(0, 500) : "",
    status: errors.length ? "error" : "ready",
  });
  const freshRecord = { ...record, ...updated };

  if (errors.length) {
    await logSync(base44, cohort, "sync_participants", "error", errors.map((r) => r.error).join("; "));
  } else if (newRowsAdded > 0) {
    await logSync(
      base44,
      cohort,
      "sync_participants",
      "success",
      `${newRowsAdded} participant row(s) added to the cohort workbook (${rowMap.length} total)`
    );
  }
  return { cohort, record: freshRecord, created, results, errors };
}