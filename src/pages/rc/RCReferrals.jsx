import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReferralDialog from '@/components/rc/ReferralDialog';
import StatusBadge from '@/components/rc/StatusBadge';
import { REFERRAL_STATUS_OPTIONS, REFERRAL_DIRECTION_LABELS, REFERRAL_SOURCE_LABELS } from '@/lib/rcConstants';

export default function RCReferrals() {
  const [search, setSearch] = useState('');
  const [dirFilter, setDirFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: referrals = [], isLoading } = useQuery({ queryKey: ['rc-referrals'], queryFn: () => base44.entities.RCReferral.list('-referral_date', 200) });

  const filtered = referrals.filter(r => {
    const matchSearch = (r.client_name || '').toLowerCase().includes(search.toLowerCase()) || (r.organization || '').toLowerCase().includes(search.toLowerCase());
    const matchDir = dirFilter === 'all' || r.direction === dirFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchDir && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Referrals</h1><p className="text-muted-foreground text-sm mt-1">Incoming and outgoing referrals (internal and external)</p></div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> New Referral</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by client or organization..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={dirFilter} onValueChange={setDirFilter}><SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="All directions" /></SelectTrigger><SelectContent><SelectItem value="all">All directions</SelectItem><SelectItem value="incoming">Incoming</SelectItem><SelectItem value="outgoing">Outgoing</SelectItem></SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{REFERRAL_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
      </div>
      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{referrals.length === 0 ? 'No referrals yet.' : 'No referrals match your filters.'}</CardContent></Card> :
      (
        <div className="space-y-2">
          {filtered.map(r => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow"><CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: r.direction === 'incoming' ? '#22c55e15' : '#3b82f615' }}>
                  {r.direction === 'incoming' ? <ArrowDownLeft className="h-4 w-4 text-green-600" /> : <ArrowUpRight className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5"><p className="font-medium text-sm text-foreground truncate">{r.client_name}</p><StatusBadge status={r.status} options={REFERRAL_STATUS_OPTIONS} /></div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{REFERRAL_DIRECTION_LABELS[r.direction]} · {REFERRAL_SOURCE_LABELS[r.source_type]}</span>
                    {r.organization && <span>{r.organization}</span>}
                    {r.service_program && <span>{r.service_program}</span>}
                    <span>{new Date(r.referral_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
      <ReferralDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['rc-referrals'] }); }} />
    </div>
  );
}