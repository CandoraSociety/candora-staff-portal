import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, PenLine } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import { programLabel } from '@/lib/reimbursementConstants';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function DownloadReimbursementButton({ entries }) {
  const { user } = useCurrentUser();
  const [sigOpen, setSigOpen] = useState(false);
  const [signature, setSignature] = useState('');
  const [sigError, setSigError] = useState('');

  const askForSignature = () => {
    setSignature('');
    setSigError('');
    setSigOpen(true);
  };

  const download = async () => {
    const sig = signature.trim();
    if (!sig) { setSigError('Type your full name to e-sign the form.'); return; }
    setSigError('');

    // Use the latest saved e-transfer email from the profile
    let etransferEmail = user?.etransfer_email || user?.email || '';
    try {
      const u = await base44.auth.me();
      if (u?.etransfer_email || u?.email) etransferEmail = u.etransfer_email || u.email;
    } catch { /* fall back to the loaded user */ }

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
        <td class="r">${e.gst ? fmt(e.gst / 2) : '$ -'}</td>
        <td class="r fill">${e.funder_cost ? fmt(e.funder_cost) : ''}</td>
        <td class="fill">${esc(e.account_no || '')}</td>
        <td class="fill">${esc(e.funder_no || '')}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Reimbursement Request — ${esc(name)}</title>
  <style>
    @page { size: letter landscape; margin: 0.5in; }
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
    .fill { background: #fff; border: 1px solid #ccc; min-height: 14px; }
    .receipt { margin-top: 3px; font-size: 8pt; color: #555; word-break: break-all; }
    .receipt a { color: #1a56db; text-decoration: underline; }
    .receipt.none { color: #999; font-style: italic; }
    .totals { margin-top: 14px; margin-left: auto; width: 280px; }
    .totals .row { display: flex; justify-content: space-between; padding: 4px 8px; font-size: 10pt; }
    .totals .grand { border-top: 2px solid #1e2f4d; font-weight: bold; font-size: 12pt; padding-top: 6px; }
    .sig { margin-top: 36px; display: flex; gap: 40px; }
    .sig .line { flex: 1; border-top: 1px solid #333; padding-top: 4px; font-size: 8.5pt; color: #555; }
    .sig .signed { font-family: 'Segoe Script', 'Brush Script MT', cursive; font-size: 15pt; color: #1a3a6b; }
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
    <div class="field"><div class="lbl">E-transfer Email</div><div class="val">${esc(etransferEmail)}</div></div>
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
        <th class="r">1/2 GST</th>
        <th class="r">Funder Cost</th>
        <th>Account #</th>
        <th>Funder #</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Total GST (documented)</span><span>${fmt(gstTotal)}</span></div>
    <div class="row grand"><span>Total Requested</span><span>${fmt(total)}</span></div>
  </div>

  <div class="sig">
    <div class="line"><span class="signed">${esc(sig)}</span>Staff e-Signature</div>
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
    setSigOpen(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" disabled={!entries || entries.length === 0} onClick={askForSignature}>
        <Download className="w-4 h-4" />Download Reimbursement
      </Button>

      <Dialog open={sigOpen} onOpenChange={setSigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><PenLine className="w-4 h-4" />e-Sign Your Reimbursement Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Type your full name below to e-sign the downloadable reimbursement form. This signature will fill the signature slot on the form.
            </p>
            <div>
              <Label className="text-xs">e-Signature — type your full name *</Label>
              <Input value={signature} onChange={e => { setSignature(e.target.value); setSigError(''); }} placeholder={displayName(user)} />
            </div>
            {sigError && <p className="text-xs text-red-600">{sigError}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={download} className="gap-2">
              <Download className="w-4 h-4" />Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}