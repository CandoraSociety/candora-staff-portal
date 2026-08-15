import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { parseBillingMonth } from './billingMonth';

export default function ManualAdjustmentsTab({ pkg }) {
  const [columns, setColumns] = useState([]);
  const [monthRows, setMonthRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colLetter, setColLetter] = useState('');
  const [value, setValue] = useState('');
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('getInvoiceTrackerColumns', {});
        const data = res.data || {};
        setColumns(data.columns || []);
        setMonthRows(data.monthRows || []);
        if ((data.columns || []).length) setColLetter(data.columns[0].colLetter);
        if (data.status && data.status !== 'success' && data.status !== 'empty') {
          toast.error(data.status === 'no_workbook' ? 'No active CRT workbook found' : 'Could not read Invoice Tracker');
        }
      } catch (e) {
        toast.error('Failed to load Invoice Tracker columns');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const target = monthRows.find(m => m.monthLabel === pkg.billing_month);
  const selectedCol = columns.find(c => c.colLetter === colLetter);

  const apply = async () => {
    if (!colLetter) { toast.error('Select a column'); return; }
    if (!target) { toast.error(`No Invoice Tracker row found for ${pkg.billing_month}`); return; }
    setApplying(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('applyManualTrackerAdjustment', {
        billingMonth: pkg.billing_month,
        colLetter,
        value,
      });
      const data = res.data || {};
      if (data.status === 'success') {
        setResult({ ok: true, row: data.row, colLetter: data.colLetter, written: data.written });
        toast.success(`Applied to cell ${data.colLetter}${data.row}`);
        try {
          const inv = await base44.functions.invoke('getMonthlyInvoiceData', { billingMonth: pkg.billing_month });
          setInvoice(inv.data || null);
        } catch { /* invoice refresh best-effort */ }
      } else {
        setResult({ ok: false, message: data.status || 'failed' });
        toast.error(data.status === 'month_not_found'
          ? 'No row for this month in the active CRT workbook'
          : 'Adjustment failed');
      }
    } catch (e) {
      setResult({ ok: false, message: e?.message || 'error' });
      toast.error('Adjustment failed');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Tracker — Manual Adjustment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            Write a value into any column of the Invoice Tracker sheet for{' '}
            <span className="font-medium">{format(parseBillingMonth(pkg.billing_month), 'MMMM yyyy')}</span>.
            After applying, the invoice below refreshes straight from the tracker (the same
            calculation the existing automations use), so the change flows through immediately.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading Invoice Tracker columns…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Column</label>
                  <select
                    value={colLetter}
                    onChange={(e) => setColLetter(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    {columns.map(c => (
                      <option key={c.colLetter} value={c.colLetter}>
                        {c.label} (col {c.colLetter})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">New Value</label>
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. 12 or 1500.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Target Month Row</label>
                  <div className="h-9 flex items-center text-sm">
                    {target ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-green-600" /> Row {target.excelRow} · {target.monthLabel}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-700">
                        <AlertTriangle className="w-4 h-4" /> No row for {pkg.billing_month} in the active CRT
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={apply} disabled={applying || !target || !colLetter}>
                  {applying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Apply Adjustment
                </Button>
                {selectedCol && (
                  <span className="text-xs text-slate-500">
                    Writing to column {selectedCol.colLetter} ({selectedCol.label})
                  </span>
                )}
              </div>

              {result && (
                <div className={`rounded-md border p-3 text-sm ${result.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {result.ok ? (
                    <>Wrote <span className="font-mono font-semibold">{String(result.written)}</span> to cell <span className="font-mono">{result.colLetter}{result.row}</span>. Dependent formula columns were recalculated.</>
                  ) : (
                    <>Failed: {result.message}</>
                  )}
                </div>
              )}

              {invoice && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Updated Invoice (from tracker)</p>
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
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Data — Field Note</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Putting an Excel cell <em>note</em> (the comment flag on a field) onto a client's
            name cell in the CRT Client Data sheet isn't possible through the Microsoft Graph
            Excel REST API — it can read and write cell values but can't create cell comments.
            The realistic alternatives are: (a) store the note here in the portal so staff see
            it against the client/package, or (b) write the note text into a Client Data cell
            value for that client. Tell me which you prefer and I'll build it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}