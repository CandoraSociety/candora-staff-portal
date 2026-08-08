import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, ChevronDown, ChevronRight, DollarSign, ExternalLink, FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from 'sonner';

const RECORD_LABELS = {
  paid_external_placement: 'Work Exposure Payment',
  employment_supports: 'Staff Reimbursement Requests',
  exposure_course: 'Exposure Course',
};

export default function FinancePayablesSection({ recordType }) {
  const queryClient = useQueryClient();
  const [filterMonth, setFilterMonth] = useState('all');
  const [search, setSearch] = useState('');

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['finance-payables', recordType],
    queryFn: () => base44.entities.FinancialRecord.filter({ record_type: recordType }),
  });
  const { data: employers = [] } = useQuery({
    queryKey: ['employers-all'],
    queryFn: () => base44.entities.Employer.list(),
  });
  const { data: hoursSubs = [] } = useQuery({
    queryKey: ['work-exposure-hours-submissions-all'],
    queryFn: () => base44.entities.WorkExposureHoursSubmission.list(),
  });

  const payableByVendor = useMemo(() => {
    const m = {};
    employers.forEach(e => { if (e.name) m[e.name] = e.payment_payable_to || 'employer'; });
    return m;
  }, [employers]);
  const periodBySubId = useMemo(() => {
    const m = {};
    hoursSubs.forEach(s => { if (s.id) m[s.id] = { start: s.period_start_date, end: s.period_end_date, timesheet_url: s.timesheet_url }; });
    return m;
  }, [hoursSubs]);

  const availableMonths = useMemo(() => {
    const s = new Set();
    records.forEach(r => { if (r.billing_month) s.add(r.billing_month); });
    return Array.from(s).sort().reverse();
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records
      .filter(r => filterMonth === 'all' || r.billing_month === filterMonth)
      .filter(r => {
        if (!q) return true;
        return [r.client_name, r.vendor, r.description, r.billing_month, r.notes]
          .some(v => String(v || '').toLowerCase().includes(q));
      })
      .sort((a, b) => (b.billing_month || '').localeCompare(a.billing_month || ''));
  }, [records, filterMonth, search]);

  const outstanding = useMemo(() => filtered.filter(r => !r.reimbursed), [filtered]);
  const paid = useMemo(() => filtered.filter(r => r.reimbursed), [filtered]);

  const markPaidMutation = useMutation({
    mutationFn: async ({ rec, paid }) => await base44.entities.FinancialRecord.update(rec.id, {
      reimbursed: paid,
      reimbursement_date: paid ? format(new Date(), 'yyyy-MM-dd') : '',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-payables', recordType] });
      queryClient.invalidateQueries({ queryKey: ['financial-records'] });
    },
  });

  const togglePaid = async (rec) => {
    try {
      await markPaidMutation.mutateAsync({ rec, paid: !rec.reimbursed });
      toast.success(rec.reimbursed ? 'Marked as unpaid' : 'Marked as paid — reflected in Pathways Billing');
    } catch (e) { toast.error('Failed to update'); }
  };

  const valOf = (r) => recordType === 'employment_supports' ? (r.amount || 0) : (r.total || r.amount || 0);
  const isES = recordType === 'employment_supports';
  const totalOutstanding = isES ? 0 : outstanding.reduce((s, r) => s + valOf(r), 0);
  const totalPaid = isES ? filtered.reduce((s, r) => s + valOf(r), 0) : paid.reduce((s, r) => s + valOf(r), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Outstanding</div>
            <div className="text-lg font-bold text-amber-700">${totalOutstanding.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Paid</div>
            <div className="text-lg font-bold text-green-700">${totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm font-semibold text-foreground">{RECORD_LABELS[recordType] || recordType}</span>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client, vendor, notes…"
              className="pl-8 h-9 w-[220px]"
            />
          </div>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Billing Month" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {availableMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          No {RECORD_LABELS[recordType]?.toLowerCase() || 'records'} found.
        </CardContent></Card>
      ) : (
        isES ? (
          <PayablesTable
            title="Staff Reimbursement Requests"
            records={filtered}
            recordType={recordType}
            payableByVendor={payableByVendor}
            periodBySubId={periodBySubId}
            alwaysPaid
          />
        ) : (
          <>
            <PayablesTable
              title="Outstanding"
              records={outstanding}
              recordType={recordType}
              payableByVendor={payableByVendor}
              periodBySubId={periodBySubId}
              togglePaid={togglePaid}
            />
            {paid.length > 0 && (
              <PayablesTable
                title="Paid"
                records={paid}
                recordType={recordType}
                payableByVendor={payableByVendor}
                periodBySubId={periodBySubId}
                togglePaid={togglePaid}
                collapsible
              />
            )}
          </>
        )
      )}
    </div>
  );
}

function PayablesTable({ title, records, recordType, payableByVendor, periodBySubId, togglePaid, collapsible, alwaysPaid }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/40">
        <span className="text-sm font-semibold flex items-center gap-2">
          {collapsible && (
            <button onClick={() => setCollapsed(c => !c)} className="text-muted-foreground hover:text-foreground">
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          {title}
          <Badge variant="outline" className="text-xs">{records.length}</Badge>
        </span>
      </div>
      {!(collapsible && collapsed) && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Client</th>
                <th className="text-left px-3 py-2 font-semibold">Vendor / Employer</th>
                {recordType === 'paid_external_placement' && (
                  <>
                    <th className="text-center px-3 py-2 font-semibold">Payable To</th>
                    <th className="text-left px-3 py-2 font-semibold">Pay Period</th>
                    <th className="text-left px-3 py-2 font-semibold">Timesheet</th>
                  </>
                )}
                <th className="text-right px-3 py-2 font-semibold">{recordType === 'employment_supports' ? 'Total to be Reimbursed' : 'Amount'}</th>
                {recordType === 'employment_supports' && <th className="text-right px-3 py-2 font-semibold">Tax</th>}
                {recordType === 'employment_supports' && <th className="text-right px-3 py-2 font-semibold">Total</th>}
                <th className="text-left px-3 py-2 font-semibold">Billing Month</th>
                <th className="text-center px-3 py-2 font-semibold">Status</th>
                {!alwaysPaid && <th className="text-center px-3 py-2 font-semibold">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map(rec => {
                const p = rec.linked_submission_id ? periodBySubId[rec.linked_submission_id] : null;
                const period = p && (p.start || p.end)
                  ? `${p.start ? format(new Date(p.start + 'T00:00:00'), 'MMM d, yy') : '—'} – ${p.end ? format(new Date(p.end + 'T00:00:00'), 'MMM d, yy') : '—'}`
                  : (rec.work_end_date ? format(new Date(rec.work_end_date + 'T00:00:00'), 'MMM d, yy') : '—');
                const timesheetUrl = p?.timesheet_url || (rec.receipt_urls && rec.receipt_urls[0]);
                return (
                  <tr key={rec.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{rec.client_name || '—'}</td>
                    <td className="px-3 py-2 max-w-[180px] break-words whitespace-normal">{rec.vendor || '—'}</td>
                    {recordType === 'paid_external_placement' && (
                      <>
                        <td className="px-3 py-2 text-center">
                          <Badge className={payableByVendor[rec.vendor] === 'client' ? 'text-xs bg-purple-100 text-purple-800' : 'text-xs bg-sky-100 text-sky-800'}>
                            {payableByVendor[rec.vendor] === 'client' ? 'Client' : 'Employer'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{period}</td>
                        <td className="px-3 py-2">
                          {timesheetUrl ? (
                            <a href={timesheetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                              <FileText className="w-3.5 h-3.5" /> View <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="px-3 py-2 text-right font-semibold">${Number(recordType === 'employment_supports' ? (rec.amount || 0) : (rec.total || rec.amount || 0)).toFixed(2)}</td>
                    {recordType === 'employment_supports' && <td className="px-3 py-2 text-right text-muted-foreground">${Number(rec.tax || 0).toFixed(2)}</td>}
                    {recordType === 'employment_supports' && <td className="px-3 py-2 text-right">${Number(rec.total || 0).toFixed(2)}</td>}
                    <td className="px-3 py-2">{rec.billing_month || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      {alwaysPaid
                        ? <Badge className="text-xs bg-green-100 text-green-800">Paid</Badge>
                        : rec.reimbursed
                          ? <Badge className="text-xs bg-green-100 text-green-800">Paid</Badge>
                          : <Badge className="text-xs bg-amber-100 text-amber-800">Unpaid</Badge>}
                    </td>
                    {!alwaysPaid && (
                      <td className="px-3 py-2 text-center">
                        <Button size="sm" variant={rec.reimbursed ? 'outline' : 'default'} onClick={() => togglePaid(rec)}>
                          {rec.reimbursed ? 'Mark Unpaid' : 'Mark Paid'}
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}