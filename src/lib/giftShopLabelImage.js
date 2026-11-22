import {
  giftShopAgeBandLabel,
  giftShopChildFirstName,
  giftShopGuardianName,
  giftShopSlotLabel,
  giftShopTagGifts,
} from '@/lib/giftShopFamilies';

// A name tag drawn at the exact shape of a 50 x 30 mm roll label (300 dpi).
// The NIIMBOT B1 and Phomemo M110 both print a 50 mm-wide roll from their own
// app, so the tag is handed over as an image at this size instead of being sent
// to a print driver. Nothing here is colour: those printers print one colour,
// so the tag is drawn black on white.
export const LABEL_WIDTH_PX = 591;
export const LABEL_HEIGHT_PX = 354;

// Shrink a line of text until it fits the space it is given.
function drawFittedText(ctx, text, { x, y, maxWidth, size, minSize = 16, weight = '700', align = 'left' }) {
  let fontSize = size;
  do {
    ctx.font = `${weight} ${fontSize}px Inter, Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fontSize -= 2;
  } while (fontSize > minSize);
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

export function renderGiftShopLabel(tag) {
  const canvas = document.createElement('canvas');
  canvas.width = LABEL_WIDTH_PX;
  canvas.height = LABEL_HEIGHT_PX;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, LABEL_WIDTH_PX, LABEL_HEIGHT_PX);
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';

  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, LABEL_WIDTH_PX - 20, LABEL_HEIGHT_PX - 20);

  // Left block: the order number handed out at sign-in.
  ctx.textAlign = 'center';
  ctx.font = '700 26px Inter, Arial, sans-serif';
  ctx.fillText('ORDER', 118, 84);

  const order = String(tag.check_in_sequence ?? '—');
  let orderSize = 140;
  do {
    ctx.font = `900 ${orderSize}px Inter, Arial, sans-serif`;
    if (ctx.measureText(order).width <= 190) break;
    orderSize -= 6;
  } while (orderSize > 60);
  ctx.textAlign = 'center';
  ctx.fillText(order, 118, 268);

  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(218, 44);
  ctx.lineTo(218, LABEL_HEIGHT_PX - 44);
  ctx.stroke();

  // Right block: who the child is, when they shop, who is with them, what to buy.
  const left = 244;
  const width = LABEL_WIDTH_PX - left - 28;

  drawFittedText(ctx, giftShopChildFirstName(tag), {
    x: left, y: 108, maxWidth: width, size: 66, minSize: 34, weight: '900',
  });

  const slot = [giftShopSlotLabel(tag.time_slot), giftShopAgeBandLabel(tag.child_age_band)]
    .filter(Boolean)
    .join(' · ');
  drawFittedText(ctx, slot, {
    x: left, y: 158, maxWidth: width, size: 28, minSize: 18, weight: '700',
  });

  const guardian = giftShopGuardianName(tag);
  if (guardian) {
    drawFittedText(ctx, `Parent/Guardian: ${guardian}`, {
      x: left, y: 202, maxWidth: width, size: 24, minSize: 15, weight: '500',
    });
  }

  drawFittedText(ctx, giftShopTagGifts(tag), {
    x: left, y: 262, maxWidth: width, size: 34, minSize: 20, weight: '800',
  });

  ctx.textAlign = 'right';
  ctx.font = '900 22px Inter, Arial, sans-serif';
  ctx.fillText('KGS', LABEL_WIDTH_PX - 30, LABEL_HEIGHT_PX - 26);

  return canvas;
}

export function downloadGiftShopLabel(tag) {
  const canvas = renderGiftShopLabel(tag);
  const name = giftShopChildFirstName(tag).replace(/[^\w-]+/g, '-');
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `KGS-tag-${tag.check_in_sequence || ''}-${name}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}