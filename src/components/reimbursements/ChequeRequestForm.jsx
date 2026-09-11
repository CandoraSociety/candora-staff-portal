import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Send, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';

const emptyLine = () => ({
  receipt_no: '', date: '', program: '', supplier: '', description: '',
  total_cost: '', gst: '', funder_cost: '', account_no: '', funder_no: '', receipt_url: '',
});

function Cell({ label, children, className = '' }) {
  return (
    <div className={`bg-card p-3 space-y-1.5 ${className}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

const COLS = [
  { key: 'receipt_no', label: 'Receipt #', width: 'w-[86px]' },
  { key: 'date', label: 'Date', width: 'w-[130px]', type: 'date' },
  { key: 'program', label: 'Program', width: 'w-[110px]' },
  { key: 'supplier', label: 'Supplier', width: 'w-[140px]' },
  { key: 'description', label: 'Description (items purchased)', width: '' },
  { key: 'total_cost', label: 'Total Cost (with GST)', width: 'w-[120px]', type: 'number' },
  { key: 'gst', label: 'GST', width: 'w-[90px]', type: 'number' },
  { key: 'funder_cost', label: 'Funder Cost', width: 'w-[110px]', type: 'number' },
  { key: 'account_no', label: 'Account #', width: 'w-[96px]' },
  { key: 'funder_no', label: 'Funder #', width: 'w-[86px]' },
];

export default function ChequeRequestForm() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [header, setHeader] = useState({
    payable_to: '', etransfer_email: '', requested_by: '',
    date_requested: format(new Date(), 'yyyy-MM-dd'), staff_signature: '',
  });
  const [lines, setLines] = useState([emptyLine(), emptyLine(), emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.full_name && !header.payable_to) {
      const name = displayName(user);
      setHeader(h => ({
        ...h,
        payable_to: h.payable_to || name,
        requested_by: h.requested_by || name,
      }));
    }
  }, [user?.full_name]);

  const setH = (k, v) => setHeader(h => ({ ...h, [k]: v }));

  const setLine = (i, k, v) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));

  const total = useMemo(() =>
    lines.reduce((sum, l) => sum + (parseFloat(l.total_cost) || 0), 0), [lines]);

  const onReceipt = async (i, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setLine(i, 'receipt_url', file_url);
    } catch (err) {
      setError('Receipt upload failed.');
    }
  };

  const submit = async () => {
    setError('');
    if (!header.payable_to.trim()) { setError('Enter who the cheque is payable to.'); return; }
    const valid = lines.filter(l => (parseFloat(l.total_cost) || 0) > 0);
    if (valid.length === 0) { setError('Add at least one expense line with a total cost.'); return; }
    setSubmitting(true);
    try {
      await base44.entities.StaffReimbursementRequest.create({
        requester_name: displayName(user),
        requester_email: user?.email || '',
        payable_to: header.payable_to,
        etransfer_email: header.etransfer_email,
        requested_by: header.requested_by,
        date_requested: header.date_requested,
        staff_signature: header.staff_signature,
        line_items: valid.map(l => ({
          receipt_no: l.receipt_no,
          date: l.date || null,
          program: l.program,
          supplier: l.supplier,
          description: l.description,
          total_cost: parseFloat(l.total_cost),
          gst: l.gst ? parseFloat(l.gst) : 0,
          half_gst: l.gst ? parseFloat(l.gst) / 2 : 0,
          funder_cost: l.funder_cost ? parseFloat(l.funder_cost) : 0,
          account_no: l.account_no,
          funder_no: l.funder_no,
          receipt_url: l.receipt_url,
        })),
        amount: total,
        date_incurred: header.date_requested,
        status: 'pending',
        submitted_date: format(new Date(), 'yyyy-MM-dd'),
      });
      qc.invalidateQueries({ queryKey: ['my-reimbursements'] });
      qc.invalidateQueries({ queryKey: ['staff-reimbursements'] });
      setHeader({
        payable_to: user?.full_name || '', etransfer_email: '', requested_by: user?.full_name || '',
        date_requested: format(new Date(), 'yyyy-MM-dd'), staff_signature: '',
      });
      setLines([emptyLine(), emptyLine(), emptyLine()]);
    } catch (err) {
      setError(err?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden">
        <Cell label="Cheque Payable to *">
          <Input value={header.payable_to} onChange={e => setH('payable_to', e.target.value)} placeholder="Name on cheque" />
        </Cell>
        <Cell label="E-transfer Email">
          <Input value={header.etransfer_email} onChange={e => setH('etransfer_email', e.target.value)} placeholder="name@email.com" />
        </Cell>
        <Cell label="Requested by">
          <Input value={header.requested_by} onChange={e => setH('requested_by', e.target.value)} />
        </Cell>
        <Cell label="Date Requested">
          <Input type="date" value={header.date_requested} onChange={e => setH('date_requested', e.target.value)} />
        </Cell>
        <Cell label="Staff Signature">
          <Input value={header.staff_signature} onChange={e => setH('staff_signature', e.target.value)} placeholder="Type your name" />
        </Cell>
        <Cell label="Total Requested (with GST)">
          <div className="h-9 px-3 flex items-center font-semibold text-base">${total.toFixed(2)}</div>
        </Cell>
      </div>

      {/* Line items */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="bg-muted/60 text-left text-xs text-muted-foreground uppercase tracking-wide">
              {COLS.map(c => (
                <th key={c.key} className={`px-2.5 py-2.5 font-semibold ${c.width}`}>{c.label}</th>
              ))}
              <th className="px-2 py-2.5 font-semibold w-[96px]">½ GST</th>
              <th className="px-2 py-2.5 font-semibold w-[70px]">Receipt</th>
              <th className="px-2 py-2.5 w-[44px]"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="border-t border-border">
                {COLS.map(c => (
                  <td key={c.key} className="px-1.5 py-1">
                    <Input
                      type={c.type || 'text'}
                      step={c.type === 'number' ? '0.01' : undefined}
                      min={c.type === 'number' ? '0' : undefined}
                      value={line[c.key] || ''}
                      onChange={e => setLine(i, c.key, e.target.value)}
                      className="h-8 border-transparent bg-transparent hover:border-input focus:bg-card"
                    />
                  </td>
                ))}
                <td className="px-2 text-muted-foreground whitespace-nowrap">
                  {line.gst ? `$${(parseFloat(line.gst) / 2).toFixed(2)}` : '—'}
                </td>
                <td className="px-2">
                  <label className="flex items-center justify-center cursor-pointer" title={line.receipt_url ? 'Receipt attached' : 'Attach receipt'}>
                    <Paperclip className={`w-4 h-4 ${line.receipt_url ? 'text-primary' : 'text-muted-foreground'}`} />
                    <input type="file" className="hidden" onChange={e => onReceipt(i, e)} />
                  </label>
                </td>
                <td className="px-2">
                  <button
                    onClick={() => setLines(ls => ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove line"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            <tr className="border-t border-border bg-muted/30">
              <td colSpan={5} className="px-3 py-2 text-xs text-muted-foreground">
                {lines.filter(l => (parseFloat(l.total_cost) || 0) > 0).length} expense line(s)
              </td>
              <td className="px-2.5 py-2 text-right font-semibold">${total.toFixed(2)}</td>
              <td colSpan={4} className="px-2.5 py-2 text-right text-xs text-muted-foreground">Total Requested</td>
              <td colSpan={3}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setLines(ls => [...ls, emptyLine()])}>
          <Plus className="w-4 h-4" />Add Line
        </Button>
        <Button onClick={submit} disabled={submitting} className="gap-2">
          <Send className="w-4 h-4" />{submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}