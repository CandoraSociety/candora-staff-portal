import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { parseBillingMonth } from './billingMonth';

export default function WorkExposurePlacementsTab({ billingMonth }) {
  const [expanded, setExpanded] = useState({});

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['we-placements', billingMonth],
    queryFn: () => base44.entities.FinancialRecord.filter({ record_type: 'paid_external_placement' }),
    select: (recs) => (recs || [])
      .filter((r) => r.billing_month === billingMonth && r.invoiced !== true)
      .sort((a, b) => (a.client_name || '').localeCompare(b.client_name || '')),
  });

  // Group submissions by client
  const grouped = (() => {
    const map = {};
    records.forEach((r) => {
      const key = r.client_id || r.client_name || 'unknown';
      if (!map[key]) map[key] = { client_name: r.client_name || '—', subs: [] };
      map[key].subs.push(r);
    });
    return Object.entries(map);
  })();

  const totalAmount = records.reduce((sum, r) => sum + (r.total || r.amount || 0), 0);
  const totalHours = records.reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0);
  const monthLabel = billingMonth ? format(parseBillingMonth(billingMonth), 'MMMM yyyy') : '';

  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

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
          <div className="space-y-2">
            {grouped.map(([key, group]) => {
              const isOpen = !!expanded[key];
              const subs = group.subs;
              const clientHours = subs.reduce((s, r) => s + (Number(r.hours_worked) || 0), 0);
              const clientTotal = subs.reduce((s, r) => s + (r.total || r.amount || 0), 0);
              return (
                <div key={key} className="rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => toggle(key)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                        : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      <span className="font-medium text-sm text-slate-700">{group.client_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {subs.length} submission{subs.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span>{clientHours} hrs</span>
                      <span className="font-semibold">${clientTotal.toFixed(2)}</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="overflow-x-auto border-t border-slate-100">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50/50">
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-2 px-3 font-medium text-slate-500">Employer / Vendor</th>
                            <th className="text-left py-2 px-3 font-medium text-slate-500">Work End Date</th>
                            <th className="text-right py-2 px-3 font-medium text-slate-500">Hours</th>
                            <th className="text-right py-2 px-3 font-medium text-slate-500">Rate</th>
                            <th className="text-right py-2 px-3 font-medium text-slate-500">Billing Amount</th>
                            <th className="text-center py-2 px-3 font-medium text-slate-500">Timesheet</th>
                            <th className="text-center py-2 px-3 font-medium text-slate-500">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {subs.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3">{r.vendor || '—'}</td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                {r.work_end_date
                                  ? format(new Date(r.work_end_date + 'T00:00:00'), 'MMM d, yyyy')
                                  : '—'}
                              </td>
                              <td className="text-right py-2 px-3">{r.hours_worked != null ? r.hours_worked : '—'}</td>
                              <td className="text-right py-2 px-3">
                                {r.hourly_rate != null ? `$${Number(r.hourly_rate).toFixed(2)}/hr` : '—'}
                              </td>
                              <td className="text-right py-2 px-3 font-semibold">
                                ${(Number(r.total || r.amount || 0)).toFixed(2)}
                              </td>
                              <td className="text-center py-2 px-3">
                                {r.receipt_urls && r.receipt_urls.length > 0 ? (
                                  <a
                                    href={r.receipt_urls[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 text-xs"
                                  >
                                    view
                                  </a>
                                ) : '—'}
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
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">Total: <strong>{totalHours} hrs</strong></span>
                <span className="text-slate-700 font-bold text-base">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}