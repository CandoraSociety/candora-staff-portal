import { base44 } from '@/api/base44Client';

/**
 * Reads key fields off an uploaded receipt (image or PDF): purchase date,
 * item description, supplier, GST charged, and the grand total with GST.
 * Also detects multi-vendor receipts (several receipts photographed together
 * on one page): the `vendors` array holds one entry per distinct vendor with
 * that vendor's own date/description/supplier/gst/total.
 * Returns { date, description, supplier, gst, total, vendors } — any field the
 * model can't read comes back null so the caller falls back to manual entry.
 */
export async function extractReceiptDetails(fileUrl) {
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: 'This is a receipt or invoice, possibly several photographed together on one page. If the page contains purchases from MULTIPLE DIFFERENT vendors/stores, identify each distinct vendor separately. For each distinct vendor read: the transaction/purchase date, a short description of the items purchased from that vendor, the vendor/store name, the GST amount charged by that vendor, and that vendor\'s grand total including GST. Return these in the `vendors` array — exactly one item per distinct vendor. If there is only one vendor, return a single vendors item with the overall receipt fields. Also fill the top-level date/description/supplier/gst/total with the first vendor\'s values. Return dates as YYYY-MM-DD (empty string if not readable). Return gst and total as plain numbers without currency signs (gst 0 if no GST was charged). Keep each description under 10 words and each supplier to the store/business name.',
      file_urls: [fileUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          description: { type: 'string' },
          supplier: { type: 'string' },
          gst: { type: 'number' },
          total: { type: 'number' },
          vendors: {
            type: 'array',
            items: {
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
          },
        },
        required: ['date', 'description', 'supplier', 'gst', 'total', 'vendors'],
      },
    });
    const norm = v => {
      const d = String(v?.date || '').trim();
      const n = x => {
        const num = Number(x);
        return Number.isFinite(num) && num >= 0 ? +num.toFixed(2) : null;
      };
      return {
        date: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null,
        description: String(v?.description || '').trim() || null,
        supplier: String(v?.supplier || '').trim() || null,
        gst: n(v?.gst),
        total: n(v?.total),
      };
    };
    const base = norm(res);
    const vendors = (Array.isArray(res?.vendors) ? res.vendors : [])
      .map(norm)
      // a vendor section must at least have a name or a total to count
      .filter(v => v.supplier || (v.total != null && v.total > 0));
    return { ...base, vendors };
  } catch {
    return null;
  }
}