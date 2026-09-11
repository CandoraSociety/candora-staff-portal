import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Receipt as ReceiptIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';

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
    (b.date_requested || b.submitted_date || b.created_date || '').localeCompare(a.date_requested || a.submitted_date || a.created_date || ''));

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
            <th className="px-3 py-2.5 font-semibold">Date Requested</th>
            <th className="px-3 py-2.5 font-semibold">Cheque Payable To</th>
            <th className="px-3 py-2.5 font-semibold">Lines</th>
            <th className="px-3 py-2.5 font-semibold text-right">Total Requested</th>
            <th className="px-3 py-2.5 font-semibold">Status</th>
            <th className="px-3 py-2.5 font-semibold">Verified By</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => {
            const status = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
            return (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30 align-top">
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {r.date_requested ? format(new Date(r.date_requested), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-3 py-2.5">
                  <p className="font-medium">{r.payable_to || r.requester_name}</p>
                  {r.etransfer_email && <p className="text-xs text-muted-foreground">e-transfer: {r.etransfer_email}</p>}
                </td>
                <td className="px-3 py-2.5">
                  {(r.line_items || []).length > 0 ? (
                    <div className="space-y-1">
                      {(r.line_items || []).map((li, i) => (
                        <p key={i} className="text-xs text-muted-foreground truncate max-w-[280px]" title={`${li.description || ''} — ${li.supplier || ''}`}>
                          {li.description || 'Expense'}{li.supplier ? ` — ${li.supplier}` : ''}
                        </p>
                      ))}
                    </div>
                  ) : (r.description ? <p className="text-xs text-muted-foreground truncate max-w-[280px]">{r.description}</p> : '—')}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">${(r.amount || 0).toFixed(2)}</td>
                <td className="px-3 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>{status.label}</span>
                  {r.status === 'rejected' && r.rejection_reason && (
                    <p className="text-xs text-red-500 mt-0.5" title={r.rejection_reason}>{r.rejection_reason}</p>
                  )}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">{r.verified_by || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}