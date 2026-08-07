import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { parseBillingMonth } from './billingMonth';

export default function WorkExposurePlacementsTab({ billingMonth }) {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['we-placements', billingMonth],
    queryFn: () => base44.entities.FinancialRecord.filter({ record_type: 'paid_external_placement' }),
    select: (recs) => (recs || [])
      .filter((r) => r.billing_month === billingMonth && r.invoiced !== true)
      .sort((a, b) => (a.client_name || '').localeCompare(b.client_name || '')),
  });

  const totalAmount = records.reduce((sum, r) => sum + (r.total || r.amount || 0), 0);
  const monthLabel = billingMonth ? format(parseBillingMonth(billingMonth), 'MMMM yyyy') : '';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Exposure Placements
          </CardTitle>
          <div className="text-right">
            <p className="text-xs text-slate-500">Billing month</p>
            <p className="text-sm font-semibold">{monthLabel}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-slate-500 text-center py-8">Loading work exposure placements…</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No work exposure placement billing recorded for {monthLabel || 'this billing month'}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left py-2 px-3">Client</th>
                  <th className="text-left py-2 px-3">Employer / Vendor</th>
                  <th className="text-left py-2 px-3">Work End Date</th>
                  <th className="text-right py-2 px-3">Hours</th>
                  <th className="text-right py-2 px-3">Rate</th>
                  <th className="text-right py-2 px-3">Billing Amount</th>
                  <th className="text-center py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 px-3 font-medium">{r.client_name || '—'}</td>
                    <td className="py-2 px-3">{r.vendor || '—'}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {r.work_end_date ? format(new Date(r.work_end_date + 'T00:00:00'), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="text-right py-2 px-3">{r.hours_worked != null ? r.hours_worked : '—'}</td>
                    <td className="text-right py-2 px-3">
                      {r.hourly_rate != null ? `$${Number(r.hourly_rate).toFixed(2)}/hr` : '—'}
                    </td>
                    <td className="text-right py-2 px-3 font-bold">
                      ${(Number(r.total || r.amount || 0)).toFixed(2)}
                    </td>
                    <td className="text-center py-2 px-3">
                      {r.invoiced ? (
                        <Badge variant="outline" className="text-green-600">Invoiced</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600">Pending</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-right" colSpan={5}>Total Billing</td>
                  <td className="text-right py-2 px-3 font-bold text-base">${totalAmount.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}