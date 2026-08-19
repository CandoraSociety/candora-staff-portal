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
 * Invoice view for an Invoice Package. For a single-month package this reads the
 * CRT Invoice Tracker row for that month. For a multi-month range package the
 * CRT's cumulative deliverable counts live on the END month's row (each month
 * row carries the running total through that month), so we read the end month
 * and label the document with the full range (e.g. "April – July 2026").
 */
export default function PackageInvoiceTab({ pkg }) {
  const start = pkg.billing_month;
  const end = pkg.billing_month_end && pkg.billing_month_end !== pkg.billing_month
    ? pkg.billing_month_end
    : null;
  // Data month = end month for ranges (cumulative), else the single month.
  const dataMonth = end || start;

  const { data: live, isLoading, error } = useQuery({
    queryKey: ['package-invoice-data', pkg.id, dataMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke('getMonthlyInvoiceData', { billingMonth: dataMonth });
      return res.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  // Adjustment notes logged against this package.
  const adjustmentNotes = pkg.adjustment_notes || [];

  const handlePrint = () => window.print();

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
            ? `The ${format(monthFirst(dataMonth), 'MMMM yyyy')} row isn't in the active CRT workbook yet. Run an Invoice Tracker sync / advance first.`
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