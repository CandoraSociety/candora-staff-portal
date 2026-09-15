import { format } from 'date-fns';
import { programLabel } from '@/lib/reimbursementConstants';
import { REIMBURSEMENT_MODES } from '@/lib/reimbursementMode';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => esc(s).replace(/"/g, '&quot;');
// Fillable Account # / Funder # cell — rendered as a text input so the values can be
// typed in on screen (in the viewer) and persist into the saved/printed PDF
const fillableCell = (entry, field) => `
        <td class="fill"><input class="cell-input" type="text" data-entry-id="${escAttr(entry.id || '')}" data-field="${field}" value="${escAttr(entry[field] || '')}" placeholder="—" /></td>`;
// Candora logo (public asset — same as the app favicon)
export const CANDORA_LOGO_URL = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png';
// Funder Cost autofill: Total (with GST) − GST + 1/2 GST = Total − 1/2 GST
// A stored funder_cost of 0 (or empty) is treated as not set — autofill applies instead
export const funderCostOf = e => (typeof e.funder_cost === 'number' && e.funder_cost > 0)
  ? e.funder_cost
  : (e.total_cost || 0) - (e.gst || 0) / 2;

// Builds the printable/shareable reimbursement document HTML.
// viewerName = name of the person opening the form (fallback for unsubmitted compilations).
export function buildReimbursementDocumentHtml({ entries, form, mode, viewerName = '', etransferEmail = '', staffSignature = '', autoPrint = false }) {
  const cfg = REIMBURSEMENT_MODES[mode];
  const requesterName = form?.requester_name || viewerName;
  const payableTo = form?.payable_to || requesterName;
  const dateRequested = form?.date_requested || format(new Date(), 'yyyy-MM-dd');
  const submittedDate = form?.submitted_date || dateRequested;
  const total = entries.reduce((s, e) => s + (e.total_cost || 0), 0);
  const gstTotal = entries.reduce((s, e) => s + (e.gst || 0), 0);
  // Line items in chronological order
  const sortedEntries = [...entries].sort((a, b) => String(a.date_incurred || '').localeCompare(String(b.date_incurred || '')));

  const rows = sortedEntries.map((e, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="nw">${esc(e.date_incurred || '—')}</td>
        <td>${esc(e.supplier || '—')}</td>
        <td>
          ${esc(e.description)}
          ${e.excluded_amount > 0 ? `<div class="excl">✂ ${fmt(e.excluded_amount * 1.05)} personal item excluded${e.excluded_description ? ` (${esc(e.excluded_description)})` : ''}</div>` : ''}
          ${e.receipt_url ? `
          <div class="receipt">
            <a class="btn" href="${esc(e.receipt_url)}" target="_blank" rel="noopener noreferrer">Receipt</a>
          </div>` : '<div class="receipt none">No receipt attached</div>'}
        </td>
        <td>${esc(programLabel(e) || '—')}</td>
        <td class="r">${fmt(e.total_cost)}</td>
        <td class="r">${fmt(e.gst)}</td>
        <td class="r fill">${e.gst ? fmt(e.gst / 2) : '$ -'}</td>
        <td class="r fill">${fmt(funderCostOf(e))}</td>
        ${fillableCell(e, 'account_no')}
        ${fillableCell(e, 'funder_no')}
      </tr>`).join('');

  // Column totals — Total (with GST), GST, 1/2 GST, Funder Cost
  const halfGstTotal = gstTotal / 2;
  const funderCostTotal = sortedEntries.reduce((s, e) => s + funderCostOf(e), 0);

  return `<!DOCTYPE html>
<html>
<head>
  <title>${cfg.docTitle} — ${esc(requesterName)} — ${esc(submittedDate)}</title>
  <style>
    @page { size: letter landscape; margin: 0.5in; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 11pt; margin: 0; }
    .header { border-bottom: 3px solid #1e2f4d; padding-bottom: 10px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header .brand { display: flex; align-items: center; gap: 14px; }
    .header .logo { height: 64px; width: auto; }
    .header h1 { margin: 0; font-size: 18pt; color: #1e2f4d; }
    .header .org { font-size: 13pt; font-weight: bold; color: #1e2f4d; }
    .header .date { font-size: 10pt; color: #555; }
    .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 18px; }
    .field { border: 1px solid #999; border-radius: 4px; padding: 5px 8px; }
    .field .lbl { font-size: 8pt; text-transform: uppercase; color: #666; letter-spacing: 0.04em; }
    .field .val { font-size: 11pt; font-weight: bold; min-height: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
    th { background: #1e2f4d; color: #fff; text-align: left; padding: 6px 8px; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.03em; }
    td { border-bottom: 1px solid #ccc; padding: 6px 8px; vertical-align: top; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    tr:nth-child(even) td { background: #f4f6f9; }
    .r { text-align: right; } .nw { white-space: nowrap; }
    .fill { background: #e8e8e8 !important; border: 1px solid #bbb; min-height: 14px; }
    .cell-input { width: 100%; border: none; background: transparent; font: inherit; padding: 0; margin: 0; color: inherit; }
    .cell-input:focus { outline: none; }
    .receipt { margin-top: 3px; font-size: 8pt; color: #555; word-break: break-all; }
    .receipt .btn { display: inline-block; background: #1e2f4d; color: #fff; font-size: 8.5pt; font-weight: bold; padding: 3px 12px; border-radius: 3px; text-decoration: none; }
    .receipt.none { color: #999; font-style: italic; }
    .excl { margin-top: 2px; font-size: 8pt; color: #b45309; }
    .col-totals { break-inside: avoid; page-break-inside: avoid; }
    .col-totals td { border-top: 2px solid #1e2f4d; border-bottom: none; font-weight: bold; background: #fff !important; padding-top: 8px; }
    .col-totals .tl { text-align: right; font-size: 9.5pt; text-transform: uppercase; color: #1e2f4d; }
    .totals { margin-top: 14px; margin-left: auto; width: 280px; }
    .totals .row { display: flex; justify-content: space-between; padding: 4px 8px; font-size: 10pt; }
    .totals .grand { border-top: 2px solid #1e2f4d; font-weight: bold; font-size: 12pt; padding-top: 6px; }
    .sig { margin-top: 36px; display: flex; gap: 40px; }
    .sig .line { flex: 1; font-size: 8.5pt; color: #555; }
    .sig .rule { border-top: 1px solid #333; margin-top: 10px; padding-top: 4px; }
    .sig .signed { font-family: 'Segoe Script', 'Brush Script MT', cursive; font-size: 15pt; color: #1a3a6b; display: block; min-height: 26px; }
    .footnote { margin-top: 22px; font-size: 8pt; color: #777; border-top: 1px solid #ddd; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <img class="logo" src="${CANDORA_LOGO_URL}" alt="Candora" />
      <div>
        <div class="org">Candora</div>
        <h1>${cfg.docTitle}</h1>
      </div>
    </div>
    <div class="date">Generated ${format(new Date(), 'MMMM d, yyyy')}</div>
  </div>

  <div class="fields">
    <div class="field"><div class="lbl">Cheque Payable to</div><div class="val">${esc(payableTo)}</div></div>
    <div class="field"><div class="lbl">E-transfer Email</div><div class="val">${esc(etransferEmail)}</div></div>
    <div class="field"><div class="lbl">Requested by</div><div class="val">${esc(form?.requested_by || requesterName)}</div></div>
    <div class="field"><div class="lbl">Date Requested</div><div class="val">${esc(dateRequested)}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:22px">#</th>
        <th>Date</th>
        <th>Supplier</th>
        <th>Description &amp; Receipt</th>
        <th>Program</th>
        <th class="r">Total (with GST)</th>
        <th class="r">GST</th>
        <th class="r">1/2 GST</th>
        <th class="r">Funder Cost</th>
        <th>Account #</th>
        <th>Funder #</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="col-totals">
        <td colspan="5" class="tl">Column Totals</td>
        <td class="r">${fmt(total)}</td>
        <td class="r">${fmt(gstTotal)}</td>
        <td class="r">${fmt(halfGstTotal)}</td>
        <td class="r">${fmt(funderCostTotal)}</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Total GST (documented)</span><span>${fmt(gstTotal)}</span></div>
    <div class="row grand"><span>Total Requested</span><span>${fmt(total)}</span></div>
  </div>

  <div class="sig">
    <div class="line"><span class="signed">${esc(form?.staff_signature || staffSignature)}</span><div class="rule">Staff e-Signature</div></div>
    <div class="line"><span class="signed">${esc(form?.supervisor_signature || form?.approved_by || '')}</span><div class="rule">Approved by</div></div>
    <div class="line"><span class="signed">${esc(form?.finance_signature || '')}</span><div class="rule">Financial Officer Approval</div></div>
  </div>

  <div class="footnote">
    ${form
      ? `${entries.length} receipt entr${entries.length === 1 ? 'y' : 'ies'} from the ${esc(cfg.formCardLabel)} submitted on ${esc(form.submitted_date || dateRequested)}. Receipt links above open the uploaded receipt files.`
      : `${entries.length} receipt entr${entries.length === 1 ? 'y' : 'ies'} compiled from the Not Submitted list. Receipt links above open the uploaded receipt files.`}
  </div>

  ${autoPrint ? '<script>window.onload = function () { setTimeout(function () { window.print(); }, 150); };</script>' : ''}
</body>
</html>`;
}