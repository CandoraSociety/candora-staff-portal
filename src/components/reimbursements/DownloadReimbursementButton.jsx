import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import { programLabel } from '@/lib/reimbursementConstants';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function DownloadReimbursementButton({ entries }) {
  const { user } = useCurrentUser();

  const download = () => {
    const name = displayName(user);
    const total = entries.reduce((s, e) => s + (e.total_cost || 0), 0);
    const gstTotal = entries.reduce((s, e) => s + (e.gst || 0), 0);

    const rows = entries.map((e, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="nw">${esc(e.date_incurred || '—')}</td>
        <td>
          ${esc(e.description)}
          ${e.receipt_url ? `
          <div class="receipt">
            <a href="${esc(e.receipt_url)}" target="_blank" rel="noopener noreferrer">View receipt</a>
            <span class="url">${esc(e.receipt_url)}</span>
          </div>` : '<div class="receipt none">No receipt attached</div>'}
        </td>
        <td>${esc(e.supplier || '—')}</td>
        <td>${esc(programLabel(e) || '—')}</td>
        <td class="r">${fmt(e.gst)}</td>
        <td class="r">${fmt(e.total_cost)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Reimbursement Request — ${esc(name)}</title>
  <style>
    @page { size: letter; margin: 0.6in; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 11pt; margin: 0; }
    .header { border-bottom: 3px solid #1e2f4d; padding-bottom: 10px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
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
    tr:nth-child(even) td { background: #f4f6f9; }
    .r { text-align: right; } .nw { white-space: nowrap; }
    .receipt { margin-top: 3px; font-size: 8pt; color: #555; word-break: break-all; }
    .receipt a { color: #1a56db; text-decoration: underline; }
    .receipt.none { color: #999; font-style: italic; }
    .totals { margin-top: 14px; margin-left: auto; width: 280px; }
    .totals .row { display: flex; justify-content: space-between; padding: 4px 8px; font-size: 10pt; }
    .totals .grand { border-top: 2px solid #1e2f4d; font-weight: bold; font-size: 12pt; padding-top: 6px; }
    .sig { margin-top: 36px; display: flex; gap: 40px; }
    .sig .line { flex: 1; border-top: 1px solid #333; padding-top: 4px; font-size: 8.5pt; color: #555; }
    .footnote { margin-top: 22px; font-size: 8pt; color: #777; border-top: 1px solid #ddd; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="org">Candora</div>
      <h1>Staff Reimbursement Request</h1>
    </div>
    <div class="date">Generated ${format(new Date(), 'MMMM d, yyyy')}</div>
  </div>

  <div class="fields">
    <div class="field"><div class="lbl">Cheque Payable to</div><div class="val">${esc(name)}</div></div>
    <div class="field"><div class="lbl">E-transfer Email</div><div class="val">${esc(user?.email || '')}</div></div>
    <div class="field"><div class="lbl">Requested by</div><div class="val">${esc(name)}</div></div>
    <div class="field"><div class="lbl">Date Requested</div><div class="val">${format(new Date(), 'yyyy-MM-dd')}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:22px">#</th>
        <th>Date</th>
        <th>Description &amp; Receipt</th>
        <th>Supplier</th>
        <th>Program</th>
        <th class="r">GST</th>
        <th class="r">Total (with GST)</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Total GST (documented)</span><span>${fmt(gstTotal)}</span></div>
    <div class="row grand"><span>Total Requested</span><span>${fmt(total)}</span></div>
  </div>

  <div class="sig">
    <div class="line">Staff Signature (typed): ${esc(name)}</div>
    <div class="line">Finance Approval</div>
  </div>

  <div class="footnote">
    ${entries.length} receipt entr${entries.length === 1 ? 'y' : 'ies'} compiled from the Not Submitted list. Receipt links above open the uploaded receipt files.
  </div>

  <script>window.onload = function () { setTimeout(function () { window.print(); }, 150); };</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=1000');
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  return (
    <Button variant="outline" size="sm" className="gap-2" disabled={!entries || entries.length === 0} onClick={download}>
      <Download className="w-4 h-4" />Download Reimbursement
    </Button>
  );
}