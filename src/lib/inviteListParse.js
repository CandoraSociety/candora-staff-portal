// Reads a pre-registration list out of a spreadsheet. CSV is parsed in the
// browser; XLSX is read straight out of the file's zip (no upload), so a list of
// families' contact details never leaves the staff member's machine until the
// invitations are actually created.
import Papa from 'papaparse';
import JSZip from 'jszip';

const EMPTY_ROW = () => ({ guardian_name: '', guardian_email: '', guardian_phone: '', children_allowed: 3 });

function decodeXml(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&');
}

const textOf = (fragment) => decodeXml(String(fragment || '').replace(/<[^>]+>/g, '')).trim();

function columnIndex(ref) {
  const letters = String(ref || '').replace(/[^A-Z]/g, '');
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return index - 1;
}

async function readXlsx(file) {
  const zip = await JSZip.loadAsync(file);

  const sharedFile = zip.file('xl/sharedStrings.xml');
  const shared = sharedFile
    ? [...(await sharedFile.async('string')).matchAll(/<si>([\s\S]*?)<\/si>/g)].map(match => textOf(match[1]))
    : [];

  const sheetFile = zip.file('xl/worksheets/sheet1.xml') || zip.file(/^xl\/worksheets\/.*\.xml$/)[0];
  if (!sheetFile) throw new Error('no worksheet found');
  const sheet = await sheetFile.async('string');

  return [...sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map(rowMatch => {
    const cells = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1] || '';
      const body = cellMatch[2] || '';
      const ref = (attrs.match(/r="([A-Z]+\d+)"/) || [])[1];
      const type = (attrs.match(/t="([^"]+)"/) || [])[1];
      const raw = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      let value = '';
      if (type === 's') value = shared[Number(textOf(raw))] || '';
      else if (type === 'inlineStr') value = textOf(body);
      else value = textOf(raw);
      const index = ref ? columnIndex(ref) : cells.length;
      cells[index] = value;
    }
    return Array.from(cells, cell => cell || '');
  });
}

function columnFor(header) {
  const text = String(header || '').toLowerCase();
  if (/e-?mail/.test(text)) return 'guardian_email';
  if (/phone|cell|mobile|tel/.test(text)) return 'guardian_phone';
  if (/child|kid|number of|^#/.test(text)) return 'children_allowed';
  if (/name|guardian|parent|family|contact/.test(text)) return 'guardian_name';
  return null;
}

const POSITIONAL = ['guardian_name', 'guardian_email', 'guardian_phone', 'children_allowed'];

const digits = (value) => String(value || '').replace(/\D/g, '');
const looksEmail = (value) => String(value || '').includes('@');
const looksPhone = (value) => digits(value).length >= 10;

// A list saved without a header row rarely sits in the column order we would
// guess, so the email and phone columns are found in the data itself, and the
// remaining details fill the free columns in their usual order.
function columnsFromData(body) {
  const sample = body.slice(0, 12);
  const best = (test) => {
    let at = -1;
    let top = 0;
    (sample[0] || []).forEach((_, index) => {
      const score = sample.filter(row => test(row[index])).length;
      if (score > top) { top = score; at = index; }
    });
    return top > 0 ? at : -1;
  };

  const emailAt = best(looksEmail);
  const phoneAt = best(looksPhone);
  if (emailAt < 0 && phoneAt < 0) return null;

  const columns = [];
  if (emailAt >= 0) columns[emailAt] = 'guardian_email';
  if (phoneAt >= 0) columns[phoneAt] = 'guardian_phone';

  // Whatever is still unmapped goes into the free columns in the usual order.
  const free = [];
  for (let index = 0; index < Math.max(columns.length, POSITIONAL.length); index += 1) {
    if (!columns[index]) free.push(index);
  }
  POSITIONAL.filter(key => !columns.includes(key)).forEach((key, order) => {
    if (free[order] !== undefined) columns[free[order]] = key;
  });

  return columns.length ? columns : null;
}

const contactKey = (row) => {
  const email = String(row.guardian_email || '').toLowerCase().trim();
  if (email) return `e:${email}`;
  const phone = digits(row.guardian_phone).slice(-10);
  return phone.length === 10 ? `p:${phone}` : '';
};

// Reads a matrix of cells into families, and reports every row it could not use
// so nothing disappears from a list without staff being told.
export function parseInviteMatrix(matrix) {
  const clean = (matrix || [])
    .map(row => (row || []).map(cell => String(cell ?? '').trim()))
    .filter(row => row.some(Boolean));
  if (!clean.length) return { rows: [], dropped: [], merged: 0, readCount: 0 };

  const first = clean[0];
  const looksLikeData = first.some(cell => cell.includes('@') || /\d{3}/.test(cell));
  const hasHeader = !looksLikeData && first.some(cell => /name|guardian|parent|family|e-?mail|phone|cell|child/i.test(cell));
  const body = hasHeader ? clean.slice(1) : clean;
  const columns = hasHeader ? first.map(columnFor) : (columnsFromData(body) || POSITIONAL);

  const rows = [];
  const dropped = [];
  const seen = new Map();
  let merged = 0;

  for (const raw of body) {
    const out = EMPTY_ROW();
    columns.forEach((key, index) => {
      if (!key) return;
      const value = raw[index] || '';
      if (key === 'children_allowed') {
        const count = Number(digits(value));
        if (count > 0) out.children_allowed = Math.min(6, count);
      } else if (!out[key]) {
        out[key] = value;
      }
    });

    // A column read as a phone number has to hold a real number, so a stray
    // child count or note is never mistaken for one.
    if (out.guardian_phone && digits(out.guardian_phone).length < 7) out.guardian_phone = '';

    const hasContact = Boolean(out.guardian_email || out.guardian_phone);

    // A spreadsheet that merges a family's cells leaves the guardian's details on
    // the first row of the block only, so a row carrying nothing but a child's
    // details belongs to the family above it — it is not a family of its own.
    if (!out.guardian_name && !hasContact) {
      if (rows.length) merged += 1;
      else {
        dropped.push({ ...out, text: raw.filter(Boolean).join(' · '), reason: 'No guardian name or contact details could be read on this row.' });
      }
      continue;
    }

    if (!out.guardian_name) {
      dropped.push({ ...out, text: raw.filter(Boolean).join(' · '), reason: 'This row has contact details but no guardian name.' });
      continue;
    }

    if (!hasContact) {
      dropped.push({ ...out, text: raw.filter(Boolean).join(' · '), reason: 'This row has a guardian name but no email address or phone number.' });
      continue;
    }

    const key = contactKey(out);
    if (key && seen.has(key)) {
      const at = seen.get(key);
      rows[at].children_allowed = Math.max(rows[at].children_allowed, out.children_allowed);
      merged += 1;
      continue;
    }
    if (key) seen.set(key, rows.length);
    rows.push(out);
  }

  return { rows, dropped, merged, readCount: body.length };
}

export async function readInviteFile(file) {
  const name = String(file?.name || '').toLowerCase();

  if (name.endsWith('.csv') || name.endsWith('.txt') || file.type === 'text/csv') {
    const text = await file.text();
    const parsed = Papa.parse(text, { skipEmptyLines: true });
    return parseInviteMatrix(parsed.data);
  }

  if (name.endsWith('.xlsx')) {
    return parseInviteMatrix(await readXlsx(file));
  }

  throw new Error('That file type is not supported. Upload a CSV or an Excel (.xlsx) list.');
}

// One family per pasted line: name, email, phone, children.
export function rowsFromText(text) {
  return parseInviteMatrix(
    String(text || '')
      .split('\n')
      .map(line => line.split(line.includes('\t') ? '\t' : line.includes('|') ? '|' : ','))
  );
}