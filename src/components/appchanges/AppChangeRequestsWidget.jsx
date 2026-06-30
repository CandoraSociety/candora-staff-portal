import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import CollapsibleWidget from '@/components/dashboard/CollapsibleWidget';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Filter, Lightbulb, Loader2 } from 'lucide-react';

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  reviewed: { label: 'Reviewed', color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'In Progress', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  dismissed: { label: 'Dismissed', color: 'bg-gray-100 text-gray-500' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function AppChangeRequestsWidget() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['appChangeRequests', 'all'],
    queryFn: () => base44.entities.AppChangeRequest.list('-created_date', 500),
  });

  const employees = useMemo(() => {
    const map = new Map();
    requests.forEach(r => {
      if (r.submitted_by_email && !map.has(r.submitted_by_email)) {
        map.set(r.submitted_by_email, r.submitted_by_name || r.submitted_by_email);
      }
    });
    return Array.from(map.entries()).map(([email, name]) => ({ email, name }));
  }, [requests]);

  const filtered = useMemo(() => {
    let result = [...requests];
    if (filterEmployee !== 'all') {
      result = result.filter(r => r.submitted_by_email === filterEmployee);
    }
    if (filterDate) {
      const filterDay = new Date(filterDate);
      filterDay.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDay);
      nextDay.setDate(nextDay.getDate() + 1);
      result = result.filter(r => {
        const d = new Date(r.created_date);
        return d >= filterDay && d < nextDay;
      });
    }
    return result;
  }, [requests, filterEmployee, filterDate]);

  const newCount = requests.filter(r => r.status === 'new').length;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.AppChangeRequest.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['appChangeRequests', 'all']);
      toast.success('Status updated');
    },
  });

  return (
    <CollapsibleWidget
      title="App Change Requests"
      icon={Lightbulb}
      headerExtra={newCount > 0 ? <Badge className="ml-2 bg-red-500 text-white">{newCount} new</Badge> : null}
    >
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="All staff" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All staff</SelectItem>
              {employees.map(e => <SelectItem key={e.email} value={e.email}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-40 h-8 text-xs" />
          {(filterEmployee !== 'all' || filterDate) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterEmployee('all'); setFilterDate(''); }}>Clear</Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No requests found.</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filtered.map(req => (
              <div key={req.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                  className="w-full flex items-start justify-between gap-2 p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    {expandedId === req.id ? <ChevronDown className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{req.title || (req.request_text || '').slice(0, 60) + '...'}</p>
                      <p className="text-xs text-muted-foreground">{req.submitted_by_name || req.submitted_by_email} · {formatDate(req.created_date)}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_CONFIG[req.status]?.color || STATUS_CONFIG.new.color}`}>
                    {STATUS_CONFIG[req.status]?.label || 'New'}
                  </span>
                </button>
                {expandedId === req.id && (
                  <div className="px-3 pb-3 space-y-2 border-t bg-muted/20">
                    {req.title && <p className="text-sm font-semibold pt-2">{req.title}</p>}
                    <p className="text-sm whitespace-pre-wrap">{req.request_text}</p>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-xs text-muted-foreground">Update status:</span>
                      <Select
                        value={req.status}
                        onValueChange={(val) => statusMutation.mutate({ id: req.id, status: val })}
                      >
                        <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsibleWidget>
  );
}