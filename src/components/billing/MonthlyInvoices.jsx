import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileText, Loader2, Lock, Unlock, Calendar, AlertCircle, Plus, Printer } from 'lucide-react';
import { format } from 'date-fns';
import InvoiceDocument from './InvoiceDocument';
import { currentBillingMonth } from '@/components/billing/billingMonth';
import { monthsInRange, snapshotToData, aggregateMonthData } from './aggregateInvoiceData';

// Parse a "YYYY-MM" billing month into a LOCAL Date on the 1st of that month.
// `new Date('2026-04-01')` is parsed as UTC midnight, which in Edmonton (UTC-6)
// is March 31 — so date-fns renders the PREVIOUS month. Building the date from
// explicit local components keeps the label on the correct month.
const monthFirst = (ym) => {
  const [y, m] = String(ym || '').split('-').map(Number);
  return new Date(y, m - 1, 1);
};

export default function MonthlyInvoices() {
  const queryClient = useQueryClient();
  // Current month in Edmonton time (the org's billing timezone), so the
  // default view always lands on the correct month regardless of the
  // browser/device timezone.
  const currentMonth = currentBillingMonth();
  // The viewed month lives in the URL (?month=YYYY-MM or ?id=…) so a clean
  // visit to the Billing page always lands on the current billing month —
  // there's no component state for the keep-alive portal to preserve and get
  // "stuck" on a prior month across navigations or refreshes.
  const [searchParams, setSearchParams] = useSearchParams();
  const pickedMonth = searchParams.get('month');
  const pickedId = searchParams.get('id');
  const selectedMonth = pickedMonth || currentMonth;
  const ensuredRef = useRef(new Set());
  const [showMultiMonth, setShowMultiMonth] = useState(false);
  const [rangeStart, setRangeStart] = useState(currentMonth);
  const [rangeEnd, setRangeEnd] = useState(currentMonth);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-billing_month', 100),
  });

  // Auto-rollover: ensure a draft Invoice record exists for the current month.
  const ensureMutation = useMutation({
    mutationFn: (bm) => base44.entities.Invoice.create({ billing_month: bm, status: 'draft' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
    onError: (e) => toast.error('Could not start this month invoice: ' + (e.message || '')),
  });

  // Create a multi-month invoice (cumulative range). The CRT end-month row
  // holds the running totals, so the invoice is stamped with both the start
  // and end month and reads the end month's data.
  const createMultiMonthMutation = useMutation({
    mutationFn: async ({ start, end }) =>
      base44.entities.Invoice.create({
        billing_month: start,
        billing_month_end: end,
        status: 'draft',
      }),
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setSearchParams({ id: inv.id });
      setShowMultiMonth(false);
      toast.success('Multi-month invoice created');
    },
    onError: (e) => toast.error('Could not create multi-month invoice: ' + (e.message || '')),
  });

  // Open the invoice alone in a dedicated print window so the browser's
  // print/Save-as-PDF captures only the invoice (no app chrome) on a clean
  // letter page. Copying the app's stylesheets keeps the Tailwind/brand
  // styling intact in the isolated window.
  const printInvoice = () => {
    const node = document.querySelector('.invoice-document');
    if (!node) {
      toast.error('Invoice is still loading — try again in a moment.');
      return;
    }
    const printWin = window.open('', '_blank', 'width=900,height=1100');
    if (!printWin) {
      toast.error('Pop-up blocked — allow pop-ups to download the invoice.');
      return;
    }
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');
    printWin.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice</title>\n${styles}\n` +
      `<style>\n` +
      `@page { size: letter; margin: 0.75in; }\n` +
      `html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }\n` +
      `.invoice-document { width: 100% !important; max-width: 100% !important; margin: 0 !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; }\n` +
      `.invoice-document img { height: 96px !important; margin: 0 !important; max-width: 45% !important; object-fit: contain !important; }\n` +
      `* { box-shadow: none !important; print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }\n` +
      `p, h1, h2, h3, h4, table, tr, img { break-inside: avoid !important; }\n` +
      `</style></head><body>${node.outerHTML}</body></html>`
    );
    printWin.document.close();
    printWin.focus();
    // Give the new window a beat to apply styles + load the logo image.
    printWin.onload = () => setTimeout(() => printWin.print(), 250);
    setTimeout(() => { if (!printWin.closed) printWin.print(); }, 800);
  };

  const handleCreateMultiMonth = () => {
    if (!rangeStart || !rangeEnd) {
      toast.error('Select both a start and end month');
      return;
    }
    if (rangeEnd < rangeStart) {
      toast.error('End month must be the same as or after the start month');
      return;
    }
    createMultiMonthMutation.mutate({ start: rangeStart, end: rangeEnd });
  };

  useEffect(() => {
    if (isLoading) return;
    if (ensuredRef.current.has(currentMonth)) return;
    if (!invoices.some((i) => i.billing_month === currentMonth)) {
      ensuredRef.current.add(currentMonth);
      ensureMutation.mutate(currentMonth);
    }
  }, [isLoading, currentMonth, invoices]);

  // Clear any stale cached monthly reads on mount so the invoice always shows
  // fresh tracker data (prevents a previous session's figures from lingering
  // under the wrong month label).
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['monthly-invoice-data'] });
  }, [queryClient]);

  // Each invoice shows its OWN month's data: the current (open) month reads
  // live from the CRT workbook and keeps adjusting until closed off; a past
  // month shows its own row (or its frozen snapshot once finalized). Default
  // view (no ?month= / ?id= param) always lands on the current billing month.
  // A multi-month invoice (billing_month_end set) reads the END month's
  // cumulative CRT row and is labeled with the full range.
  const selected = pickedId
    ? invoices.find((i) => i.id === pickedId) || null
    : invoices.find((i) => i.billing_month === selectedMonth && (!i.billing_month_end || i.billing_month_end === i.billing_month)) || null;
  const isFinalized = selected?.status === 'finalized';
  const isRange = !!selected?.billing_month_end && selected.billing_month_end !== selected.billing_month;
  const effectiveMonth = selected
    ? (selected.billing_month_end || selected.billing_month)
    : selectedMonth;
  const selStart = selected?.billing_month;
  const selEnd = selected?.billing_month_end;

  // Always show the current (in-progress) month in the list even if its draft
  // record hasn't been created yet, so the user can always see up to the
  // current billing month.
  const displayInvoices = invoices.some((i) => i.billing_month === currentMonth)
    ? invoices
    : [{ id: '__current__', billing_month: currentMonth, status: 'draft' }, ...invoices];

  // Live read from the active CRT workbook for the open (non-finalized) month.
  // Disabled for range invoices — those sum each month separately below.
  const { data: live, isLoading: liveLoading, refetch } = useQuery({
    queryKey: ['monthly-invoice-data', effectiveMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke('getMonthlyInvoiceData', { billingMonth: effectiveMonth });
      return res.data;
    },
    enabled: !!effectiveMonth && !isRange && !isFinalized,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Multi-month (range) invoice: fetch each month in the range — finalized
  // months use their frozen snapshot, open months read live from the tracker —
  // then sum every section so quantities/amounts add across months and the
  // Fixed Monthly Fee carries a quantity equal to the number of months.
  const finalizedKey = (invoices || [])
    .filter((i) => !i.billing_month_end && i.status === 'finalized')
    .map((i) => i.billing_month)
    .sort()
    .join(',');
  const { data: rangeData, isLoading: rangeLoading, refetch: refetchRange } = useQuery({
    queryKey: ['range-invoice-data', selStart, selEnd, finalizedKey],
    queryFn: async () => {
      const months = monthsInRange(selStart, selEnd);
      const perMonth = await Promise.all(
        months.map(async (bm) => {
          const inv = invoices.find((i) => i.billing_month === bm && !i.billing_month_end);
          if (inv && inv.status === 'finalized') return snapshotToData(inv);
          try {
            const res = await base44.functions.invoke('getMonthlyInvoiceData', { billingMonth: bm });
            return res.data;
          } catch {
            return { status: 'error' };
          }
        })
      );
      return aggregateMonthData(perMonth);
    },
    enabled: isRange && !!selStart && !!selEnd && !isFinalized,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // The active data source for the current selection: aggregated range data for
  // a range invoice, the single-month live read otherwise.
  const activeData = isRange ? rangeData : live;
  const activeLoading = isRange ? rangeLoading : liveLoading;

  // Adjustment notes logged against this month's Invoice Package(s) — shown at
  // the bottom of the invoice so manual tracker edits are auditable on the doc.
  const { data: adjustmentNotes = [] } = useQuery({
    queryKey: ['invoice-adjustment-notes', effectiveMonth],
    queryFn: async () => {
      const pkgs = await base44.entities.InvoicePackage.filter({ billing_month: effectiveMonth });
      const notes = [];
      (pkgs || []).forEach((p) => {
        (p.adjustment_notes || []).forEach((n) => notes.push(n));
      });
      return notes;
    },
    enabled: !!effectiveMonth,
  });

  const closeOffMutation = useMutation({
    mutationFn: async () => {
      if (!selected || !activeData || activeData.status !== 'success') {
        throw new Error('No live invoice data to snapshot.');
      }
      return base44.entities.Invoice.update(selected.id, {
        status: 'finalized',
        finalized_date: format(new Date(), 'yyyy-MM-dd'),
        // For a single-month invoice, stamp the record with the ACTUAL month of
        // the row the data came from (column A), not the month the user happened
        // to have selected — so a finalized invoice's label can never drift from
        // its frozen figures. For a multi-month (range) invoice, keep the start
        // month as billing_month and billing_month_end as-is so the range label
        // survives close-off (the snapshot holds the summed-across-months data).
        billing_month: isRange ? selected.billing_month : (activeData.billingMonth || selected.billing_month),
        invoice_number: activeData.invoiceNumber != null ? String(activeData.invoiceNumber) : (selected.invoice_number || ''),
        header_info: activeData.header,
        line_items: activeData.lineItems,
        subtotal_deliverables: activeData.subtotalDeliverables,
        subtotal_direct_costs: activeData.subtotalDirectCosts,
        total_amount: activeData.total,
      });
    },
    onSuccess: () => {
      toast.success('Invoice closed off and frozen.');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (e) => toast.error('Close-off failed: ' + (e.message || '')),
  });

  const reopenMutation = useMutation({
    mutationFn: () => base44.entities.Invoice.update(selected.id, { status: 'draft' }),
    onSuccess: () => {
      toast.info('Invoice reopened — re-reading live data.');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (isRange) refetchRange(); else refetch();
    },
    onError: (e) => toast.error('Reopen failed: ' + (e.message || '')),
  });

  // Data to render: finalized → snapshot on the record; open → active read
  // (aggregated range data for a multi-month invoice, single-month live otherwise).
  const renderData = isFinalized && selected
    ? {
        invoiceNumber: selected.invoice_number ? Number(selected.invoice_number) : null,
        billingMonth: selected.billing_month,
        header: selected.header_info || [],
        lineItems: selected.line_items || [],
        subtotalDeliverables: selected.subtotal_deliverables || 0,
        subtotalDirectCosts: selected.subtotal_direct_costs || 0,
        total: selected.total_amount || 0,
      }
    : activeData && activeData.status === 'success'
      ? activeData
      : null;

  // The heading reflects the month (or range) actually being shown.
  const monthLabel = isRange
    ? (monthFirst(selStart).getFullYear() === monthFirst(selEnd).getFullYear()
        ? `${format(monthFirst(selStart), 'MMMM')} – ${format(monthFirst(selEnd), 'MMMM yyyy')}`
        : `${format(monthFirst(selStart), 'MMMM yyyy')} – ${format(monthFirst(selEnd), 'MMMM yyyy')}`)
    : format(monthFirst(effectiveMonth), 'MMMM yyyy');

  return (
    <div className="space-y-4">
      {/* Status + actions */}
      <Card className="no-print">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                Monthly Invoice — {monthLabel}
              </CardTitle>
              <CardDescription className="mt-1">
                Auto-generated from the CRT Invoice Tracker. A new invoice appears as the month rolls over and keeps updating until closed off.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={() => setShowMultiMonth((v) => !v)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Multi-Month Invoice
              </Button>
              {selectedMonth !== currentMonth && !pickedId && (
                <Button onClick={() => setSearchParams({})} variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Back to {format(monthFirst(currentMonth), 'MMMM yyyy')}
                </Button>
              )}
              {pickedId && (
                <Button onClick={() => setSearchParams({})} variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Back to {format(monthFirst(currentMonth), 'MMMM yyyy')}
                </Button>
              )}
              {renderData && (
                <Button onClick={printInvoice} variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print / Save PDF
                </Button>
              )}
              {selected && (
                <Badge variant={isFinalized ? 'outline' : 'default'} className={isFinalized ? 'border-slate-400 text-slate-600' : ''}>
                  {isFinalized ? 'Closed Off' : 'Open — Live'}
                </Badge>
              )}
              {isFinalized ? (
                <Button onClick={() => reopenMutation.mutate()} disabled={reopenMutation.isPending} variant="outline" size="sm">
                  {reopenMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Unlock className="h-4 w-4 mr-2" />}
                  Reopen
                </Button>
              ) : (
                <Button onClick={() => closeOffMutation.mutate()} disabled={closeOffMutation.isPending || !renderData} size="sm">
                  {closeOffMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                  Close Off Month
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {showMultiMonth && (
          <CardContent className="border-t pt-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="range-start" className="text-xs">Start month</Label>
                <Input
                  id="range-start"
                  type="month"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="w-44"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="range-end" className="text-xs">Through (end month)</Label>
                <Input
                  id="range-end"
                  type="month"
                  min={rangeStart || undefined}
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="w-44"
                />
              </div>
              <Button onClick={handleCreateMultiMonth} disabled={createMultiMonthMutation.isPending} size="sm">
                {createMultiMonthMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create
              </Button>
              <Button onClick={() => setShowMultiMonth(false)} variant="ghost" size="sm">Cancel</Button>
              <p className="text-xs text-slate-500 w-full">
                A multi-month invoice reads the end month&rsquo;s cumulative CRT row (which holds the running totals through that month) and is labeled with the full range.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Viewer */}
      <Card className="invoice-viewer-card">
        <CardContent className="invoice-viewer-content pt-6">
          {activeLoading && !renderData ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : renderData ? (
            <InvoiceDocument
              data={renderData}
              status={isFinalized ? 'Finalized' : 'Draft'}
              adjustmentNotes={adjustmentNotes}
              billingMonthEnd={isRange ? selEnd : null}
            />
          ) : (
            <div className="text-center py-16">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 text-amber-500" />
              <p className="text-sm text-slate-600">
                {live?.status === 'month_not_found'
                  ? "This month's row isn't in the active CRT workbook yet. Run an Invoice Tracker sync / advance, or close off a previous month."
                  : 'No invoice data available for this month yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All monthly invoices — click to view */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            All Monthly Invoices
          </CardTitle>
          <CardDescription className="text-xs">
            Click a month to view it above. Closed-off months show their frozen snapshot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-6">No invoices yet.</p>
          ) : (
            <div className="space-y-1">
              {displayInvoices.map((inv) => {
                const invIsRange = !!inv.billing_month_end && inv.billing_month_end !== inv.billing_month;
                const isViewing = selected?.id === inv.id || (!selected && inv.billing_month === effectiveMonth && !invIsRange);
                const fin = inv.status === 'finalized';
                const invLabel = invIsRange
                  ? (monthFirst(inv.billing_month).getFullYear() === monthFirst(inv.billing_month_end).getFullYear()
                      ? `${format(monthFirst(inv.billing_month), 'MMM')} – ${format(monthFirst(inv.billing_month_end), 'MMM yyyy')}`
                      : `${format(monthFirst(inv.billing_month), 'MMM yyyy')} – ${format(monthFirst(inv.billing_month_end), 'MMM yyyy')}`)
                  : format(monthFirst(inv.billing_month), 'MMMM yyyy');
                return (
                  <div
                    key={inv.id}
                    onClick={() => invIsRange ? setSearchParams({ id: inv.id }) : setSearchParams({ month: inv.billing_month })}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                      isViewing ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-accent" />
                      <div>
                        <p className="text-sm font-medium">
                          {invLabel}
                          {invIsRange && <span className="ml-2 text-[10px] uppercase tracking-wide text-accent">Range</span>}
                          {inv.invoice_number ? ` · #${inv.invoice_number}` : ''}
                        </p>
                        <p className="text-xs text-slate-500">
                          {fin ? `Closed off ${inv.finalized_date ? format(new Date(inv.finalized_date), 'MMM d, yyyy') : ''}` : 'Open — live'}
                          {inv.total_amount != null ? ` · $${Number(inv.total_amount).toFixed(2)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isViewing && <Badge className="text-xs bg-amber-500 hover:bg-amber-500 text-white">Viewing</Badge>}
                      {fin && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                      {!fin && <Unlock className="h-3.5 w-3.5 text-emerald-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}