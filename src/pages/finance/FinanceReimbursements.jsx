import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Receipt, Search, Check, X, Banknote, ChevronDown, ChevronUp, ExternalLink, PenLine, CircleDollarSign, RotateCcw, Hourglass } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import { programLabel } from '@/lib/reimbursementConstants';
import FinanceEntryFundingCells from '@/components/reimbursements/FinanceEntryFundingCells';
import OpenReimbursementButton from '@/components/reimbursements/OpenReimbursementButton';
import ReceiptsBundleButton from '@/components/reimbursements/ReceiptsBundleButton';
import ESignatureCaptureDialog from '@/components/esignature/ESignatureCaptureDialog';
import { uploadSignatureImage } from '@/lib/esignatureCapture';
import { REIMBURSEMENT_MODES } from '@/lib/reimbursementMode';

const STATUS_STYLES = {
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-800' },
  processing: { label: 'Processing', cls: 'bg-purple-100 text-purple-800' },
  approved: { label: 'Approved', cls: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-800' },
};

const fmt = n => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = d => d ? format(new Date(d + 'T00:00:00'), 'MMM d, yy') : '—';

// Scotiabank online banking — opened (small window) when Finance presses Pay
const SCOTIA_PAY_URL = 'https://www.scotiabank.com/ca/en/personal/bank-your-way/app-and-online/online-banking.html';

export default function FinanceReimbursements({ mode = 'reimbursement' }) {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null); // form pending finance e-signature approval
  const [payTarget, setPayTarget] = useState(null); // submission awaiting payment confirmation
  const [payApprover, setPayApprover] = useState(''); // approver recorded on the form when paid
  const [paySignOpen, setPaySignOpen] = useState(false); // financial-officer e-sign dialog inside the pay flow
  const [paySigUrl, setPaySigUrl] = useState(''); // uploaded finance officer signature image
  const [paySigName, setPaySigName] = useState(''); // officer name captured with the signature
  const [payError, setPayError] = useState('');
  const [reverseTarget, setReverseTarget] = useState(null); // paid submission to reverse
  const cfg = REIMBURSEMENT_MODES[mode];
  const entryEntity = base44.entities[cfg.entryEntity];
  const formEntity = base44.entities[cfg.formEntity];

  const { data: requests = [], isLoading } = useQuery({
    queryKey: [cfg.financeFormsKey],
    queryFn: () => formEntity.list('-submitted_date', 200),
  });

  const { data: entries = [] } = useQuery({
    queryKey: [cfg.financeEntriesKey],
    queryFn: () => entryEntity.list('-created_date', 500),
  });

  const entriesByForm = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!e.form_id || e.status === 'unsubmitted') continue;
      (map[e.form_id] = map[e.form_id] || []).push(e);
    }
    return map;
  }, [entries]);

  // Submissions awaiting the direct supervisor's approval — held in a separate
  // read-only section; Finance cannot process them until the supervisor approves.
  const pendingSupervisor = useMemo(() => {
    return requests.filter(r => r.supervisor_status === 'pending' && r.status !== 'rejected');
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests
      .filter(r => r.supervisor_status !== 'pending')
      .filter(r => filterStatus === 'all' || r.status === filterStatus)
      .filter(r => {
        if (!q) return true;
        return [r.requester_name, r.requester_email, r.reference_code, r.payable_to, r.etransfer_email, r.notes]
          .some(v => String(v || '').toLowerCase().includes(q));
      });
  }, [requests, filterStatus, search]);

  const totalPending = requests.filter(r => r.status === 'pending' && r.supervisor_status !== 'pending').reduce((s, r) => s + (r.amount || 0), 0);
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
      await formEntity.update(form.id, { status, ...extra });
      // When marked paid, the staff member's individual entries move to their Paid section
      // and a payment notification lands on their main Dashboard.
      if (status === 'paid') {
        await entryEntity.updateMany({ form_id: form.id }, { $set: { status: 'paid' } });
        if (form.requester_email) {
          const isCC = mode === 'cc';
          await base44.entities.DashboardNotification.create({
            recipient_email: form.requester_email,
            recipient_name: form.requester_name,
            kind: isCC ? 'cc_receipts_paid' : 'reimbursement_paid',
            related_form_id: form.id,
            title: isCC ? 'MasterCard receipts paid out' : 'Reimbursement paid out',
            message: `Finance has marked your ${isCC ? 'Candora MasterCard receipt submission' : 'reimbursement request'} of ${fmt(form.amount)} as paid (${extra.payment_date}).`,
            link: isCC ? '/candora-cc-receipts' : '/reimbursement-requests',
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [cfg.financeFormsKey] });
      qc.invalidateQueries({ queryKey: [cfg.financeEntriesKey] });
    },
  });

  // Reverse a paid submission — returns it to Processing, puts its entries back to
  // submitted, and dismisses any unread "paid" notification on the staff dashboard.
  const reversePayment = useMutation({
    mutationFn: async ({ form }) => {
      await formEntity.update(form.id, { status: 'processing', payment_date: null });
      await entryEntity.updateMany({ form_id: form.id }, { $set: { status: 'submitted' } });
      await base44.entities.DashboardNotification.updateMany(
        { related_form_id: form.id, is_read: false },
        { $set: { is_read: true } }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [cfg.financeFormsKey] });
      qc.invalidateQueries({ queryKey: [cfg.financeEntriesKey] });
    },
  });

  // Pay flow — 1) lock the submission as Processing if it isn't already,
  // 2) open Scotiabank in a small window, 3) confirm paid once the transaction completes
  const startPayment = (r) => {
    if (r.status !== 'processing') {
      setStatus.mutate({ form: r, status: 'processing' });
    }
    window.open(SCOTIA_PAY_URL, 'scotiabank-payment', 'width=900,height=700');
    // Prefill from the form when it was already paid once (e.g. reversed and re-paid)
    setPayApprover(r.approved_by || '');
    setPayError('');
    setPaySigUrl('');
    setPaySigName('');
    setPayTarget(r);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Receipt className="h-6 w-6 text-primary" /> {cfg.financeTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cfg.financeSubtitle}
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

      {pendingSupervisor.length > 0 && (
        <Card className="p-0 border-amber-300 bg-amber-50/30">
          <div className="px-4 py-3 border-b border-amber-200 bg-amber-100/50 flex flex-wrap items-center gap-2">
            <Hourglass className="h-4 w-4 text-amber-700" />
            <h3 className="font-semibold text-amber-800 text-sm">Pending Supervisor Approval ({pendingSupervisor.length})</h3>
            <p className="text-xs text-amber-700/80">Awaiting the employee's direct supervisor — these cannot be processed by Finance yet.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/20">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Staff Member</th>
                  <th className="text-left px-3 py-2 font-semibold">Date Requested</th>
                  <th className="text-center px-3 py-2 font-semibold">Entries</th>
                  <th className="text-right px-3 py-2 font-semibold">Total Requested</th>
                  <th className="text-left px-3 py-2 font-semibold">Awaiting Supervisor</th>
                  <th className="text-center px-3 py-2 font-semibold">View</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingSupervisor.map(r => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.requester_name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{r.requester_email || ''}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.date_requested || r.submitted_date)}</td>
                    <td className="px-3 py-2 text-center">{r.entry_count || (entriesByForm[r.id] || []).length || '—'}</td>
                    <td className="px-3 py-2 text-right font-semibold">{fmt(r.amount)}</td>
                    <td className="px-3 py-2">{r.supervisor_name || r.supervisor_email || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <OpenReimbursementButton entries={entriesByForm[r.id] || []} form={r} mode={mode} />
                        <ReceiptsBundleButton entries={entriesByForm[r.id] || []} form={r} docTitle={cfg.docTitle} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
            <SelectItem value="processing">Processing</SelectItem>
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
          {cfg.financeEmpty}
        </CardContent></Card>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Staff Member</th>
                  <th className="text-left px-3 py-2 font-semibold">Reference</th>
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
                        <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{r.reference_code || '—'}</td>
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
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {(r.status === 'pending' || r.status === 'processing') && (
                              r.status === 'processing' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-3 gap-1.5 font-semibold"
                                  onClick={() => setStatus.mutate({ form: r, status: 'pending' })}
                                  title="Remove from Processing — returns the submission to Pending so the staff member can edit it again"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  Remove from Processing
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="h-7 px-3 gap-1.5 font-semibold"
                                  onClick={() => setStatus.mutate({ form: r, status: 'processing' })}
                                  title="Mark as processing — locks the submission so the staff member can no longer edit it"
                                >
                                  <CircleDollarSign className="w-4 h-4" />
                                  Processing
                                </Button>
                              )
                            )}
                            {r.status === 'pending' && (
                              <>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-green-700 hover:bg-green-50" onClick={() => setApproveTarget(r)} title="Approve (e-sign)">
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-red-700 hover:bg-red-50" onClick={() => setStatus.mutate({ form: r, status: 'rejected', patch: { rejection_reason: 'Rejected by finance' } })} title="Reject">
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {(r.status === 'approved' || r.status === 'pending' || r.status === 'processing') && (
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-green-700 hover:bg-green-50" onClick={() => startPayment(r)} title="Pay — locks as Processing, opens Scotiabank, then confirm paid">
                                <Banknote className="w-4 h-4" /> Pay
                              </Button>
                            )}
                            {r.status === 'paid' && (
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-amber-700 hover:bg-amber-50" onClick={() => setReverseTarget(r)} title="Reverse paid status — returns the submission to Processing">
                                <RotateCcw className="w-4 h-4" /> Reverse
                              </Button>
                            )}
                            <OpenReimbursementButton entries={items} form={r} mode={mode} editable />
                            <ReceiptsBundleButton entries={items} form={r} docTitle={cfg.docTitle} />
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-muted/20">
                          <td colSpan={8} className="px-3 py-2">
                            {(r.finance_signature || r.approved_by) && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {r.approved_by && <>Approved by <span className="font-medium">{r.approved_by}</span></>}
                                {r.approved_by && r.finance_signature && ' · '}
                                {r.finance_signature && <>Finance e-Signature: <span className="font-medium italic">{r.finance_signature}</span></>}
                              </p>
                            )}
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-muted-foreground uppercase">
                                  <th className="px-2 py-1.5 font-semibold">Date</th>
                                  <th className="px-2 py-1.5 font-semibold">Description</th>
                                  <th className="px-2 py-1.5 font-semibold">Supplier</th>
                                  <th className="px-2 py-1.5 font-semibold">Program</th>
                                  <th className="px-2 py-1.5 font-semibold text-right">GST</th>
                                  <th className="px-2 py-1.5 font-semibold text-right">Total</th>
                                  <th className="px-2 py-1.5 font-semibold text-right bg-muted">1/2 GST</th>
                                  <th className="px-2 py-1.5 font-semibold text-right bg-muted">Funder Cost</th>
                                  <th className="px-2 py-1.5 font-semibold bg-muted">Account #</th>
                                  <th className="px-2 py-1.5 font-semibold bg-muted">Funder #</th>
                                  <th className="px-2 py-1.5 font-semibold text-center bg-muted">Save</th>
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
                                    <td className="px-2 py-1.5 text-right font-medium">
                                      {fmt(e.total_cost)}
                                      {e.excluded_amount > 0 && (
                                        <span
                                          className="block text-[10px] font-normal text-amber-600"
                                          title={e.excluded_description ? `Personal item excluded: ${e.excluded_description}` : 'Personal item excluded'}
                                        >✂ −{fmt(e.excluded_amount * 1.05)}</span>
                                      )}
                                    </td>
                                    <FinanceEntryFundingCells entry={e} mode={mode} />
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

      <ESignatureCaptureDialog
        open={!!approveTarget}
        onOpenChange={o => !o && setApproveTarget(null)}
        documentRef={`${cfg.docTitle} approval — ${approveTarget?.requester_name || ''}`}
        onSigned={async ({ log, imageDataUrl }) => {
          const url = await uploadSignatureImage(imageDataUrl);
          setStatus.mutate({ form: approveTarget, status: 'approved', patch: { finance_signature: log.signed_by || displayName(user), finance_signature_url: url } });
          setApproveTarget(null);
        }}
      />

      <Dialog open={!!payTarget} onOpenChange={o => { if (!o) setPayTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Banknote className="w-4 h-4" />Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Approved by *</Label>
              <Select value={payApprover} onValueChange={v => { setPayApprover(v); setPayError(''); }}>
                <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select approver" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jim Cunningham">Jim Cunningham</SelectItem>
                  <SelectItem value="Graham Currie">Graham Currie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {payError && <p className="text-xs text-red-600">{payError}</p>}
            <div>
              <Label className="text-xs">e-Signature — Financial Officer Approval *</Label>
              {paySigUrl ? (
                <div className="flex items-center gap-2 rounded-lg border bg-white px-2 py-1">
                  <img src={paySigUrl} alt="Financial Officer e-signature" className="h-24 object-contain" />
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setPaySigUrl(''); setPaySigName(''); setPayError(''); }}>Re-sign</Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setPaySignOpen(true)}>
                  <PenLine className="w-4 h-4" /> Sign as Financial Officer
                </Button>
              )}
              <p className="text-xs text-muted-foreground mt-1">Verifies with your signature PIN/password and is printed on the Financial Officer Approval line of the form.</p>
            </div>
            <p className="text-sm text-muted-foreground">
              The Scotiabank window is open. Complete the e-transfer of{' '}
              <span className="font-semibold text-foreground">{fmt(payTarget?.amount)}</span> to{' '}
              <span className="font-semibold text-foreground">{payTarget?.payable_to}</span>
              {payTarget?.etransfer_email ? ` (${payTarget.etransfer_email})` : ''}.
            </p>
            <p className="text-sm font-medium text-foreground">
              Select OK once the transaction is complete to mark this submission as paid.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              className="gap-2"
              disabled={setStatus.isPending}
              onClick={() => {
                if (!payApprover) { setPayError('Select the approver.'); return; }
                if (!paySigUrl) { setPayError('Add your e-signature as the Financial Officer.'); return; }
                setStatus.mutate({ form: payTarget, status: 'paid', patch: { approved_by: payApprover, finance_signature: paySigName, finance_signature_url: paySigUrl } });
                setPayTarget(null);
                setPaySigUrl('');
                setPaySigName('');
              }}
            >
              <Check className="w-4 h-4" />OK — Mark as Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reverseTarget} onOpenChange={o => { if (!o) setReverseTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RotateCcw className="w-4 h-4" />Reverse Paid Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This will return the submission from{' '}
              <span className="font-medium text-foreground">{reverseTarget?.requester_name}</span> ({fmt(reverseTarget?.amount)}){' '}
              to Processing so it can be corrected and paid again. The staff member's entries return to their Submitted list,
              and any unread payment notification on their dashboard is dismissed.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              variant="destructive"
              className="gap-2"
              disabled={reversePayment.isPending}
              onClick={() => {
                reversePayment.mutate({ form: reverseTarget });
                setReverseTarget(null);
              }}
            >
              <RotateCcw className="w-4 h-4" />Reverse to Processing
            </Button>
          </DialogFooter>
          </DialogContent>
          </Dialog>

          <ESignatureCaptureDialog
          open={paySignOpen}
          onOpenChange={setPaySignOpen}
          documentRef={`${cfg.docTitle} payment — ${payTarget?.requester_name || ''}`}
          onSigned={async ({ log, imageDataUrl }) => {
          setPaySigUrl(await uploadSignatureImage(imageDataUrl));
          setPaySigName(log.signed_by || displayName(user));
          setPaySignOpen(false);
          }}
          />
          </div>
          );
          }