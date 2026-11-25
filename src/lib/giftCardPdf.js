import { jsPDF } from 'jspdf';

// Turns a gift card into a real, printable PDF — a letter-sized (8.5 x 11 in)
// page the card prints cleanly on, with the artwork embedded as an image and the
// words as text. Everything is drawn on the recipient's own device, so the card
// link in the email is all they need.

const PAGE_W = 612; // 8.5in
const PAGE_H = 792; // 11in
const MARGIN = 54;

const GOLD = [252, 207, 3];
const NAVY = [10, 15, 41];
const INK = [8, 12, 33];
const MUTED = [98, 103, 132];
const CREAM = [255, 248, 220];
const WHITE = [255, 255, 255];

const clean = (value) => String(value || '').trim();
const money = (value) => `$${Number(value).toLocaleString('en-CA')}`;

function imageFormat(dataUrl) {
  return /^data:image\/jpe?g/i.test(dataUrl) ? 'JPEG' : 'PNG';
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image could not be read'));
    img.src = dataUrl;
  });
}

async function fetchImage(url) {
  const source = clean(url);
  if (!source) return null;
  try {
    const response = await fetch(source, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Image could not be read'));
      reader.readAsDataURL(blob);
    });
    return { dataUrl, img: await loadImage(dataUrl) };
  } catch (error) {
    console.error('gift card PDF image failed', error?.message || error);
    return null;
  }
}

// Shows the whole card design, scaled to fit its space on a white sheet, so no
// part of the artwork is ever cropped off.
function fittedArtwork(image, width, height, density = 2) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * density);
  canvas.height = Math.round(height * density);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min(
    canvas.width / image.img.naturalWidth,
    canvas.height / image.img.naturalHeight,
  );
  const drawWidth = image.img.naturalWidth * scale;
  const drawHeight = image.img.naturalHeight * scale;
  ctx.drawImage(
    image.img,
    (canvas.width - drawWidth) / 2,
    (canvas.height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
  return canvas.toDataURL('image/png');
}

// The largest of the given sizes at which the text still fits the space.
function fitText(doc, text, maxWidth, maxHeight, sizes, style) {
  let fitted = null;
  sizes.forEach((size) => {
    if (fitted) return;
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = size * 1.45;
    if (lines.length * lineHeight <= maxHeight) fitted = { size, lines, lineHeight };
  });
  if (fitted) return fitted;

  const size = sizes[sizes.length - 1];
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  const lineHeight = size * 1.45;
  const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
  const lines = doc.splitTextToSize(text, maxWidth).slice(0, maxLines);
  if (lines.length === maxLines) lines[maxLines - 1] = `${lines[maxLines - 1]}…`;
  return { size, lines, lineHeight };
}

// Mixed-style text — a bold, larger donation name inside a sentence — wrapped to
// the width, then drawn segment by segment.
function wrapRuns(doc, runs, maxWidth) {
  const lines = [[]];
  let x = 0;
  runs.forEach((run) => {
    doc.setFont('helvetica', run.bold ? 'bold' : 'normal');
    doc.setFontSize(run.size);
    const spaceWidth = doc.getTextWidth(' ');
    String(run.text || '')
      .split(/\s+/)
      .filter(Boolean)
      .forEach((word) => {
        const width = doc.getTextWidth(word);
        let line = lines[lines.length - 1];
        let gap = line.length ? spaceWidth : 0;
        if (line.length && x + gap + width > maxWidth) {
          lines.push([]);
          line = lines[lines.length - 1];
          x = 0;
          gap = 0;
        }
        line.push({ ...run, text: word, gap });
        x += gap + width;
      });
  });
  return lines.filter((line) => line.length);
}

function drawRuns(doc, lines, x, y, lineHeight) {
  let cursorY = y;
  lines.forEach((line) => {
    let cursorX = x;
    line.forEach((segment) => {
      doc.setFont('helvetica', segment.bold ? 'bold' : 'normal');
      doc.setFontSize(segment.size);
      doc.setTextColor(...segment.color);
      cursorX += segment.gap;
      doc.text(segment.text, cursorX, cursorY);
      cursorX += doc.getTextWidth(segment.text);
    });
    cursorY += lineHeight;
  });
  return cursorY;
}

function fileNameFor(recipient) {
  const slug = recipient
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `candora-gift-card${slug ? `-${slug}` : ''}.pdf`;
}

export async function downloadGiftCardPdf({ card, campaign, logoUrl }) {
  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], compress: true });

  const left = MARGIN;
  const right = PAGE_W - MARGIN;
  const innerW = right - left;
  const textX = left + 22;
  const textW = innerW - 44;

  const recipient = clean(card?.recipient_name) || 'Someone special';
  const giftName = clean(card?.gift_name);
  const giftDescription = clean(card?.gift_description);
  const campaignName = clean(campaign?.name || card?.campaign_name) || 'Candora Society';
  const donor = clean(card?.donor_name);
  const donationName = giftName || clean(card?.theme_name);
  const amount = Number(card?.amount) || 0;

  doc.setFillColor(...WHITE);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Header
  const logo = await fetchImage(logoUrl);
  if (logo) {
    const logoH = 52;
    const logoW = Math.min(190, (logo.img.naturalWidth / logo.img.naturalHeight) * logoH);
    doc.addImage(logo.dataUrl, imageFormat(logo.dataUrl), left, 56, logoW, logoH);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setCharSpace(2.4);
  doc.setTextColor(...MUTED);
  doc.text('CANDORA SOCIETY', right, 92, { align: 'right' });
  doc.setCharSpace(0);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.4);
  doc.line(left, 126, right, 126);

  // Artwork with the recipient's name laid over it
  const artY = 142;
  const artH = 250;
  const captionH = 96;
  const artW = innerW - 24;
  const artInnerH = artH - captionH - 16;
  const art = await fetchImage(card?.theme_image_url || campaign?.hero_image_url);
  if (art) {
    doc.addImage(
      fittedArtwork(art, artW, artInnerH),
      'PNG',
      left + 12,
      artY + 8,
      artW,
      artInnerH,
    );
  } else {
    doc.setFillColor(...NAVY);
    doc.rect(left, artY, innerW, artH, 'F');
  }

  doc.setFillColor(...NAVY);
  doc.rect(left, artY + artH - captionH, innerW, captionH, 'F');

  let y = artY + artH - captionH + 24;
  if (giftName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setCharSpace(2.2);
    doc.setTextColor(...GOLD);
    doc.text(giftName.toUpperCase(), textX, y);
    doc.setCharSpace(0);
    y += 20;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setCharSpace(2.2);
  doc.setTextColor(198, 201, 219);
  doc.text('A GIFT FOR', textX, y);
  doc.setCharSpace(0);
  y += 30;

  let nameSize = 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(nameSize);
  while (nameSize > 14 && doc.getTextWidth(recipient) > textW) {
    nameSize -= 1;
    doc.setFontSize(nameSize);
  }
  doc.setTextColor(...WHITE);
  doc.text(recipient, textX, y);

  // What the card is: a donation of this much, in this name, made to Candora as
  // a gift to the person holding it. The donation's name is set apart in bold.
  let cursor = artY + artH + 22;
  const noticeRuns = [
    {
      text: `A donation${amount > 0 ? ` of ${money(amount)}` : ''}`,
      bold: false,
      size: 14,
      color: INK,
    },
  ];
  if (donationName) {
    noticeRuns.push({ text: '—', bold: false, size: 14, color: INK });
    noticeRuns.push({ text: donationName, bold: true, size: 17, color: NAVY });
    noticeRuns.push({
      text: '— has been made to Candora Society as a gift to you.',
      bold: false,
      size: 14,
      color: INK,
    });
  } else {
    noticeRuns.push({
      text: 'has been made to Candora Society as a gift to you.',
      bold: false,
      size: 14,
      color: INK,
    });
  }

  const noticeLines = wrapRuns(doc, noticeRuns, innerW - 56);
  const noticeH = 16 + 14 + noticeLines.length * 23 + 16;

  doc.setFillColor(...CREAM);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.2);
  doc.roundedRect(left, cursor, innerW, noticeH, 8, 8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setCharSpace(2);
  doc.setTextColor(90, 74, 10);
  doc.text('A GIFT TO YOU', left + 28, cursor + 28);
  doc.setCharSpace(0);

  drawRuns(doc, noticeLines, left + 28, cursor + 58, 23);
  cursor += noticeH + 26;

  const footerTop = PAGE_H - 76;
  const descriptionSpace = 92;

  // The supporter's own words
  const message =
    clean(card?.message) || 'A gift has been made in your honour, to bring a little joy this season.';
  const messageMax = Math.max(46, footerTop - 20 - descriptionSpace - cursor);
  const messageFit = fitText(doc, message, textW, messageMax, [14, 13, 12, 11, 10], 'italic');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(messageFit.size);
  doc.setTextColor(...INK);
  let lineY = cursor;
  messageFit.lines.forEach((line) => {
    doc.text(line, textX, lineY);
    lineY += messageFit.lineHeight;
  });
  cursor = lineY + 10;

  // What the gift makes possible
  if (giftDescription) {
    const boxTop = cursor;
    const descMax = Math.max(30, footerTop - 16 - boxTop - 46);
    const descriptionFit = fitText(doc, giftDescription, textW - 30, descMax, [12, 11, 10, 9.5], 'normal');
    const boxH = 16 + 14 + descriptionFit.lines.length * descriptionFit.lineHeight + 16;
    const boxBottom = Math.min(boxTop + boxH, footerTop - 10);

    doc.setFillColor(...CREAM);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1);
    doc.roundedRect(left, boxTop, innerW, boxBottom - boxTop, 8, 8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setCharSpace(1.8);
    doc.setTextColor(90, 74, 10);
    doc.text((giftName || 'YOUR GIFT').toUpperCase(), left + 28, boxTop + 28);
    doc.setCharSpace(0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(descriptionFit.size);
    doc.setTextColor(...INK);
    let descriptionY = boxTop + 48;
    descriptionFit.lines.forEach((line) => {
      doc.text(line, left + 28, descriptionY);
      descriptionY += descriptionFit.lineHeight;
    });
  }

  // Footer
  const footerY = footerTop + 20;
  doc.setDrawColor(218, 220, 231);
  doc.setLineWidth(0.8);
  doc.line(textX, footerTop, right - 22, footerTop);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(campaignName, textX, footerY);

  if (donor) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(`from ${donor}`, right - 22, footerY, { align: 'right' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setCharSpace(1.6);
  doc.setTextColor(...MUTED);
  doc.text('CANDORA SOCIETY · CANDORA.CA', textX, footerY + 18);
  doc.setCharSpace(0);

  // The gold frame, drawn last so its edges stay crisp
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(5);
  doc.rect(18, 18, PAGE_W - 36, PAGE_H - 36);

  const fileName = fileNameFor(recipient);
  doc.save(fileName);
  return fileName;
}