import { base44 } from '@/api/base44Client';

/**
 * Reads key fields off an uploaded receipt (image or PDF): purchase date,
 * item description, supplier, GST charged, and the grand total with GST.
 * Returns { date, description, supplier, gst, total } — any field the model
 * can't read comes back null so the caller falls back to manual entry.
 */
export async function extractReceiptDetails(fileUrl) {
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: 'This is a receipt or invoice. Read the following fields printed on it: the transaction/purchase date, a short description of the items purchased, the name of the supplier/store, the GST amount charged, and the grand total including GST. Return the date as YYYY-MM-DD (empty string if not readable). Return gst and total as plain numbers without currency signs (gst 0 if no GST was charged). Keep the description under 10 words and the supplier to the store/business name.',
      file_urls: [fileUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          description: { type: 'string' },
          supplier: { type: 'string' },
          gst: { type: 'number' },
          total: { type: 'number' },
        },
        required: ['date', 'description', 'supplier', 'gst', 'total'],
      },
    });
    const d = String(res?.date || '').trim();
    const num = v => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? +n.toFixed(2) : null;
    };
    return {
      date: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null,
      description: String(res?.description || '').trim() || null,
      supplier: String(res?.supplier || '').trim() || null,
      gst: num(res?.gst),
      total: num(res?.total),
    };
  } catch {
    return null;
  }
}