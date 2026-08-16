import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { parseBillingMonth } from './billingMonth';

export default function ManualAdjustmentsTab({ pkg }) {
  const [columns, setColumns] = useState([]);
  const [rowValues, setRowValues] = useState({});
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const colRes = await base44.functions.invoke('getInvoiceTrackerColumns', {});
        const colData = colRes.data || {};
        setColumns(colData.columns || []);
        if (colData.status && colData.status !== 'success') {
          toast.error(colData.status === 'no_workbook' ? 'No active CRT workbook found' : 'Could not read Invoice Tracker');
        }
        // Pre-fill current values for this package's month row.
        try {
          const rowRes = await base44.functions.invoke('getInvoiceTrackerMonthRow', { billingMonth: pkg.billing_month });
          const rowData = rowRes.data || {};
          if (rowData.status === 'success') {
            setRowValues(rowData.valuesByCol || {});
          } else if (rowData.status === 'month_not_found') {
            // no row yet — leave blank, show the warning below
          }
        } catch { /* row read best-effort */ }
      } catch (e) {
        toast.error('Failed to load Invoice Tracker columns');
      } finally {
        setLoading(false);
      }
    })();
  }, [pkg.billing_month]);

  const hasRow = Object.keys(rowValues).length > 0;

  const cellValue = (c) => {
    if (Object.prototype.hasOwnProperty.call(edits, c)) return edits[c];
    const v = rowValues[c];
    return v == null ? '' : String(v);
  };

  const displayValue = (c) => {
    if (c.colLetter === 'A') return format(parseBillingMonth(pkg.billing_month), 'MMM yy');
    const v = rowValues[c.colLetter];
    return v == null ? '' : String(v);
  };

  const changed = columns.filter(c =>
    !c.readOnly &&
    Object.prototype.hasOwnProperty.call(edits, c.colLetter) &&
    String(edits[c.colLetter]).trim() !== String(rowValues[c.colLetter] ?? '').trim()
  );

  const apply = async () => {
    if (!hasRow) { toast.error(`No Invoice Tracker row found for ${pkg.billing_month}`); return; }
    if (!changed.length) { toast.message('No changes to apply'); return; }
    setApplying(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('applyManualTrackerAdjustment', {
        billingMonth: pkg.billing_month,
        adjustments: changed.map(c => ({ colLetter: c.colLetter, value: edits[c.colLetter] })),
      });
      const data = res.data || {};
      if (data.status === 'success') {
        const next = { ...rowValues };
        for (const w of (data.written || [])) next[w.colLetter] = w.value;
        setRowValues(next);
        setEdits({});
        setResult({ ok: true, row: data.row, written: data.written || [] });
        toast.success(`Applied ${data.written.length} change(s) to row ${data.row}`);
        try {
          const inv = await base44.functions.invoke('getMonthlyInvoiceData', { billingMonth: pkg.billing_month });
          setInvoice(inv.data || null);
        } catch { /* invoice refresh best-effort */ }
      } else {
        setResult({ ok: false, message: data.status || 'failed' });
        toast.error(data.status === 'month_not_found' ? 'No row for this month in the active CRT' : 'Adjustment failed');
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
            Edit any cell below for{' '}
            <span className="font-medium">{format(parseBillingMonth(pkg.billing_month), 'MMMM yyyy')}</span>{' '}
            — the row mirrors the Invoice Tracker sheet. After applying, the invoice refreshes
            straight from the tracker (the same calculation the existing automations use), so the
            change flows through immediately.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading Invoice Tracker row…
            </div>
          ) : !hasRow ? (
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4" /> No Invoice Tracker row exists for {pkg.billing_month} in the active CRT workbook.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto pb-2">
                <table className="border-collapse" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    {columns.map(c => <col key={c.colLetter} style={{ width: 112 }} />)}
                  </colgroup>
                  <tbody>
                    <tr>
                      {columns.map(c => (
                        <th key={c.colLetter} className="h-6 text-xs font-semibold text-white text-center border border-slate-300" style={{ background: 'hsl(231,64%,20%)' }}>{c.colLetter}</th>
                      ))}
                    </tr>
                    <tr>
                      {columns.map((c) => {
                        if (!c.groupLabel) return null;
                        return (
                          <th key={c.colLetter} colSpan={c.span || 1} className="px-2 py-1 text-[11px] font-semibold text-white text-center border border-slate-300" style={{ background: 'hsl(231,64%,20%)' }} title={c.label}>
                            {c.groupLabel}
                          </th>
                        );
                      })}
                    </tr>
                    <tr>
                      {columns.map(c => (
                        <th key={c.colLetter} className="px-2 py-1 text-[10px] text-slate-500 text-center border border-slate-300 bg-slate-100" title={c.label}>{c.short}</th>
                      ))}
                    </tr>
                    <tr>
                      {columns.map(c => {
                        if (c.readOnly) {
                          return (
                            <td key={c.colLetter} className="px-2 py-1.5 text-sm text-slate-400 text-center border border-slate-300 bg-slate-50 italic" title={c.label}>
                              {displayValue(c)}
                            </td>
                          );
                        }
                        return (
                          <td key={c.colLetter} className="p-0 border border-slate-300 bg-white">
                            <input
                              value={cellValue(c.colLetter)}
                              onChange={(e) => setEdits(prev => ({ ...prev, [c.colLetter]: e.target.value }))}
                              disabled={applying}
                              placeholder="—"
                              className="w-full px-2 py-1.5 text-sm text-center bg-transparent focus:outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-400"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={apply} disabled={applying || !changed.length}>
                  {applying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Apply Changes
                </Button>
                {changed.length > 0 && (
                  <span className="text-xs text-slate-500">{changed.length} cell(s) changed</span>
                )}
                {changed.length === 0 && (
                  <span className="text-xs text-slate-400">No changes yet</span>
                )}
              </div>

              {result && (
                <div className={`rounded-md border p-3 text-sm ${result.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {result.ok ? (
                    <div className="space-y-1">
                      <div>Wrote {result.written.length} cell(s) to row {result.row}. Formula columns were recalculated.</div>
                      <div className="font-mono text-xs">{result.written.map(w => `${w.colLetter}=${String(w.value)}`).join('  ·  ')}</div>
                    </div>
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