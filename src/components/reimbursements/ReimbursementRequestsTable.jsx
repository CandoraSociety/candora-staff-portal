import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ExternalLink, Receipt as ReceiptIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';
import { CATEGORY_LABELS } from './ReimbursementRequestForm';

const STATUS_STYLES = {
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', cls: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-800' },
};

export default function ReimbursementRequestsTable() {
  const { user } = useCurrentUser();
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-reimbursements', user?.email],
    queryFn: () => base44.entities.StaffReimbursementRequest.filter({ requester_email: user?.email }),
    enabled: !!user?.email,
  });

  const sorted = [...requests].sort((a, b) =>
    (b.submitted_date || b.created_date || '').localeCompare(a.submitted_date || a.created_date || ''));

  if (isLoading) return <p className="text-sm text-muted-foreground text-center py-6">Loading your requests...</p>;

  if (sorted.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <ReceiptIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No reimbursement requests yet. Submit your first one above.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/60 text-left text-xs text-muted-foreground uppercase tracking-wide">
            <th className="px-3 py-2.5 font-semibold">Date Incurred</th>
            <th className="px-3 py-2.5 font-semibold">Category</th>
            <th className="px-3 py-2.5 font-semibold">Description</th>
            <th className="px-3 py-2.5 font-semibold">Vendor</th>
            <th className="px-3 py-2.5 font-semibold text-right">Amount</th>
            <th className="px-3 py-2.5 font-semibold text-right">Tax</th>
            <th className="px-3 py-2.5 font-semibold">Receipt</th>
            <th className="px-3 py-2.5 font-semibold">Status</th>
            <th className="px-3 py-2.5 font-semibold">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => {
            const status = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
            return (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-3 py-2 whitespace-nowrap">{r.date_incurred ? format(new Date(r.date_incurred), 'MMM d, yyyy') : '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {CATEGORY_LABELS[r.expense_category] || r.expense_category}
                  {r.expense_category === 'other' && r.expense_category_other ? ` (${r.expense_category_other})` : ''}
                </td>
                <td className="px-3 py-2 max-w-[240px]">
                  <p className="truncate" title={r.description}>{r.description}</p>
                  {r.notes && <p className="text-xs text-muted-foreground truncate" title={r.notes}>{r.notes}</p>}
                </td>
                <td className="px-3 py-2">{r.vendor || '—'}</td>
                <td className="px-3 py-2 text-right font-medium whitespace-nowrap">${(r.amount || 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground whitespace-nowrap">{r.tax ? `$${r.tax.toFixed(2)}` : '—'}</td>
                <td className="px-3 py-2">
                  {r.receipt_url ? (
                    <a href={r.receipt_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
                      <ExternalLink className="w-3.5 h-3.5" />View
                    </a>
                  ) : '—'}
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>{status.label}</span>
                  {r.status === 'rejected' && r.rejection_reason && (
                    <p className="text-xs text-red-500 mt-0.5" title={r.rejection_reason}>{r.rejection_reason}</p>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                  {r.submitted_date ? format(new Date(r.submitted_date), 'MMM d, yyyy') : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}