import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertCircle, Download, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InvoiceDocument from './InvoiceDocument';
import InvoiceNumberDialog from './InvoiceNumberDialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { displayInvoiceNumber } from './invoiceNumber';
import { buildInvoicePdfFromNode, cleanFileName, downloadBlob } from './packageContentsHelpers';

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
  const [showNumberDialog, setShowNumberDialog] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const invoiceWrapRef = useRef(null);

  // Linked Invoice record from the Invoices tab.
  const { data: linkedInvoice } = useQuery({
    queryKey: ['linked-invoice', pkg.invoice_id],
    queryFn: () => base44.entities.Invoice.get(pkg.invoice_id),
    enabled: !!pkg.invoice_id,
    staleTime: 0,
  });

  const useSnapshot = linkedInvoice && linkedInvoice.status === 'finalized';
  const isManualNumber = !!linkedInvoice?.invoice_number_manual;

  const { data: live, isLoading, error } = useQuery({
    queryKey: ['package-invoice-data', pkg.id, dataMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke('getMonthlyInvoiceData', { billingMonth: dataMonth });
      return res.data;
    },
    enabled: !useSnapshot,
    staleTime: 0,
    gcTime: 0,
    // Reuse an in-flight / freshly fetched read (e.g. the one PackageContents
    // starts in the Finance portal) instead of firing a second slow tracker
    // read on mount. When no cached entry survives (gcTime 0, no observers),
    // the mount still fetches fresh.
    refetchOnMount: false,
  });

  // Notes are saved on the linked Invoice record (Invoices tab) — use those so
  // the package invoice is an exact duplicate of the Invoices-tab invoice.
  const adjustmentNotes = linkedInvoice?.adjustment_notes || [];

  // Render the on-screen invoice document into a real PDF file and download it
  // directly — no pop-up window involved (pop-up blockers were silently
  // killing the old print-window flow).
  const handleDownload = async () => {
    const node = invoiceWrapRef.current?.querySelector('.invoice-document');
    if (!node) {
      toast.error('Invoice is still loading — try again in a moment.');
      return;
    }
    setDownloading(true);
    try {
      const blob = await buildInvoicePdfFromNode(node);
      downloadBlob(blob, cleanFileName(`Invoice ${format(monthFirst(dataMonth), 'MMMM yyyy')}.pdf`));
    } catch {
      toast.error('Could not generate the invoice PDF.');
    } finally {
      setDownloading(false);
    }
  };

  // Number currently shown on the package invoice — prefills the edit dialog.
  const shownNumber = useSnapshot
    ? displayInvoiceNumber(linkedInvoice?.invoice_number, linkedInvoice?.billing_month, isManualNumber)
    : displayInvoiceNumber(live?.invoiceNumber ?? linkedInvoice?.invoice_number, live?.billingMonth ?? linkedInvoice?.billing_month, isManualNumber);

  if (useSnapshot) {
    const snap = {
      invoiceNumber: displayInvoiceNumber(linkedInvoice.invoice_number, linkedInvoice.billing_month, isManualNumber),
      billingMonth: linkedInvoice.billing_month,
      header: linkedInvoice.header_info || [],
      lineItems: linkedInvoice.line_items || [],
      subtotalDeliverables: linkedInvoice.subtotal_deliverables || 0,
      subtotalDirectCosts: linkedInvoice.subtotal_direct_costs || 0,
      total: linkedInvoice.total_amount || 0,
    };
    return (
      <div className="space-y-3">
        <div className="flex justify-end no-print gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNumberDialog(true)} disabled={!dataMonth}>
            <Hash className="h-4 w-4 mr-2" /> Edit Invoice #
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Download PDF
          </Button>
        </div>
        <InvoiceNumberDialog
          open={showNumberDialog}
          onOpenChange={setShowNumberDialog}
          billingMonth={dataMonth}
          monthLabel={format(monthFirst(dataMonth), 'MMMM yyyy')}
          currentNumber={shownNumber}
          invoiceId={pkg.invoice_id}
        />
        <div ref={invoiceWrapRef} className="invoice-viewer-card rounded-xl border bg-card shadow">
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
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <p className="text-sm text-slate-500">Reading this month's invoice from the CRT tracker — this can take a few seconds…</p>
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

  // Populate the invoice number: prefer the live tracker read, fall back to the
  // linked Invoice record's stored number, then apply the 2026 April–July ".1"
  // suffix. Guarantees the package invoice always carries its number.
  let srcNumber = live?.invoiceNumber;
  let srcMonth = live?.billingMonth;
  if ((srcNumber == null || srcNumber === '') && linkedInvoice?.invoice_number) {
    srcNumber = linkedInvoice.invoice_number;
    srcMonth = linkedInvoice.billing_month;
  }
  const liveData = { ...live, invoiceNumber: displayInvoiceNumber(srcNumber, srcMonth, isManualNumber) };

  return (
    <div className="space-y-3">
      <div className="flex justify-end no-print">
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
          {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Download PDF
        </Button>
      </div>
      <div ref={invoiceWrapRef} className="invoice-viewer-card rounded-xl border bg-card shadow">
        <div className="invoice-viewer-content pt-6">
          <InvoiceDocument
            data={liveData}
            status={pkg.status === 'approved' ? 'Approved' : 'Draft'}
            adjustmentNotes={adjustmentNotes}
            billingMonthEnd={end}
          />
        </div>
      </div>
    </div>
  );
}