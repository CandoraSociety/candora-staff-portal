import { CANDORA_BRAND } from '@/lib/candoraBrand';

// Turns a picture into a small base64 PNG the DYMO label file can carry, so a
// logo prints straight to the label printer without the browser print dialog.
export async function imageToPngBase64(url, width) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('The picture could not be loaded.');
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round(bitmap.height * (width / bitmap.width));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL('image/png').split(',')[1];
}

// The Candora mark printed on a name tag. The stored logo is large, so it is
// reduced before it goes into the label file.
export const dymoLogoImage = () => imageToPngBase64(CANDORA_BRAND.logoUrl, 400).catch(() => null);