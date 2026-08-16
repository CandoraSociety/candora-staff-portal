import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, StickyNote, ArrowRight } from 'lucide-react';
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
  const [clients, setClients] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [savedNotes, setSavedNotes] = useState([]);
  const [pendingNotes, setPendingNotes] = useState([]);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [colRes, meRes, clientsRes] = await Promise.all([
          base44.functions.invoke('getInvoiceTrackerColumns', {}),
          base44.auth.me().catch(() => null),
          base44.entities.Client.list('-last_name', 1000).catch(() => []),
        ]);
        const colData = colRes.data || {};
        setColumns(colData.columns || []);
        if (colData.status && colData.status !== 'success') {
          toast.error(colData.status === 'no_workbook' ? 'No active CRT workbook found' : 'Could not read Invoice Tracker');
        }
        if (meRes) setCurrentUser(meRes);
        const cl = (clientsRes || [])
          .map(c => ({ id: c.id, name: `${c.first_name || ''} ${c.last_name || ''}`.trim() }))
          .filter(c => c.name);
        setClients(cl);
        setSavedNotes(Array.isArray(pkg.adjustment_notes) ? pkg.adjustment_notes : []);
        try {
          const rowRes = await base44.functions.invoke('getInvoiceTrackerMonthRow', { billingMonth: pkg.billing_month });
          const rowData = rowRes.data || {};
          if (rowData.status === 'success') {
            setRowValues(rowData.valuesByCol || {});
          }
        } catch { /* row read best-effort */ }
      } catch (e) {
        toast.error('Failed to load Invoice Tracker columns');
      } finally {
        setLoading(false);
      }
    })();
  }, [pkg.billing_month, pkg.id]);

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
      const changes = changed.map(c => ({ colLetter: c.colLetter, value: edits[c.colLetter] }));
      const res = await base44.functions.invoke('applyManualTrackerAdjustment', {
        billingMonth: pkg.billing_month,
        adjustments: changes,
      });
      const data = res.data || {};
      if (data.status === 'success') {
        const prevRow = { ...rowValues };
        const next = { ...rowValues };
        for (const w of (data.written || [])) next[w.colLetter] = w.value;
        setRowValues(next);
        setPendingNotes(changes.map(ch => {
          const col = columns.find(c => c.colLetter === ch.colLetter);
          return {
            cellLetter: ch.colLetter,
            cellLabel: col?.label || ch.colLetter,
            oldValue: prevRow[ch.colLetter] ?? '',
            newValue: ch.value,
            clientId: '',
            comment: '',
          };
        }));
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

  const updatePending = (idx, field, value) => {
    setPendingNotes(prev => prev.map((n, i) => i === idx ? { ...n, [field]: value } : n));
  };

  const saveNote = async (idx) => {
    const note = pendingNotes[idx];
    if (!note.clientId) { toast.error('Select a client for this adjustment note'); return; }
    setSavingNote(true);
    try {
      const client = clients.find(c => c.id === note.clientId);
      const entry = {
        cell_letter: note.cellLetter,
        cell_label: note.cellLabel,
        old_value: String(note.oldValue),
        new_value: String(note.newValue),
        client_id: note.clientId,
        client_name: client?.name || '',
        comment: note.comment || '',
        created_by_name: currentUser?.full_name || currentUser?.email || '',
        created_date: new Date().toISOString().slice(0, 10),
        billing_month: pkg.billing_month,
      };
      const next = [...savedNotes, entry];
      await base44.entities.InvoicePackage.update(pkg.id, { adjustment_notes: next });
      setSavedNotes(next);
      setPendingNotes(prev => prev.filter((_, i) => i !== idx));
      toast.success('Adjustment note saved');
    } catch (e) {
      toast.error('Failed to save adjustment note');
    } finally {
      setSavingNote(false);
    }
  };

  const renderAdjustment = (n, key) => (
    <div key={key} className="text-xs text-slate-600">
      <span className="font-medium text-slate-700">{n.cell_label}</span> ({n.cell_letter}):{' '}
      <span className="line-through text-slate-400">{n.old_value || '—'}</span>{' '}
      <ArrowRight className="inline w-3 h-3" />{' '}
      <span className="font-semibold text-slate-800">{n.new_value || '—'}</span>
      {n.client_name ? ` — ${n.client_name}` : ''}
      {n.comment ? ` — ${n.comment}` : ''}
    </div>
  );

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

              {pendingNotes.length > 0 && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                    <StickyNote className="w-4 h-4" /> Adjustment Notes ({pendingNotes.length} pending)
                  </div>
                  <p className="text-xs text-blue-700">Each adjusted cell needs a client + reason before it's logged.</p>
                  {pendingNotes.map((n, idx) => (
                    <div key={idx} className="rounded-md border border-blue-200 bg-white p-3 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-slate-700">{n.cellLabel}</span>:{' '}
                        <span className="line-through text-slate-400">{n.oldValue || '—'}</span>{' '}
                        <ArrowRight className="inline w-3 h-3" />{' '}
                        <span className="font-semibold text-slate-800">{n.newValue || '—'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-500">Applies to client</label>
                          <select
                            value={n.clientId}
                            onChange={(e) => updatePending(idx, 'clientId', e.target.value)}
                            className="w-full h-9 text-sm rounded-md border border-slate-300 px-2 bg-white"
                          >
                            <option value="">Select client…</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-500">Reason for adjustment</label>
                          <input
                            value={n.comment}
                            onChange={(e) => updatePending(idx, 'comment', e.target.value)}
                            placeholder="Explain the adjustment…"
                            className="w-full h-9 text-sm rounded-md border border-slate-300 px-2 bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" onClick={() => saveNote(idx)} disabled={savingNote}>
                          {savingNote && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Note
                        </Button>
                      </div>
                    </div>
                  ))}
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
                  {savedNotes.length > 0 && (
                    <div className="border-t pt-2 mt-2 space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Adjustment Notes</p>
                      {savedNotes.map((n, i) => renderAdjustment(n, i))}
                    </div>
                  )}
                </div>
              )}

              {savedNotes.length > 0 && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <StickyNote className="w-4 h-4" /> Adjustment Notes
                  </div>
                  {savedNotes.map((n, idx) => (
                    <div key={idx} className="rounded-md border border-slate-200 bg-white p-3 text-sm space-y-1">
                      {renderAdjustment(n, 's' + idx)}
                      <div className="text-slate-600">Client: <span className="font-medium text-slate-800">{n.client_name}</span></div>
                      {n.comment && <div className="text-slate-600">Reason: {n.comment}</div>}
                      <div className="text-xs text-slate-400">By {n.created_by_name || '—'} on {n.created_date}</div>
                      <div className="mt-1 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-xs text-amber-800">
                        <ArrowRight className="inline w-3 h-3" /> Add a field note to {n.client_name} on the Client Data sheet for this adjustment.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}