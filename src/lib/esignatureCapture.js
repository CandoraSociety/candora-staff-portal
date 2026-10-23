import { base44 } from '@/api/base44Client';
import { isTestMode, realUploadPublicFile } from '@/lib/testMode/sandbox';

// Uploads a captured e-signature PNG (data URL from composeSignedImage, which
// embeds the verification ID and timestamp under the signature) to public
// storage so it can be stored on the signed record and printed on documents.
// In Test Mode the upload still goes to REAL storage: a learner's e-signature
// is their actual signature, so the file has to be a real, permanent URL.
export async function uploadSignatureImage(imageDataUrl) {
  if (!imageDataUrl) return '';
  const blob = await (await fetch(imageDataUrl)).blob();
  const file = new File([blob], `e-signature-${Date.now()}.png`, { type: 'image/png' });
  const { file_url } = isTestMode()
    ? await realUploadPublicFile(file)
    : await base44.integrations.Core.UploadPublicFile({ file });
  return file_url;
}