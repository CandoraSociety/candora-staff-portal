import { format, parseISO } from 'date-fns';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Candora logo (public asset — same as the app favicon)
export const CANDORA_LOGO_URL = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png';

// Totals for a FinanceInvoice — subtotal from line items, 5% GST when charged
export function computeInvoiceTotals(invoice) {
  const items = invoice?.line_items || [];
  const subtotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
  const gst = invoice?.charge_gst ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
  return { subtotal, gst, total: subtotal + gst };
}

// File name for saved/printed invoices:
// Candora-{Customer}_{Month-Year}_{Invoice number}
// e.g. Candora-Christcity_Lighthouse_Sept-26_CCL-LEASE-0001
export function buildInvoiceFileName(invoice) {
  const sanitize = s => String(s ?? '').trim().replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, '');
  let name = 'Candora';
  if (invoice.counterparty_name) name += `-${sanitize(invoice.counterparty_name)}`;
  const date = invoice.invoice_date ? parseISO(invoice.invoice_date) : new Date();
  name += `_${format(date, 'MMM-yy').replace(/^Sep-/, 'Sept-')}`;
  if (invoice.invoice_number) name += `_${invoice.invoice_number}`;
  return name;
}

// Builds the printable invoice document HTML.
// Receivable = a standard invoice Candora sends to a customer (Candora is the seller).
// Payable = an invoice prepared on behalf of a vendor who doesn't issue their own
// (the vendor is the seller, Candora is the buyer — for Candora's payables processing).
export function buildInvoiceDocumentHtml({ invoice }) {
  const isPayable = invoice.invoice_type === 'payable';
  const { subtotal, gst, total } = computeInvoiceTotals(invoice);
  const items = invoice.line_items || [];

  const rows = items.map((it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${esc(it.description)}</td>
        <td class="r">${Number(it.quantity) || 0}</td>
        <td class="r">${fmt(it.unit_price)}</td>
        <td class="r">${fmt((Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}</td>
      </tr>`).join('');

  const partyBlock = (p) => `
      <div class="party-name">${esc(p.name || '—')}</div>
      ${p.address ? `<div class="sub">${esc(p.address)}</div>` : ''}
      ${p.email ? `<div class="sub">${esc(p.email)}</div>` : ''}
      ${p.phone ? `<div class="sub">${esc(p.phone)}</div>` : ''}`;

  const candoraBlock = `<div class="party-name">Candora Society of Edmonton</div>`;
  const fromBlock = isPayable
    ? partyBlock({ name: invoice.counterparty_name, address: invoice.counterparty_address, email: invoice.counterparty_email, phone: invoice.counterparty_phone })
    : candoraBlock;
  const toBlock = isPayable
    ? candoraBlock
    : partyBlock({ name: invoice.counterparty_name, address: invoice.counterparty_address, email: invoice.counterparty_email, phone: invoice.counterparty_phone });

  return `<!DOCTYPE html>
<html>
<head>
  <title>${esc(buildInvoiceFileName(invoice))}</title>
  <style>
    @page { size: letter landscape; margin: 0.5in; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 11pt; margin: 0; }
    .header { border-bottom: 3px solid #1e2f4d; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header .brand { display: flex; align-items: center; gap: 14px; }
    .header .logo { height: 64px; width: auto; }
    .header .org { font-size: 13pt; font-weight: bold; color: #1e2f4d; }
    .header h1 { margin: 0; font-size: 18pt; color: #1e2f4d; }
    .header .meta { text-align: right; font-size: 10pt; }
    .header .meta div { margin-bottom: 3px; }
    .lbl { font-size: 8pt; text-transform: uppercase; color: #666; letter-spacing: 0.04em; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 18px; }
    .party-name { font-size: 12pt; font-weight: bold; margin-bottom: 2px; }
    .sub { font-size: 10pt; color: #333; }
    .behalf { background: #f4f6f9; border: 1px solid #ccc; border-radius: 4px; padding: 8px 12px; font-size: 9.5pt; color: #333; margin-bottom: 18px; }
    .ref { margin-bottom: 16px; font-size: 11pt; }
    .ref strong { color: #1e2f4d; }
    table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    th { background: #1e2f4d; color: #fff; text-align: left; padding: 7px 10px; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.03em; }
    td { border-bottom: 1px solid #ccc; padding: 7px 10px; vertical-align: top; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    tr:nth-child(even) td { background: #f4f6f9; }
    .r { text-align: right; }
    .totals { margin-top: 16px; margin-left: auto; width: 300px; }
    .totals .row { display: flex; justify-content: space-between; padding: 4px 8px; font-size: 10.5pt; }
    .totals .grand { border-top: 2px solid #1e2f4d; font-weight: bold; font-size: 12.5pt; padding-top: 6px; }
    .notes { margin-top: 20px; }
    .notes .body { font-size: 10pt; white-space: pre-wrap; }
    .foot { margin-top: 36px; font-size: 8pt; color: #777; border-top: 1px solid #ddd; padding-top: 6px; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <img class="logo" src="${CANDORA_LOGO_URL}" alt="Candora" />
      <div>
        <div class="org">Candora</div>
        <h1>${isPayable ? 'Invoice — Prepared on Behalf' : 'Invoice'}</h1>
      </div>
    </div>
    <div class="meta">
      <div><span class="lbl">Invoice #</span> <strong>${esc(invoice.invoice_number || '—')}</strong></div>
      <div><span class="lbl">Date</span> <strong>${esc(invoice.invoice_date || '—')}</strong></div>
      <div><span class="lbl">Due</span> <strong>${esc(invoice.due_date || '—')}</strong></div>
      ${invoice.payment_terms ? `<div><span class="lbl">Terms</span> <strong>${esc(invoice.payment_terms)}</strong></div>` : ''}
    </div>
  </div>

  <div class="parties">
    <div><div class="lbl">${isPayable ? 'From (service provider)' : 'From'}</div>${fromBlock}</div>
    <div><div class="lbl">Bill To</div>${toBlock}</div>
  </div>

  ${isPayable ? '<div class="behalf">This invoice was prepared by Candora on behalf of the service provider named above, for services provided to Candora. It is issued for Candora\u2019s payables processing.</div>' : ''}

  ${invoice.reference ? `<div class="ref"><span class="lbl">For</span> <strong>${esc(invoice.reference)}</strong></div>` : ''}

  <table>
    <thead>
      <tr>
        <th style="width:24px">#</th>
        <th>Description</th>
        <th class="r" style="width:60px">Qty</th>
        <th class="r" style="width:90px">Unit Price</th>
        <th class="r" style="width:100px">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="5" style="text-align:center;color:#999;">No line items</td></tr>'}
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
    ${invoice.charge_gst ? `<div class="row"><span>GST (5%)</span><span>${fmt(gst)}</span></div>` : ''}
    <div class="row grand"><span>${isPayable ? 'Total Payable' : 'Total Due'}</span><span>${fmt(total)}</span></div>
  </div>

  ${invoice.notes ? `<div class="notes"><div class="lbl">Notes</div><div class="body">${esc(invoice.notes)}</div></div>` : ''}

  <div class="foot">
    <div>${invoice.prepared_by_name ? `Prepared by ${esc(invoice.prepared_by_name)}` : ''}</div>
    <div>Generated ${format(new Date(), 'MMMM d, yyyy')}</div>
  </div>
</body>
</html>`;
}