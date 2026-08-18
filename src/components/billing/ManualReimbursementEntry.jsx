import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { currentBillingMonth, parseBillingMonth } from './billingMonth';

// The five reimbursement / direct-cost dollar columns the user can manually
// enter on the Invoice Tracker monthly row. These flow straight into the
// invoice total (read by getMonthlyInvoiceData), so writing them updates the
// invoice immediately. Manual entries overwrite the portal-synced value for
// that cell; re-running the monthly sync will re-write them, so treat these as
// one-off overrides for items not yet set up in the portal.
const COLUMNS = [
  { col: 'CF', label: 'Exposure Courses — DEA (Reimbursement)' },
  { col: 'CG', label: 'Exposure Courses — WD (Reimbursement)' },
  { col: 'CH', label: 'Childminding' },
  { col: 'CI', label: 'Employment Supports (Reimbursement)' },
  { col: 'CJ', label: 'Paid Work Exposure (Reimbursement)' },
];

export default function ManualReimbursementEntry() {
  const [month, setMonth] = useState(currentBillingMonth());
  const [values, setValues] = useState({});        // existing sheet values by col
  const [edits, setEdits] = useState({});           // pending edits by col
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [invoice, setInvoice] = useState(null);

  const loadRow = useCallback(async (m) => {
    setLoading(true);
    setValues({});
    setEdits({});
    try {
      const res = await base44.functions.invoke('getInvoiceTrackerMonthRow', { billingMonth: m });
      const data = res.data || {};
      if (data.status === 'success') {
        setValues(data.valuesByCol || {});
      } else {
        toast.error(
          data.status === 'month_not_found'
            ? `No Invoice Tracker row found for ${m} in the active CRT workbook`
            : 'Could not read Invoice Tracker row'
        );
      }
    } catch {
      toast.error('Failed to load Invoice Tracker row');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRow(month); }, [month, loadRow]);

  const refreshInvoice = useCallback(async (m) => {
    try {
      const res = await base44.functions.invoke('getMonthlyInvoiceData', { billingMonth: m });
      setInvoice(res.data || null);
    } catch { /* best-effort */ }
  }, []);

  useEffect(() => { refreshInvoice(month); }, [month, refreshInvoice]);

  const cellValue = (col) => {
    if (Object.prototype.hasOwnProperty.call(edits, col)) return edits[col];
    const v = values[col];
    if (v == null || v === '') return '';
    const n = Number(v);
    return isNaN(n) ? String(v) : String(n);
  };

  const changed = COLUMNS.filter(c =>
    Object.prototype.hasOwnProperty.call(edits, c.col) &&
    String(edits[c.col]).trim() !== String(values[c.col] ?? '').trim()
  );

  const apply = async () => {
    if (!changed.length) { toast.message('No changes to apply'); return; }
    setApplying(true);
    try {
      const adjustments = changed.map(c => ({ colLetter: c.col, value: edits[c.col] }));
      const res = await base44.functions.invoke('applyManualTrackerAdjustment', {
        billingMonth: month,
        adjustments,
      });
      const data = res.data || {};
      if (data.status === 'success') {
        const next = { ...values };
        for (const w of (data.written || [])) next[w.colLetter] = w.value;
        setValues(next);
        setEdits({});
        toast.success(`Updated ${data.written.length} cell(s) on row ${data.row}`);
        await refreshInvoice(month);
        await loadRow(month);
      } else {
        toast.error(
          data.status === 'month_not_found'
            ? `No row for ${month} in the active CRT workbook`
            : 'Adjustment failed'
        );
      }
    } catch (e) {
      toast.error('Adjustment failed');
    } finally {
      setApplying(false);
    }
  };

  const reset = () => setEdits({});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Manual Reimbursement Entry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Manually enter dollar amounts for these five Invoice Tracker columns. Each entry
          writes directly to the monthly row and updates the invoice total immediately —
          use this for items you need on the invoice without setting up the full portal record.
          Note: a portal re-sync will overwrite these, so re-apply if the sync runs.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Billing month</Label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-44"
            />
          </div>
          <p className="text-xs text-slate-400">
            {format(parseBillingMonth(month), 'MMMM yyyy')} · active CRT workbook
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COLUMNS.map(c => (
            <div key={c.col} className="space-y-1">
              <Label className="text-xs text-slate-500">
                <span className="font-mono text-slate-700 mr-1">{c.col}</span>
                {c.label}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cellValue(c.col)}
                  onChange={(e) => setEdits(prev => ({ ...prev, [c.col]: e.target.value }))}
                  disabled={applying || loading}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={apply} disabled={applying || loading || !changed.length}>
            {applying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Apply to Invoice
          </Button>
          {changed.length > 0 && (
            <Button variant="outline" onClick={reset} disabled={applying}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
          {changed.length > 0 ? (
            <span className="text-xs text-slate-500">{changed.length} cell(s) changed</span>
          ) : (
            <span className="text-xs text-slate-400">No changes yet</span>
          )}
        </div>

        {invoice && invoice.status === 'success' && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Updated Invoice — {invoice.billingMonth}
            </p>
            <div className="text-sm text-slate-700 space-y-0.5">
              {invoice.lineItems?.filter(li => li.amount || li.quantity).map(li => (
                <div key={li.key} className="flex justify-between">
                  <span>{li.label}{li.quantity != null ? ` × ${li.quantity}` : ''}</span>
                  <span className="font-medium">${(li.amount || 0).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-1 mt-1 font-bold">
                <span>Total</span>
                <span>${(invoice.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}