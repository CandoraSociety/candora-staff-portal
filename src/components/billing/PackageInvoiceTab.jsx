import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InvoiceDocument from './InvoiceDocument';
import { format } from 'date-fns';

const monthFirst = (ym) => {
  const [y, m] = String(ym || '').split('-').map(Number);
  return new Date(y, m - 1, 1);
};

/**
 * Invoice view for an Invoice Package. The package is linked to the month's
 * Invoice record (from the Invoices tab) via `invoice_id` at creation. When
 * that Invoice is finalized we render its frozen snapshot — the same doc shown
 * on the Invoices tab — so the package truly "pulls the invoice for that
 * month". While the Invoice is still open (draft) we read live CRT tracker
 * data, matching the Invoices tab's open-month behaviour.
 *
 * For a multi-month range package the CRT end-month row holds the cumulative
 * totals, so we read the end month and label the document with the full range.
 */
export default function PackageInvoiceTab({ pkg }) {
  const start = pkg.billing_month;
  const end = pkg.billing_month_end && pkg.billing_month_end !== pkg.billing_month
    ? pkg.billing_month_end
    : null;
  const dataMonth = end || start;

  // Linked Invoice record from the Invoices tab.
  const { data: linkedInvoice } = useQuery({
    queryKey: ['linked-invoice', pkg.invoice_id],
    queryFn: () => base44.entities.Invoice.get(pkg.invoice_id),
    enabled: !!pkg.invoice_id,
    staleTime: 0,
  });

  const useSnapshot = linkedInvoice && linkedInvoice.status === 'finalized';

  const { data: live, isLoading, error } = useQuery({
    queryKey: ['package-invoice-data', pkg.id, dataMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke('getMonthlyInvoiceData', { billingMonth: dataMonth });
      return res.data;
    },
    enabled: !useSnapshot,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  const adjustmentNotes = pkg.adjustment_notes || [];
  const handlePrint = () => window.print();

  if (useSnapshot) {
    const snap = {
      invoiceNumber: linkedInvoice.invoice_number ? Number(linkedInvoice.invoice_number) : null,
      billingMonth: linkedInvoice.billing_month,
      header: linkedInvoice.header_info || [],
      lineItems: linkedInvoice.line_items || [],
      subtotalDeliverables: linkedInvoice.subtotal_deliverables || 0,
      subtotalDirectCosts: linkedInvoice.subtotal_direct_costs || 0,
      total: linkedInvoice.total_amount || 0,
    };
    return (
      <div className="space-y-3">
        <div className="flex justify-end no-print">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
          </Button>
        </div>
        <div className="invoice-viewer-card rounded-xl border bg-card shadow">
          <div className="invoice-viewer-content pt-6">
            <InvoiceDocument
              data={snap}
              status="Finalized"
              adjustmentNotes={adjustmentNotes}
              billingMonthEnd={end}
            />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || (live && live.status !== 'success')) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-amber-500" />
        <p className="text-sm text-slate-600">
          {live?.status === 'month_not_found'
            ? `The ${format(monthFirst(dataMonth), 'MMMM yyyy')} row isn't in the active CRT workbook yet. Run an Invoice Tracker sync / advance first, or close off the month's invoice on the Invoices tab.`
            : 'No invoice data available for this package yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end no-print">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
        </Button>
      </div>
      <div className="invoice-viewer-card rounded-xl border bg-card shadow">
        <div className="invoice-viewer-content pt-6">
          <InvoiceDocument
            data={live}
            status={pkg.status === 'approved' ? 'Approved' : 'Draft'}
            adjustmentNotes={adjustmentNotes}
            billingMonthEnd={end}
          />
        </div>
      </div>
    </div>
  );
}