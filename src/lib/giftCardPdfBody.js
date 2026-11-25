const NAVY = [10, 15, 41];
const GOLD = [252, 207, 3];
const CREAM = [255, 248, 220];
const clean = (value) => String(value || '').trim();

// The same three separate values as the on-screen card, without fallback text
// ever entering the donor's personal-message box.
export default function drawGiftCardPdfBody(doc, { card, campaign, left, top, width, bottom }) {
  const message = clean(card?.message);
  const wording = clean(card?.gift_description);
  const amount = Number(card?.amount) || 0;
  const selection = [clean(card?.product_name), amount > 0 ? `${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount)} CAD` : ''].filter(Boolean).join(' · ');
  const christmas = campaign?.seasonal_theme === 'christmas';
  let y = top;
  if (christmas) {
    doc.setFont('times', 'italic');
    doc.setFontSize(34);
    doc.setTextColor(...NAVY);
    doc.text('Merry Christmas!', left + 22, y + 26);
    y += 46;
  }

  let layout;
  for (const size of [11, 10, 9, 8, 7]) {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'normal');
    const messageLines = message ? doc.splitTextToSize(message, width - 44) : [];
    const wordingLines = wording ? doc.splitTextToSize(wording, width - 44) : [];
    doc.setFont('helvetica', 'bold');
    const selectionLines = selection ? doc.splitTextToSize(selection, width - 44) : [];
    const lineHeight = size * 1.35;
    const messageH = messageLines.length ? 44 + messageLines.length * lineHeight : 0;
    const giftH = 44 + wordingLines.length * lineHeight + (selectionLines.length ? 26 + selectionLines.length * lineHeight : 0);
    layout = { size, lineHeight, messageLines, wordingLines, selectionLines, messageH, giftH };
    if (messageH + (messageH ? 14 : 0) + giftH <= bottom - y) break;
  }
  const { size, lineHeight, messageLines, wordingLines, selectionLines, messageH, giftH } = layout;
  const label = (text, at, color) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...color);
    doc.text(text, left + 22, at);
  };
  if (messageH) {
    doc.setFillColor(...NAVY);
    doc.roundedRect(left, y, width, messageH, 8, 8, 'F');
    label('A MESSAGE FOR YOU', y + 20, GOLD);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(255, 255, 255);
    doc.text(messageLines, left + 22, y + 36, { lineHeightFactor: 1.35 });
    y += messageH + 14;
  }
  doc.setFillColor(...CREAM);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.roundedRect(left, y, width, giftH, 8, 8, 'FD');
  label((clean(card?.gift_name) || 'A GIFT TO YOU').toUpperCase(), y + 20, NAVY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  doc.setTextColor(...NAVY);
  if (wordingLines.length) doc.text(wordingLines, left + 22, y + 36, { lineHeightFactor: 1.35 });
  if (selectionLines.length) {
    const selectionY = y + 36 + wordingLines.length * lineHeight + 8;
    label('DONATION SELECTED', selectionY, NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.text(selectionLines, left + 22, selectionY + 14, { lineHeightFactor: 1.35 });
  }
}