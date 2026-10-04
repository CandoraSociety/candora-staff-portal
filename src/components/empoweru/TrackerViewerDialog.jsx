import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EyeOff, Loader2 } from 'lucide-react';

// Read-only viewer for the cohort's official funder-reporting Excel workbook.
// This is a viewer, not a data-entry screen — participant changes continue
// through the portal's existing participant-progress functionality.

const cell = (v) => (v === null || v === undefined ? '' : String(v));

function SheetTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="min-w-full text-xs">
        {headers && headers.length > 0 && (
          <thead>
            <tr className="bg-muted">
              <th className="border-b border-border px-2 py-1.5 text-left font-semibold text-muted-foreground">Row</th>
              {headers.map((h, i) => (
                <th key={i} className="whitespace-nowrap border-b border-border px-2 py-1.5 text-left font-semibold text-muted-foreground">
                  {cell(h).trim() || String.fromCharCode(65 + i - 1)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r) => (
            <tr key={r.row_number} className="odd:bg-muted/30">
              <td className="px-2 py-1 text-muted-foreground">{r.row_number}</td>
              {r.values.map((v, i) => (
                <td key={i} className="whitespace-nowrap px-2 py-1">{cell(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TrackerViewerDialog({ open, onOpenChange, cohortId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !cohortId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setData(null);
    base44.functions
      .invoke('getEmpowerUTrackerPreview', { cohort_id: cohortId })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Could not load the workbook'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, cohortId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-muted-foreground" />
            {data?.tracker_sheet?.title || 'Official Tracker'} — Read-only
          </DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground">
          This is the live official funder workbook. Participant changes are made through participant progress in the portal — never edited here.
        </div>
        {loading && (
          <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the official workbook…
          </div>
        )}
        {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        {data && !data.exists && (
          <div className="rounded-md border border-border bg-muted px-3 py-6 text-center text-sm text-muted-foreground">
            No official workbook exists for this cohort yet.
          </div>
        )}
        {data && data.exists && (
          <Tabs defaultValue="tracker" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="self-start">
              <TabsTrigger value="tracker">Participant Tracker</TabsTrigger>
              {(data.other_sheets || []).map((s, i) => (
                <TabsTrigger key={s.name} value={`sheet-${i}`}>{s.name}</TabsTrigger>
              ))}
            </TabsList>
            <div className="flex-1 overflow-y-auto mt-3 pr-1">
              <TabsContent value="tracker">
                <div className="mb-2 text-sm font-medium">{data.tracker_sheet?.date_range}</div>
                <SheetTable headers={data.tracker_sheet?.headers} rows={data.tracker_sheet?.rows || []} />
              </TabsContent>
              {(data.other_sheets || []).map((s, i) => (
                <TabsContent key={s.name} value={`sheet-${i}`}>
                  <SheetTable headers={null} rows={s.rows || []} />
                </TabsContent>
              ))}
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}