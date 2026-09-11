import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Search, Check, X, Banknote, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import { programLabel } from '@/lib/reimbursementConstants';
import FinanceEntryFundingCells from '@/components/reimbursements/FinanceEntryFundingCells';

const STATUS_STYLES = {
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', cls: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-800' },
};

const fmt = n => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = d => d ? format(new Date(d + 'T00:00:00'), 'MMM d, yy') : '—';

export default function FinanceReimbursements() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['staff-reimbursements'],
    queryFn: () => base44.entities.StaffReimbursementRequest.list('-submitted_date', 200),
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['staff-reimbursement-entries'],
    queryFn: () => base44.entities.ReimbursementEntry.list('-created_date', 500),
  });

  const entriesByForm = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!e.form_id || e.status === 'unsubmitted') continue;
      (map[e.form_id] = map[e.form_id] || []).push(e);
    }
    return map;
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests
      .filter(r => filterStatus === 'all' || r.status === filterStatus)
      .filter(r => {
        if (!q) return true;
        return [r.requester_name, r.requester_email, r.payable_to, r.etransfer_email, r.notes]
          .some(v => String(v || '').toLowerCase().includes(q));
      });
  }, [requests, filterStatus, search]);

  const totalPending = requests.filter(r => r.status === 'pending').reduce((s, r) => s + (r.amount || 0), 0);
  const totalApproved = requests.filter(r => r.status === 'approved').reduce((s, r) => s + (r.amount || 0), 0);
  const totalPaid = requests.filter(r => r.status === 'paid').reduce((s, r) => s + (r.amount || 0), 0);

  const setStatus = useMutation({
    mutationFn: async ({ form, status, patch }) => {
      const extra = patch || {};
      if (status === 'approved' || status === 'rejected') {
        extra.reviewed_date = format(new Date(), 'yyyy-MM-dd');
        extra.reviewed_by = user?.email || '';
        extra.reviewed_by_name = displayName(user);
      }
      if (status === 'paid') extra.payment_date = format(new Date(), 'yyyy-MM-dd');
      await base44.entities.StaffReimbursementRequest.update(form.id, { status, ...extra });
      // When marked paid, the staff member's individual entries move to their Paid section.
      if (status === 'paid') {
        await base44.entities.ReimbursementEntry.updateMany({ form_id: form.id }, { $set: { status: 'paid' } });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-reimbursements'] });
      qc.invalidateQueries({ queryKey: ['staff-reimbursement-entries'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Receipt className="h-6 w-6 text-primary" /> Staff Reimbursement Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reimbursement forms submitted by staff. Each form compiles that staff member's individual receipt entries — verify, then mark paid to reimburse.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Pending review</div>
            <div className="text-lg font-bold text-amber-700">{fmt(totalPending)}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Approved (awaiting payment)</div>
            <div className="text-lg font-bold text-blue-700">{fmt(totalApproved)}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Paid Out</div>
            <div className="text-lg font-bold text-green-700">{fmt(totalPaid)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff, payable to…" className="pl-8 h-9 w-[260px]" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          No reimbursement forms yet. Forms appear here when staff click “Submit for Reimbursement”.
        </CardContent></Card>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Staff Member</th>
                  <th className="text-left px-3 py-2 font-semibold">Payable To</th>
                  <th className="text-left px-3 py-2 font-semibold">Date Requested</th>
                  <th className="text-center px-3 py-2 font-semibold">Entries</th>
                  <th className="text-right px-3 py-2 font-semibold">Total Requested</th>
                  <th className="text-center px-3 py-2 font-semibold">Status</th>
                  <th className="text-center px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(r => {
                  const st = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
                  const items = entriesByForm[r.id] || [];
                  const count = r.entry_count || items.length;
                  const expanded = expandedId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <tr className="hover:bg-muted/30">
                        <td className="px-3 py-2">
                          <div className="font-medium">{r.requester_name || '—'}</div>
                          <div className="text-xs text-muted-foreground">{r.requester_email || ''}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{r.payable_to || '—'}</div>
                          {r.etransfer_email && <div className="text-xs text-muted-foreground">e-transfer: {r.etransfer_email}</div>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.date_requested || r.submitted_date)}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            onClick={() => setExpandedId(expanded ? null : r.id)}
                          >
                            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {count} entr{count === 1 ? 'y' : 'ies'}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{fmt(r.amount)}</td>
                        <td className="px-3 py-2 text-center"><Badge className={st.cls}>{st.label}</Badge></td>
                        <td className="px-3 py-2 text-center">
                          {r.status === 'pending' && (
                            <div className="flex items-center justify-center gap-1">
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-green-700 hover:bg-green-50" onClick={() => setStatus.mutate({ form: r, status: 'approved' })} title="Approve">
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-red-700 hover:bg-red-50" onClick={() => setStatus.mutate({ form: r, status: 'rejected', patch: { rejection_reason: 'Rejected by finance' } })} title="Reject">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          {(r.status === 'approved' || r.status === 'pending') && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-green-700 hover:bg-green-50" onClick={() => setStatus.mutate({ form: r, status: 'paid' })} title="Mark paid">
                              <Banknote className="w-4 h-4" /> Pay
                            </Button>
                          )}
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-muted/20">
                          <td colSpan={7} className="px-3 py-2">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-muted-foreground uppercase">
                                  <th className="px-2 py-1.5 font-semibold">Date</th>
                                  <th className="px-2 py-1.5 font-semibold">Description</th>
                                  <th className="px-2 py-1.5 font-semibold">Supplier</th>
                                  <th className="px-2 py-1.5 font-semibold">Program</th>
                                  <th className="px-2 py-1.5 font-semibold text-right">GST</th>
                                  <th className="px-2 py-1.5 font-semibold text-right">Total</th>
                                  <th className="px-2 py-1.5 font-semibold text-right">1/2 GST</th>
                                  <th className="px-2 py-1.5 font-semibold text-right">Funder Cost</th>
                                  <th className="px-2 py-1.5 font-semibold">Account #</th>
                                  <th className="px-2 py-1.5 font-semibold">Funder #</th>
                                  <th className="px-2 py-1.5 font-semibold text-center">Save</th>
                                  <th className="px-2 py-1.5 font-semibold text-center">Receipt</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map(e => (
                                  <tr key={e.id} className="border-t border-border">
                                    <td className="px-2 py-1.5 whitespace-nowrap">{fmtDate(e.date_incurred)}</td>
                                    <td className="px-2 py-1.5">{e.description}</td>
                                    <td className="px-2 py-1.5">{e.supplier || '—'}</td>
                                    <td className="px-2 py-1.5">{programLabel(e)}</td>
                                    <td className="px-2 py-1.5 text-right">{e.gst ? fmt(e.gst) : '—'}</td>
                                    <td className="px-2 py-1.5 text-right font-medium">{fmt(e.total_cost)}</td>
                                    <FinanceEntryFundingCells entry={e} />
                                    <td className="px-2 py-1.5 text-center">
                                      {e.receipt_url ? (
                                        <a href={e.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                                          <ExternalLink className="w-3 h-3" />View
                                        </a>
                                      ) : <span className="text-muted-foreground">—</span>}
                                    </td>
                                  </tr>
                                ))}
                                {items.length === 0 && (
                                  <tr><td colSpan={12} className="px-2 py-2 text-center text-muted-foreground">No entry details available for this form.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}