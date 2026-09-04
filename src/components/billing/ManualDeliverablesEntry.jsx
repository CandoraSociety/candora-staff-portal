import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Manual entry for the Deliverables sheet region rows 12-20 (deliverable
// metrics) × columns Q-AB (months Apr 2026 → Mar 2027). Values are written to
// the active CRT workbook AND every other monthly CRT so the grid stays
// consistent across all workbooks. As with the Invoice Tracker manual entry, a
// portal re-sync can overwrite these — re-apply if a sync runs.

const MONTH_LABEL_FMT = (m) => {
  if (!m) return '';
  const [y, mo] = m.split('-').map(Number);
  return format(new Date(y, mo - 1, 1), 'MMM yy');
};

export default function ManualDeliverablesEntry() {
  const [grid, setGrid] = useState(null);   // { rowLabels, columns, cells }
  const [edits, setEdits] = useState({});    // "row:col" -> value
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setEdits({});
    try {
      const res = await base44.functions.invoke('getDeliverablesManualCells', {});
      const data = res.data || {};
      if (data.status === 'success') {
        setGrid(data);
      } else {
        toast.error('Could not read Deliverables sheet');
        setGrid(null);
      }
    } catch {
      toast.error('Failed to load Deliverables sheet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cellKey = (row, col) => `${row}:${col}`;
  const cellValue = (row, col) => {
    const k = cellKey(row, col);
    if (Object.prototype.hasOwnProperty.call(edits, k)) return edits[k];
    const v = grid?.cells?.[String(row)]?.[col];
    if (v == null || v === '') return '';
    const n = Number(v);
    return isNaN(n) ? String(v) : String(n);
  };

  const changed = grid ? grid.columns.flatMap(c =>
    grid.rowLabels.map(r => {
      const k = cellKey(r.row, c.colLetter);
      if (!Object.prototype.hasOwnProperty.call(edits, k)) return null;
      const orig = grid.cells?.[String(r.row)]?.[c.colLetter];
      const origStr = orig == null || orig === '' ? '' : String(orig);
      if (String(edits[k]).trim() !== origStr.trim()) {
        return { row: r.row, colLetter: c.colLetter, value: edits[k] };
      }
      return null;
    })
  ).filter(Boolean) : [];

  const apply = async () => {
    if (!changed.length) { toast.message('No changes to apply'); return; }
    setApplying(true);
    try {
      const res = await base44.functions.invoke('applyManualDeliverablesEntry', { entries: changed });
      const data = res.data || {};
      if (data.status === 'success') {
        const failed = (data.workbooks || []).filter(w => w.status !== 'success');
        toast.success(
          `Wrote ${changed.length} cell(s) to ${data.workbooks.length} workbook(s)` +
          (failed.length ? ` (${failed.length} failed)` : '')
        );
        setEdits({});
        await load();
      } else {
        toast.error('Deliverables write failed');
      }
    } catch {
      toast.error('Deliverables write failed');
    } finally {
      setApplying(false);
    }
  };

  const reset = () => setEdits({});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Manual Deliverables Entry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Manually enter Deliverables sheet values (rows 12–20, columns P–AB). Columns are months
          (Mar 2026 → Mar 2027); rows are deliverable metrics. Entries are written to every monthly CRT
          workbook so they stay consistent. A portal re-sync can overwrite these, so re-apply afterward if needed.
        </p>

        {loading && !grid ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading Deliverables…
          </div>
        ) : grid ? (
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left font-semibold text-slate-600 px-2 py-1.5 min-w-[180px] max-w-[220px]">
                    Deliverable
                  </th>
                  {grid.columns.map(c => (
                    <th key={c.colLetter} className="px-1 py-1.5 text-center font-semibold text-slate-600 min-w-[72px]">
                      <div className="font-mono text-slate-400">{c.colLetter}</div>
                      <div>{MONTH_LABEL_FMT(c.month)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rowLabels.map(r => (
                  <tr key={r.row} className="border-t border-slate-100">
                    <td className="px-2 py-1 text-slate-700 align-middle">
                      <span className="font-mono text-slate-400 mr-1">{r.row}</span>{r.label}
                    </td>
                    {grid.columns.map(c => (
                      <td key={c.colLetter} className="px-0.5 py-0.5">
                        <Input
                          type="number"
                          step="0.01"
                          value={cellValue(r.row, c.colLetter)}
                          onChange={(e) => setEdits(prev => ({ ...prev, [cellKey(r.row, c.colLetter)]: e.target.value }))}
                          disabled={applying}
                          placeholder="—"
                          className="h-8 text-xs text-center px-1"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No data.</p>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={apply} disabled={applying || loading || !changed.length}>
            {applying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Apply to Deliverables
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
      </CardContent>
    </Card>
  );
}