import { elfFormLink, qrImageUrl } from '@/lib/giftShopElf';

// Embed the same QR artwork as the preview in DYMO's supported PNG image
// object. The legacy label format does not use Connect's QRCodeObject.
export default async function dymoQrImage(tag) {
  if (!tag.elf_token) throw new Error('The volunteer QR code is not ready yet.');
  const response = await fetch(qrImageUrl(elfFormLink(tag.elf_token), 600), {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('The volunteer QR image could not be loaded. Please try again.');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('The volunteer QR image could not be prepared.'));
    reader.readAsDataURL(blob);
  });
}