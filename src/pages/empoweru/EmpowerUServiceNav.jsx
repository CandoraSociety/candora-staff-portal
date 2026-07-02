import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ServiceLogDialog from '@/components/empoweru/ServiceLogDialog';
import { SERVICE_TYPE_OPTIONS, SERVICE_TYPE_LABELS } from '@/lib/empoweruConstants';

export default function EmpowerUServiceNav() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({ queryKey: ['empoweru-service-logs'], queryFn: () => base44.entities.EmpowerUServiceLog.list('-service_date', 200) });

  const filtered = logs.filter(l => {
    const matchSearch = (l.participant_name || '').toLowerCase().includes(search.toLowerCase()) || (l.description || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || l.service_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Service Navigation</h1><p className="text-muted-foreground text-sm mt-1">Service navigation and support logs</p></div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Log Service</Button>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by participant or description..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All types" /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{SERVICE_TYPE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
      </div>
      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{logs.length === 0 ? 'No service logs yet.' : 'No matches.'}</CardContent></Card> :
      (
        <div className="space-y-2">{filtered.map(l => (
          <Card key={l.id} className="hover:shadow-sm transition-shadow"><CardContent className="p-3">
            <div className="flex items-center justify-between mb-1"><p className="font-medium text-sm text-foreground">{l.participant_name}</p><span className="text-xs text-muted-foreground">{new Date(l.service_date).toLocaleDateString()}</span></div>
            <p className="text-xs text-muted-foreground mb-1">{SERVICE_TYPE_LABELS[l.service_type] || l.service_type}{l.worker_name ? ` · ${l.worker_name}` : ''}{l.cohort_name ? ` · ${l.cohort_name}` : ''}</p>
            {l.description && <p className="text-sm text-foreground">{l.description}</p>}
            {l.follow_up_needed && <p className="text-xs text-amber-600 mt-1">Follow-up needed{l.follow_up_date ? `: ${new Date(l.follow_up_date).toLocaleDateString()}` : ''}</p>}
          </CardContent></Card>
        ))}</div>
      )}
      <ServiceLogDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['empoweru-service-logs'] }); }} />
    </div>
  );
}