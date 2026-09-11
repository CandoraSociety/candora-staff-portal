import { base44 } from '@/api/base44Client';

/**
 * Reads the purchase/transaction date off an uploaded receipt (image or PDF).
 * Returns a YYYY-MM-DD string, or null when the date can't be read
 * (caller falls back to manual date entry).
 */
export async function extractReceiptDate(fileUrl) {
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: 'This is a receipt or invoice. Read the transaction/purchase date printed on it. Return ONLY the date in YYYY-MM-DD format. If the year is missing or the date cannot be determined, return an empty string.',
      file_urls: [fileUrl],
      response_json_schema: {
        type: 'object',
        properties: { date: { type: 'string' } },
        required: ['date'],
      },
    });
    const d = String(res?.date || '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  } catch {
    return null;
  }
}