import { jsPDF } from 'jspdf';

// Turns a gift card into a real, printable PDF — a 5 x 7 inch card that prints
// cleanly on paper (the artwork is embedded as an image, the words are text).
// Everything is drawn on the recipient's own device, so the card link in the
// email is all they need.

const PAGE_W = 360; // 5in
const PAGE_H = 504; // 7in
const MARGIN = 20;

const GOLD = [252, 207, 3];
const NAVY = [10, 15, 41];
const INK = [8, 12, 33];
const MUTED = [98, 103, 132];
const CREAM = [255, 248, 220];
const WHITE = [255, 255, 255];

const clean = (value) => String(value || '').trim();

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

// Cover-crops the artwork into exactly the band it sits in, so nothing spills
// over the edges of the card.
function croppedArtwork(image, width, height, density = 2) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * density);
  canvas.height = Math.round(height * density);
  const scale = Math.max(
    canvas.width / image.img.naturalWidth,
    canvas.height / image.img.naturalHeight,
  );
  const sourceWidth = canvas.width / scale;
  const sourceHeight = canvas.height / scale;
  canvas
    .getContext('2d')
    .drawImage(
      image.img,
      (image.img.naturalWidth - sourceWidth) / 2,
      (image.img.naturalHeight - sourceHeight) / 2,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
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
  const textX = left + 16;
  const textW = innerW - 32;

  const recipient = clean(card?.recipient_name) || 'Someone special';
  const giftName = clean(card?.gift_name);
  const giftDescription = clean(card?.gift_description);
  const campaignName = clean(campaign?.name || card?.campaign_name) || 'Candora Society';
  const donor = clean(card?.donor_name);
  const donationName = giftName || clean(card?.theme_name);
  const donationNotice = donationName
    ? `A donation, ${donationName}, has been made to Candora Society as a gift to you.`
    : 'A donation has been made to Candora Society as a gift to you.';

  doc.setFillColor(...WHITE);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Header
  const logo = await fetchImage(logoUrl);
  if (logo) {
    const logoH = 32;
    const logoW = Math.min(120, (logo.img.naturalWidth / logo.img.naturalHeight) * logoH);
    doc.addImage(logo.dataUrl, imageFormat(logo.dataUrl), left, 24, logoW, logoH);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setCharSpace(1.8);
  doc.setTextColor(...MUTED);
  doc.text('CANDORA SOCIETY', right, 46, { align: 'right' });
  doc.setCharSpace(0);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.line(left, 70, right, 70);

  // Artwork with the recipient's name laid over it
  const artY = 74;
  const artH = 160;
  const art = await fetchImage(card?.theme_image_url || campaign?.hero_image_url);
  if (art) {
    doc.addImage(croppedArtwork(art, innerW, artH), 'PNG', left, artY, innerW, artH);
  } else {
    doc.setFillColor(...NAVY);
    doc.rect(left, artY, innerW, artH, 'F');
  }

  const captionH = 74;
  doc.setFillColor(...NAVY);
  doc.rect(left, artY + artH - captionH, innerW, captionH, 'F');

  let y = artY + artH - captionH + 16;
  if (giftName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setCharSpace(1.8);
    doc.setTextColor(...GOLD);
    doc.text(giftName.toUpperCase(), textX, y);
    doc.setCharSpace(0);
    y += 13;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setCharSpace(1.8);
  doc.setTextColor(198, 201, 219);
  doc.text('A GIFT FOR', textX, y);
  doc.setCharSpace(0);
  y += 20;

  let nameSize = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(nameSize);
  while (nameSize > 11 && doc.getTextWidth(recipient) > textW) {
    nameSize -= 1;
    doc.setFontSize(nameSize);
  }
  doc.setTextColor(...WHITE);
  doc.text(recipient, textX, y);

  // What the card is: a donation made to Candora, given to this person
  let noticeY = artY + artH + 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...NAVY);
  doc.splitTextToSize(donationNotice, textW).slice(0, 2).forEach((line) => {
    doc.text(line, textX, noticeY);
    noticeY += 10;
  });

  // The supporter's own words
  const message =
    clean(card?.message) || 'A gift has been made in your honour, to bring a little joy this season.';
  const messageFit = fitText(doc, message, textW, 90, [12, 11, 10, 9, 8], 'italic');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(messageFit.size);
  doc.setTextColor(...INK);
  let lineY = noticeY + 6;
  messageFit.lines.forEach((line) => {
    doc.text(line, textX, lineY);
    lineY += messageFit.lineHeight;
  });

  // What the gift makes possible
  if (giftDescription) {
    const boxTop = lineY + 12;
    const descriptionFit = fitText(doc, giftDescription, textW - 26, 24, [9.5, 9, 8.5, 8], 'normal');
    const boxH = 18 + 12 + descriptionFit.lines.length * descriptionFit.lineHeight + 12;
    const boxBottom = Math.min(boxTop + boxH, PAGE_H - MARGIN - 46);

    doc.setFillColor(...CREAM);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.8);
    doc.roundedRect(left + 12, boxTop, innerW - 24, boxBottom - boxTop, 6, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setCharSpace(1.6);
    doc.setTextColor(90, 74, 10);
    doc.text((giftName || 'Your gift').toUpperCase(), left + 25, boxTop + 16);
    doc.setCharSpace(0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(descriptionFit.size);
    doc.setTextColor(...INK);
    let descriptionY = boxTop + 30;
    descriptionFit.lines.forEach((line) => {
      doc.text(line, left + 25, descriptionY);
      descriptionY += descriptionFit.lineHeight;
    });
  }

  // Footer
  const footerY = PAGE_H - MARGIN - 30;
  doc.setDrawColor(218, 220, 231);
  doc.setLineWidth(0.6);
  doc.line(textX, footerY - 18, right - 16, footerY - 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  doc.text(campaignName, textX, footerY);

  if (donor) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`from ${donor}`, right - 16, footerY, { align: 'right' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setCharSpace(1.4);
  doc.setTextColor(...MUTED);
  doc.text('CANDORA SOCIETY · CANDORA.CA', textX, footerY + 14);
  doc.setCharSpace(0);

  // The gold frame, drawn last so its edges stay crisp
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(4);
  doc.rect(10, 10, PAGE_W - 20, PAGE_H - 20);

  const fileName = fileNameFor(recipient);
  doc.save(fileName);
  return fileName;
}