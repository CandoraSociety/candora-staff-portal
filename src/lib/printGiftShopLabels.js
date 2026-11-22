// Print only the labels in a fresh document, never the dialog, overlays or the
// portal's letter-page print styles. The paper follows the narrow DYMO roll;
// rotate the artwork, not the printer paper, to avoid fit-to-width shrinking.
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
  [data-label-code] { flex: none; display: flex; flex-direction: column; align-items: center; gap: 1.5pt; }
  [data-label-qr] { width: 0.85in; height: 0.85in; }
  [data-label-logo] { width: 15pt; height: 15pt; object-fit: contain; }
  [data-label-caption] { font-size: 5.25pt; font-weight: 900; letter-spacing: 0.15em; }
`;

export default async function printGiftShopLabels(grid) {
  const labels = Array.from(grid.querySelectorAll('.giftshop-tag'));
  const frame = document.createElement('iframe');
  frame.title = 'Kids Gift Shop label printing';
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:221px;height:384px;border:0;pointer-events:none;';
  const loaded = new Promise(resolve => { frame.onload = resolve; });
  frame.srcdoc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Kids Gift Shop name tags</title><style>${labelStyles}</style></head><body>${labels.map(label => `<article class="label-page">${label.outerHTML}</article>`).join('')}</body></html>`;
  document.body.appendChild(frame);
  try {
    await loaded;
    await Promise.all(Array.from(frame.contentDocument.images, image => image.decode()));
    await new Promise(resolve => frame.contentWindow.requestAnimationFrame(() => frame.contentWindow.requestAnimationFrame(resolve)));
    await new Promise(resolve => {
      frame.contentWindow.addEventListener('afterprint', resolve, { once: true });
      frame.contentWindow.focus();
      frame.contentWindow.print();
    });
  } finally {
    frame.remove();
  }
}