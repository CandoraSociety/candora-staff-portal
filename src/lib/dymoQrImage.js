import { elfFormLink, qrImageUrl } from '@/lib/giftShopElf';

// Load a QR image and hand it back as base64 PNG, ready for the DYMO label file.
async function qrPngBase64(link, failure) {
  const response = await fetch(qrImageUrl(link, 600), {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(failure);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error(failure));
    reader.readAsDataURL(blob);
  });
}

// Embed the same QR artwork as the preview in DYMO's supported PNG image
// object. The legacy label format does not use Connect's QRCodeObject.
export default async function dymoQrImage(tag) {
  if (!tag.elf_token) throw new Error('The volunteer QR code is not ready yet.');
  return qrPngBase64(elfFormLink(tag.elf_token), 'The volunteer QR image could not be loaded. Please try again.');
}

// Any other QR — such as the check-in desk code printed on its own label.
export const dymoQrImageFromLink = (link) =>
  qrPngBase64(link, 'The QR code could not be prepared. Please try again.');