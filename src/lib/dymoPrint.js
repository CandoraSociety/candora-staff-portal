// Prints Kids Gift Shop tags straight to the DYMO LabelWriter through the DYMO
// Connect service that runs beside the printer. This is what makes the tag come
// out at its real 2.3 x 4 in size: the browser print dialog is never involved,
// so the printer's paper size can never be overridden by a remembered sheet size.
import buildTagLabelXml, { buildGuardianLabelXml } from '@/lib/dymoTagLabel';
import dymoQrImage from '@/lib/dymoQrImage';
import { dymoLogoImage } from '@/lib/dymoImage';

// DYMO Connect answers on localhost; newer builds use https, older ones http.
const SERVICES = ['https://localhost:41951', 'http://localhost:41951'];
const PRINT_PATH = '/DYMO/DLS/Printing';

const callService = async (base, path, init = {}, timeout = 5000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${base}${PRINT_PATH}${path}`, { ...init, signal: controller.signal });
    const answer = await response.text();
    if (!response.ok) {
      const detail = new DOMParser().parseFromString(answer, 'text/html').body.textContent
        ?.replace(/\s+/g, ' ').trim().slice(0, 500);
      throw new Error(`DYMO service answered ${response.status}${detail ? `: ${detail}` : ''}`);
    }
    return answer;
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

const send = async (target, labelXml, who) => {
  // All four fields are required, including the blank print settings.
  // Match DYMO's own framework encoding (spaces as %20, not +).
  const fields = {
    printerName: target.printer,
    printParamsXml: '',
    labelXml,
    labelSetXml: '',
  };
  const body = Object.entries(fields)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  const answer = await callService(target.base, '/PrintLabel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body,
  }, 30000);
  // PrintLabel is a void operation: an empty/null response is normal success.
  if (/^"?false"?$/i.test(answer.trim())) {
    throw new Error(`DYMO did not accept the name tag for ${who}.`);
  }
};

// Prepare every QR before sending anything, then submit each tag exactly once.
// Never retry a successful job or silently remove the volunteer's QR code.
// Each family also gets one tag for the parent or guardian, listing their children.
export default async function printDymoTags(tags, target, families = []) {
  const qrImages = await Promise.all(tags.map(dymoQrImage));
  const logoPng = await dymoLogoImage();
  for (let index = 0; index < tags.length; index++) {
    await send(target, buildTagLabelXml(tags[index], { qrPng: qrImages[index], logoPng }), tags[index].child_name || 'this child');
  }
  for (const family of families) {
    await send(target, buildGuardianLabelXml(family, { logoPng }), family.guardian_name || 'the parent or guardian');
  }
}