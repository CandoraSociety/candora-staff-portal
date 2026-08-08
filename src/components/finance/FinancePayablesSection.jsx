import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const RECORD_LABELS = {
  paid_external_placement: 'Work Exposure Payment',
  employment_supports: 'Employment Supports',
  exposure_course: 'Exposure Course',
};

export default function FinancePayablesSection({ recordType }) {
  const queryClient = useQueryClient();
  const [filterMonth, setFilterMonth] = useState('all');

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
    hoursSubs.forEach(s => { if (s.id) m[s.id] = { start: s.period_start_date, end: s.period_end_date }; });
    return m;
  }, [hoursSubs]);

  const availableMonths = useMemo(() => {
    const s = new Set();
    records.forEach(r => { if (r.billing_month) s.add(r.billing_month); });
    return Array.from(s).sort().reverse();
  }, [records]);

  const filtered = useMemo(() => {
    return records
      .filter(r => filterMonth === 'all' || r.billing_month === filterMonth)
      .sort((a, b) => (b.billing_month || '').localeCompare(a.billing_month || ''));
  }, [records, filterMonth]);

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

  const totalOutstanding = filtered.filter(r => !r.reimbursed).reduce((s, r) => s + (r.total || r.amount || 0), 0);
  const totalPaid = filtered.filter(r => r.reimbursed).reduce((s, r) => s + (r.total || r.amount || 0), 0);

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

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{RECORD_LABELS[recordType] || recordType}</span>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Billing Month" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {availableMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          No {RECORD_LABELS[recordType]?.toLowerCase() || 'records'} found.
        </CardContent></Card>
      ) : (
        <Card>
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
                    </>
                  )}
                  <th className="text-right px-3 py-2 font-semibold">Amount</th>
                  <th className="text-left px-3 py-2 font-semibold">Billing Month</th>
                  <th className="text-center px-3 py-2 font-semibold">Status</th>
                  <th className="text-center px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(rec => {
                  const p = rec.linked_submission_id ? periodBySubId[rec.linked_submission_id] : null;
                  const period = p && (p.start || p.end)
                    ? `${p.start ? format(new Date(p.start + 'T00:00:00'), 'MMM d, yy') : '—'} – ${p.end ? format(new Date(p.end + 'T00:00:00'), 'MMM d, yy') : '—'}`
                    : (rec.work_end_date ? format(new Date(rec.work_end_date + 'T00:00:00'), 'MMM d, yy') : '—');
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
                        </>
                      )}
                      <td className="px-3 py-2 text-right font-semibold">${Number(rec.total || rec.amount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2">{rec.billing_month || '—'}</td>
                      <td className="px-3 py-2 text-center">
                        {rec.reimbursed
                          ? <Badge className="text-xs bg-green-100 text-green-800">Paid</Badge>
                          : <Badge className="text-xs bg-amber-100 text-amber-800">Unpaid</Badge>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Button size="sm" variant={rec.reimbursed ? 'outline' : 'default'} onClick={() => togglePaid(rec)}>
                          {rec.reimbursed ? 'Mark Unpaid' : 'Mark Paid'}
                        </Button>
                      </td>
                    </tr>
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