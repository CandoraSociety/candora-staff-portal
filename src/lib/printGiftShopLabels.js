import waitForLabelImages from '@/lib/waitForLabelImages';

// Open visibly during the click: hidden frames can stop receiving animation
// callbacks. Keep the roll layout separate from the portal's print styles.
const labelStyles = `
  @page { size: 2.3in 4in; margin: 0; }
  * { box-sizing: border-box; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; width: 2.3in; background: white; color: black; }
  .label-page { position: relative; display: block; width: 2.3in; height: 4in; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
  .label-page + .label-page { break-before: page; page-break-before: always; }
  .giftshop-tag { position: absolute; left: 2.29in; top: 0.01in; transform: rotate(90deg); transform-origin: top left; width: 3.98in; height: 2.28in; display: flex; align-items: center; gap: 6pt; padding: 6pt 9pt; overflow: hidden; font: 10.5pt/1.25 Arial, Helvetica, sans-serif; }
  p { margin: 0; }
  img { display: block; }
  [data-label-number] { flex: none; font-size: 45pt; font-weight: 900; line-height: 1; }
  [data-label-details] { flex: 1; min-width: 0; border-left: 1.5pt solid black; padding-left: 7.5pt; }
  [data-label-details] p + p { margin-top: 3pt; }
  [data-label-name] { font-size: 24pt; line-height: 1; font-weight: 800; overflow-wrap: anywhere; }
  [data-label-slot], [data-label-gifts] { font-size: 10.5pt; font-weight: 700; }
  [data-label-guardian] { font-size: 9pt; font-weight: 600; overflow-wrap: anywhere; }
  [data-label-badge] { flex: none; font-size: 7pt; font-weight: 900; letter-spacing: 0.12em; line-height: 1.2; text-align: center; border: 1.5pt solid black; border-radius: 3pt; padding: 3pt 2pt; }
  [data-label-kids] { font-size: 9.5pt; font-weight: 700; overflow-wrap: anywhere; }
  [data-label-code] { flex: none; display: flex; flex-direction: column; align-items: center; gap: 1.5pt; }
  [data-label-qr] { width: 0.85in; height: 0.85in; }
  [data-label-logo] { width: 15pt; height: 15pt; object-fit: contain; }
  [data-label-caption] { font-size: 5.25pt; font-weight: 900; letter-spacing: 0.15em; }
  .print-controls { padding: 12px; font: 14px/1.4 Arial, sans-serif; }
  @media print { .print-controls { display: none !important; } }
`;

export default async function printGiftShopLabels(grid) {
  const labels = Array.from(grid?.querySelectorAll('.giftshop-tag') || []);
  if (!labels.length) throw new Error('No name tags are ready to print.');
  // This must run before any await, while the Print click is still active.
  const printWindow = window.open('', '_blank', 'popup,width=600,height=750');
  if (!printWindow) throw new Error('Allow pop-ups for this site, then press Print again.');
  printWindow.opener = null;
  const doc = printWindow.document;
  doc.open();
  doc.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Kids Gift Shop name tags</title><style>${labelStyles}</style></head><body><div class="print-controls"><button id="print-labels" type="button" disabled>Preparing QR codes…</button><p id="print-status" role="status">Preparing name tags…</p></div>${labels.map(label => `<article class="label-page">${label.outerHTML}</article>`).join('')}</body></html>`);
  doc.close();
  const button = doc.getElementById('print-labels');
  const status = doc.getElementById('print-status');
  button.addEventListener('click', () => printWindow.print());
  await waitForLabelImages(doc.images).catch(error => {
    status.textContent = error.message;
    throw error;
  });
  if (printWindow.closed) return;
  button.disabled = false;
  button.textContent = 'Print name tags';
  status.textContent = 'If the print dialog does not open automatically, press Print name tags above.';
  printWindow.focus();
  // Do not wait for afterprint: some browsers never fire it for child windows.
  printWindow.print();
}