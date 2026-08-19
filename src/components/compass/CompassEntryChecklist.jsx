import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, ExternalLink, ClipboardList, CalendarDays, X, Plus, MessageSquare } from 'lucide-react';
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

const monthLabel = (ym) => {
  const [y, m] = String(ym).split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function CompassEntryChecklist() {
  const navigate = useNavigate();
  const [months, setMonths] = useState([currentBillingMonth()]);
  const [draftMonth, setDraftMonth] = useState('');

  const monthsKey = useMemo(() => [...months].sort().join(','), [months]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['compass-entry-checklist-multi', monthsKey],
    queryFn: async () => (await base44.functions.invoke('getCompassEntryChecklist', { months })).data,
  });

  const addMonth = () => {
    const m = draftMonth;
    if (!m) return;
    setMonths((prev) => (prev.includes(m) ? prev : [...prev, m]));
    setDraftMonth('');
  };
  const removeMonth = (m) => setMonths((prev) => prev.filter((x) => x !== m));

  const monthResults = (data?.months || []).slice().sort((a, b) => a.month.localeCompare(b.month));
  const totalActive = monthResults.reduce((n, r) => n + (r.count || 0), 0);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add month</label>
              <Input type="month" value={draftMonth} onChange={(e) => setDraftMonth(e.target.value)} className="w-44" />
            </div>
            <Button variant="outline" size="sm" onClick={addMonth} disabled={!draftMonth} className="gap-2">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
        <p className="text-xs text-slate-500 max-w-md">
          Each card lists the filled Client Data fields for a client who had activity that month — use it as a checklist for what to reflect in Compass.
        </p>
      </div>

      {/* Selected month chips */}
      <div className="flex flex-wrap items-center gap-2">
        {months.slice().sort().map((m) => (
          <span key={m} className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground rounded-full pl-3 pr-1.5 py-1 text-xs font-medium">
            <CalendarDays className="w-3.5 h-3.5 opacity-70" />
            {monthLabel(m)}
            <button onClick={() => removeMonth(m)} className="ml-0.5 rounded-full hover:bg-black/10 p-0.5" title="Remove month">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {months.length > 1 && (
          <span className="text-xs text-slate-500 ml-1">{totalActive} active client{totalActive === 1 ? '' : 's'} across selected months</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : monthResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No months selected.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {monthResults.map((mr) => (
            <div key={mr.month} className="space-y-3">
              <div className="flex items-baseline gap-2 sticky top-0 bg-background/95 backdrop-blur py-1 z-10">
                <h3 className="font-display font-bold text-slate-800">{monthLabel(mr.month)}</h3>
                <span className="text-xs text-slate-500">{mr.count} client{mr.count === 1 ? '' : 's'}</span>
                {mr.workbook && <span className="text-xs text-slate-400">· {mr.workbook}</span>}
              </div>

              {mr.count === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-lg">
                  <ClipboardList className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm">No clients had activity in {monthLabel(mr.month)}.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mr.items.map((item, idx) => {
                    const comments = item.fields.find((f) => f.label === 'Comments');
                    const coreFields = item.fields.filter((f) => f.label !== 'Comments');
                    return (
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
                            {coreFields.map((f, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${OUTCOME_FIELDS.has(f.label) ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                                  {f.label}
                                </span>
                                <span className="text-slate-800 break-words min-w-0">{f.value}</span>
                              </div>
                            ))}
                          </div>
                          {comments && comments.value && (
                            <details className="group border-t border-slate-100 pt-2">
                              <summary className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700 list-none">
                                <MessageSquare className="w-3.5 h-3.5" />
                                Comments
                                <span className="text-slate-400 group-open:hidden">· show</span>
                                <span className="text-slate-400 hidden group-open:inline">· hide</span>
                              </summary>
                              <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-md p-3 border border-slate-100">
                                {comments.value}
                              </p>
                            </details>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}