import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, ExternalLink, ClipboardList, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { currentBillingMonth } from '@/components/billing/billingMonth';

// Outcome + date fields are the actionable Compass entries — highlight them.
const OUTCOME_FIELDS = new Set([
  'DEA Start Date', 'Service Start Date',
  'Service Outcome', 'Service Outcome Date',
  'Placement Outcome', 'Placement Outcome Date',
  '30 Day Outcome', '30 Day Outcome Date',
  '60 Day Outcome', '60 Day Outcome Date',
  '90 Day Outcome', '90 Day Outcome Date',
  '180 Day Outcome', '180 Day Outcome Date',
]);

export default function CompassEntryChecklist() {
  const [billingMonth, setBillingMonth] = useState(currentBillingMonth());
  const navigate = useNavigate();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['compass-entry-checklist', billingMonth],
    queryFn: async () => (await base44.functions.invoke('getCompassEntryChecklist', { billingMonth })).data,
  });

  const items = data?.items || [];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Billing month</label>
            <Input type="month" value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)} className="w-44" />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
        <p className="text-xs text-slate-500 max-w-md">
          Clients below had activity in {billingMonth} on the CRT Client Data sheet. Use the filled fields as a checklist for what to reflect in Compass.
        </p>
      </div>

      {data?.workbook && (
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" /> Source workbook: {data.workbook}
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No clients had activity in {billingMonth}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <Card key={idx} className="border-slate-300 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{item.client_name}</span>
                    {item.hsid && <Badge variant="outline" className="text-slate-500">HSID: {item.hsid}</Badge>}
                    {item.assigned_worker_name && (
                      <span className="text-xs text-slate-400">· {item.assigned_worker_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Row {item.row_number}</span>
                    {item.client_id && (
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/pathways/client/${item.client_id}`)} className="text-slate-500 gap-1 text-xs">
                        <ExternalLink className="w-3.5 h-3.5" /> View Client
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                  {item.fields.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${OUTCOME_FIELDS.has(f.label) ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                        {f.label}
                      </span>
                      <span className="text-slate-800 break-words min-w-0">{f.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}