import { base44 } from '@/api/base44Client';

// Uploads a captured e-signature PNG (data URL from composeSignedImage, which
// embeds the verification ID and timestamp under the signature) to public
// storage so it can be stored on the signed record and printed on documents.
export async function uploadSignatureImage(imageDataUrl) {
  if (!imageDataUrl) return '';
  const blob = await (await fetch(imageDataUrl)).blob();
  const file = new File([blob], `e-signature-${Date.now()}.png`, { type: 'image/png' });
  const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
  return file_url;
}