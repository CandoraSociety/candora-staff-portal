// Prints Kids Gift Shop tags straight to the DYMO LabelWriter through the DYMO
// Connect service that runs beside the printer. This is what makes the tag come
// out at its real 2.3 x 4 in size: the browser print dialog is never involved,
// so the printer's paper size can never be overridden by a remembered sheet size.
import buildTagLabelXml from '@/lib/dymoTagLabel';

// DYMO Connect answers on localhost; newer builds use https, older ones http.
const SERVICES = ['https://localhost:41951', 'http://localhost:41951'];
const PRINT_PATH = '/DYMO/DLS/Printing';

const callService = async (base, path, init = {}, timeout = 5000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${base}${PRINT_PATH}${path}`, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`DYMO service answered ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
};

// Returns { base, printer } for the DYMO printer, or null when DYMO Connect is
// not running on this computer (the browser print window is used instead).
export async function findDymoPrinter() {
  for (const base of SERVICES) {
    try {
      const xml = await callService(base, '/GetPrinters', {}, 3000);
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const names = Array.from(doc.getElementsByTagName('LabelWriterPrinter'))
        .map(printer => printer.getElementsByTagName('Name')[0]?.textContent?.trim())
        .filter(Boolean);
      if (!names.length) continue;
      return { base, printer: names.find(name => /550/i.test(name)) || names[0] };
    } catch {
      // Service not installed or not reachable — try the next address.
    }
  }
  return null;
}

const send = async (target, tag, includeQr) => {
  const body = new URLSearchParams({
    printerName: target.printer,
    labelXml: buildTagLabelXml(tag, { includeQr }),
    labelSetXml: '',
  });
  const answer = await callService(target.base, '/PrintLabel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  }, 30000);
  return answer.trim().toLowerCase().includes('true');
};

// One label per child, in the order they were signed in.
export default async function printDymoTags(tags, target) {
  for (const tag of tags) {
    let printed = await send(target, tag, true);
    // A printer that refuses the QR code still gets the tag, so nobody is left
    // without one — the paper form covers the scan.
    if (!printed) printed = await send(target, tag, false);
    if (!printed) throw new Error(`The label printer would not print ${tag.child_name || 'this tag'}.`);
  }
}