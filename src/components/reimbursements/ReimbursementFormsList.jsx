import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Banknote, ChevronDown, ChevronUp, ExternalLink, Receipt as ReceiptIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';

const STATUS_STYLES = {
  pending: { label: 'Submitted', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', cls: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-800' },
};

const fmt = n => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = d => d ? format(new Date(d + 'T00:00:00'), 'MMM d, yyyy') : '—';

export default function ReimbursementFormsList({ statuses, emptyText }) {
  const { user } = useCurrentUser();
  const [expandedId, setExpandedId] = useState(null);

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['my-reimbursement-forms', user?.email],
    queryFn: () => base44.entities.StaffReimbursementRequest.filter({ requester_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['my-reimbursement-entries', user?.email],
    queryFn: () => base44.entities.ReimbursementEntry.filter({ requester_email: user?.email }),
    enabled: !!user?.email,
  });

  const entriesByForm = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!e.form_id || e.status === 'unsubmitted') continue;
      (map[e.form_id] = map[e.form_id] || []).push(e);
    }
    return map;
  }, [entries]);

  const filtered = forms
    .filter(f => statuses.includes(f.status))
    .sort((a, b) => (b.submitted_date || b.created_date || '').localeCompare(a.submitted_date || a.created_date || ''));

  if (isLoading) return <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>;

  if (filtered.length === 0) {
    return (
      <Card className="p-0">
        <div className="py-8 text-center text-sm text-muted-foreground">
          <ReceiptIcon className="w-7 h-7 mx-auto mb-2 opacity-30" />
          {emptyText}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map(f => {
        const items = entriesByForm[f.id] || [];
        const st = STATUS_STYLES[f.status] || STATUS_STYLES.pending;
        const expanded = expandedId === f.id;
        return (
          <Card key={f.id} className="p-0 overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <p className="font-medium">Reimbursement Form — {fmtDate(f.submitted_date || f.date_requested)}</p>
                  <Badge className={st.cls}>{st.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {f.entry_count || items.length || 0} receipt entr{(f.entry_count || items.length) === 1 ? 'y' : 'ies'}
                  {' · '}Cheque payable to {f.payable_to}
                  {f.etransfer_email ? ` · e-transfer: ${f.etransfer_email}` : ''}
                  {f.status === 'paid' && f.payment_date ? ` · paid ${fmtDate(f.payment_date)}` : ''}
                </p>
                {f.status === 'rejected' && f.rejection_reason && (
                  <p className="text-xs text-red-600 mt-0.5">{f.rejection_reason}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{fmt(f.amount)}</p>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  onClick={() => setExpandedId(expanded ? null : f.id)}
                >
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expanded ? 'Hide items' : 'View items'}
                </button>
              </div>
            </div>
            {expanded && (
              <div className="border-t border-border bg-muted/20">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground uppercase tracking-wide">
                      <th className="px-4 py-2 font-semibold">Date</th>
                      <th className="px-4 py-2 font-semibold">Description</th>
                      <th className="px-4 py-2 font-semibold">Supplier</th>
                      <th className="px-4 py-2 font-semibold text-right">Total</th>
                      <th className="px-4 py-2 font-semibold text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(e => (
                      <tr key={e.id} className="border-t border-border">
                        <td className="px-4 py-2 whitespace-nowrap">{fmtDate(e.date_incurred)}</td>
                        <td className="px-4 py-2">{e.description}</td>
                        <td className="px-4 py-2">{e.supplier || '—'}</td>
                        <td className="px-4 py-2 text-right font-medium">{fmt(e.total_cost)}</td>
                        <td className="px-4 py-2 text-center">
                          {e.receipt_url ? (
                            <a href={e.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                              <ExternalLink className="w-3.5 h-3.5" />View
                            </a>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-3 text-center text-xs text-muted-foreground">No item details available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}