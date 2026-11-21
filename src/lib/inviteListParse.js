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

export function normalizeRows(matrix) {
  const clean = (matrix || [])
    .map(row => (row || []).map(cell => String(cell ?? '').trim()))
    .filter(row => row.some(Boolean));
  if (!clean.length) return [];

  const first = clean[0];
  const looksLikeData = first.some(cell => cell.includes('@') || /\d{3}/.test(cell));
  const hasHeader = !looksLikeData && first.some(cell => /name|guardian|parent|family|e-?mail|phone|cell|child/i.test(cell));
  const columns = hasHeader ? first.map(columnFor) : POSITIONAL;
  const body = hasHeader ? clean.slice(1) : clean;

  return body
    .map(row => {
      const out = EMPTY_ROW();
      columns.forEach((key, index) => {
        if (!key) return;
        const value = row[index] || '';
        if (key === 'children_allowed') {
          const count = Number(String(value).replace(/[^0-9]/g, ''));
          if (count > 0) out.children_allowed = Math.min(6, count);
        } else if (!out[key]) {
          out[key] = value;
        }
      });
      return out;
    })
    .filter(row => row.guardian_name && (row.guardian_email || row.guardian_phone));
}

export async function readInviteFile(file) {
  const name = String(file?.name || '').toLowerCase();

  if (name.endsWith('.csv') || name.endsWith('.txt') || file.type === 'text/csv') {
    const text = await file.text();
    const parsed = Papa.parse(text, { skipEmptyLines: true });
    return normalizeRows(parsed.data);
  }

  if (name.endsWith('.xlsx')) {
    return normalizeRows(await readXlsx(file));
  }

  throw new Error('That file type is not supported. Upload a CSV or an Excel (.xlsx) list.');
}

// One family per pasted line: name, email, phone, children.
export function rowsFromText(text) {
  return normalizeRows(
    String(text || '')
      .split('\n')
      .map(line => line.split(line.includes('\t') ? '\t' : line.includes('|') ? '|' : ','))
  );
}