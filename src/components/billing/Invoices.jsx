import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, Loader2, Lock, Unlock, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import InvoiceDocument from './InvoiceDocument';

export default function Invoices() {
  const queryClient = useQueryClient();
  // Current month in Edmonton time (the org's billing timezone), so the
  // default + auto-rollover always land on the correct month regardless of
  // the browser/device timezone.
  const currentMonth = format(new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Edmonton' })), 'yyyy-MM');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const ensuredRef = useRef(new Set());

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

  useEffect(() => {
    if (isLoading) return;
    if (ensuredRef.current.has(currentMonth)) return;
    if (!invoices.some((i) => i.billing_month === currentMonth)) {
      ensuredRef.current.add(currentMonth);
      ensureMutation.mutate(currentMonth);
    }
  }, [isLoading, currentMonth, invoices]);

  // When the billing month rolls over (e.g. July → August), advance the view
  // to the new current month if the user was still on the prior current month.
  // Lets them browse older months without being yanked back.
  const prevCurrentRef = useRef(currentMonth);
  useEffect(() => {
    if (prevCurrentRef.current !== currentMonth) {
      if (selectedMonth === prevCurrentRef.current) setSelectedMonth(currentMonth);
      prevCurrentRef.current = currentMonth;
    }
  }, [currentMonth, selectedMonth]);

  const selected = invoices.find((i) => i.billing_month === selectedMonth) || null;
  const isFinalized = selected?.status === 'finalized';

  // Always show the current (in-progress) month in the list even if its draft
  // record hasn't been created yet, so the user can always see up to the
  // current billing month.
  const displayInvoices = invoices.some((i) => i.billing_month === currentMonth)
    ? invoices
    : [{ id: '__current__', billing_month: currentMonth, status: 'draft' }, ...invoices];

  // Live read from the active CRT workbook for the open (non-finalized) month.
  const { data: live, isLoading: liveLoading, refetch } = useQuery({
    queryKey: ['monthly-invoice-data', selectedMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke('getMonthlyInvoiceData', { billingMonth: selectedMonth });
      return res.data;
    },
    enabled: !!selectedMonth && !isFinalized,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const closeOffMutation = useMutation({
    mutationFn: async () => {
      if (!selected || !live || live.status !== 'success') {
        throw new Error('No live invoice data to snapshot.');
      }
      return base44.entities.Invoice.update(selected.id, {
        status: 'finalized',
        finalized_date: format(new Date(), 'yyyy-MM-dd'),
        invoice_number: live.invoiceNumber != null ? String(live.invoiceNumber) : (selected.invoice_number || ''),
        header_info: live.header,
        line_items: live.lineItems,
        subtotal_deliverables: live.subtotalDeliverables,
        subtotal_direct_costs: live.subtotalDirectCosts,
        total_amount: live.total,
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
      refetch();
    },
    onError: (e) => toast.error('Reopen failed: ' + (e.message || '')),
  });

  // Data to render: finalized → snapshot on the record; open → live read.
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
    : live && live.status === 'success'
      ? live
      : null;

  const monthLabel = selectedMonth ? format(new Date(selectedMonth + '-01'), 'MMMM yyyy') : '';

  return (
    <div className="space-y-4">
      {/* Status + actions */}
      <Card>
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
      </Card>

      {/* Viewer */}
      <Card>
        <CardContent className="pt-6">
          {liveLoading && !renderData ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : renderData ? (
            <InvoiceDocument data={renderData} status={isFinalized ? 'Finalized' : 'Draft'} />
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
      <Card>
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
                const isViewing = inv.billing_month === selectedMonth;
                const fin = inv.status === 'finalized';
                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedMonth(inv.billing_month)}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                      isViewing ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-accent" />
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(inv.billing_month + '-01'), 'MMMM yyyy')}
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