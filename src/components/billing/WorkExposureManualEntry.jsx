import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Briefcase, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { currentBillingMonth, parseBillingMonth } from './billingMonth';

const RATE = 15;

function billingMonthFromDate(dateStr) {
  if (!dateStr) return '';
  return String(dateStr).slice(0, 7); // YYYY-MM
}

export default function WorkExposureManualEntry({ clients }) {
  const queryClient = useQueryClient();
  const [billingMonth, setBillingMonth] = useState(currentBillingMonth());
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [clientId, setClientId] = useState('');
  const [employer, setEmployer] = useState('');
  const [hours, setHours] = useState('');
  const [payPeriodEnd, setPayPeriodEnd] = useState('');

  const clientMap = useMemo(() => {
    const map = {};
    (clients || []).forEach((c) => { map[c.id] = `${c.first_name} ${c.last_name}`; });
    return map;
  }, [clients]);

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['financial-records'],
    queryFn: () => base44.entities.FinancialRecord.filter({ record_type: 'paid_external_placement' }),
  });

  const monthRecords = useMemo(
    () => (allRecords || [])
      .filter((r) => r.billing_month === billingMonth)
      .sort((a, b) => (a.client_name || '').localeCompare(b.client_name || '')),
    [allRecords, billingMonth]
  );

  const totalHours = monthRecords.reduce((s, r) => s + (Number(r.hours_worked) || 0), 0);
  const totalAmount = monthRecords.reduce((s, r) => s + (Number(r.total || r.amount) || 0), 0);

  const computedTotal = hours ? (Number(hours) * RATE) : 0;

  const resetForm = () => {
    setClientId('');
    setEmployer('');
    setHours('');
    setPayPeriodEnd('');
  };

  const handleAdd = async () => {
    if (!clientId) { toast.error('Select a client.'); return; }
    if (!employer.trim()) { toast.error('Enter the employer name.'); return; }
    const hrs = Number(hours);
    if (!hrs || hrs <= 0) { toast.error('Enter hours worked.'); return; }
    if (!payPeriodEnd) { toast.error('Select the pay period end date.'); return; }

    setSaving(true);
    try {
      const clientName = clientMap[clientId] || '';
      const total = hrs * RATE;
      await base44.entities.FinancialRecord.create({
        client_id: clientId,
        client_name: clientName,
        record_type: 'paid_external_placement',
        vendor: employer.trim(),
        hours_worked: hrs,
        hourly_rate: RATE,
        amount: total,
        total,
        tax: 0,
        work_end_date: payPeriodEnd,
        date: payPeriodEnd,
        billing_month: billingMonthFromDate(payPeriodEnd) || billingMonth,
        registration_status: 'not_registered',
        completion_status: 'completed',
        notes: 'Manual entry',
      });
      queryClient.invalidateQueries({ queryKey: ['financial-records'] });
      toast.success('Work exposure entry added.');
      resetForm();
      setOpen(false);
    } catch (e) {
      toast.error(e?.message || 'Could not save the entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    if (!confirm('Delete this manual entry?')) return;
    try {
      await base44.entities.FinancialRecord.delete(record.id);
      queryClient.invalidateQueries({ queryKey: ['financial-records'] });
      toast.success('Entry deleted.');
    } catch (e) {
      toast.error(e?.message || 'Could not delete.');
    }
  };

  const monthLabel = format(parseBillingMonth(billingMonth), 'MMMM yyyy');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Exposure Placements
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-slate-500">Billing month</Label>
              <Input
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="w-[150px] h-8 text-sm"
              />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Manual Entry</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Work Exposure Entry — {monthLabel}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Client</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                      <SelectContent>
                        {(clients || []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.first_name} {c.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Employer name</Label>
                    <Input value={employer} onChange={(e) => setEmployer(e.target.value)} placeholder="Business / employer" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Hours worked</Label>
                      <Input type="number" min="0" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Pay period end date</Label>
                      <Input type="date" value={payPeriodEnd} onChange={(e) => setPayPeriodEnd(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Rate</Label>
                      <Input value={`$${RATE.toFixed(2)}/hr`} disabled className="bg-slate-50 text-slate-500" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Total</Label>
                      <Input value={`$${computedTotal.toFixed(2)}`} disabled className="bg-slate-50 font-semibold" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleAdd} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {saving ? 'Saving…' : 'Add Entry'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-slate-500 text-center py-8">Loading…</p>
        ) : monthRecords.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No work exposure entries for {monthLabel}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left py-2 px-3">Client</th>
                  <th className="text-left py-2 px-3">Employer</th>
                  <th className="text-right py-2 px-3">Hours</th>
                  <th className="text-left py-2 px-3">Pay Period End</th>
                  <th className="text-right py-2 px-3">Rate</th>
                  <th className="text-right py-2 px-3">Total</th>
                  <th className="text-center py-2 px-3">Source</th>
                  <th className="text-center py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {monthRecords.map((r, idx) => (
                  <tr key={r.id} className={`border-b last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="py-2 px-3 font-medium whitespace-nowrap">
                      {clientMap[r.client_id] || r.client_name || '—'}
                    </td>
                    <td className="py-2 px-3">{r.vendor || r.business_name || '—'}</td>
                    <td className="text-right py-2 px-3">{Number(r.hours_worked) || 0}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {r.work_end_date ? format(new Date(r.work_end_date + 'T00:00:00'), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="text-right py-2 px-3">
                      {r.hourly_rate != null ? `$${Number(r.hourly_rate).toFixed(2)}/hr` : `$${RATE.toFixed(2)}/hr`}
                    </td>
                    <td className="text-right py-2 px-3 font-semibold">
                      ${(Number(r.total || r.amount) || 0).toFixed(2)}
                    </td>
                    <td className="text-center py-2 px-3">
                      {r.notes === 'Manual entry' ? (
                        <Badge variant="outline" className="text-blue-600">Manual</Badge>
                      ) : r.linked_submission_id ? (
                        <Badge variant="outline" className="text-slate-500">Submitted</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400">—</Badge>
                      )}
                    </td>
                    <td className="text-center py-2 px-3">
                      {r.notes === 'Manual entry' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(r)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300">
                  <td colSpan={2} className="text-right py-2 px-3 font-semibold">TOTALS</td>
                  <td className="text-right py-2 px-3 font-bold">{totalHours}</td>
                  <td></td>
                  <td></td>
                  <td className="text-right py-2 px-3 font-bold text-base">${totalAmount.toFixed(2)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}