import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReferralFormDialog from '@/components/frn/ReferralFormDialog';
import StatusBadge from '@/components/frn/StatusBadge';
import { FRN_PROGRAMS, PROGRAM_LABELS, REFERRAL_STATUS_OPTIONS, REFERRAL_SOURCE_LABELS } from '@/lib/frnConstants';

export default function FRNIntake() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['frn-referrals'],
    queryFn: () => base44.entities.FRNReferral.list('-referral_date', 200),
  });

  const filtered = referrals.filter(r => {
    const matchSearch = (r.participant_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (r.referring_person_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchProgram = programFilter === 'all' || r.program === programFilter;
    return matchSearch && matchStatus && matchProgram;
  });

  const handleSaved = () => { queryClient.invalidateQueries({ queryKey: ['frn-referrals'] }); setDialogOpen(false); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Intake & Referrals</h1>
          <p className="text-muted-foreground text-sm mt-1">Track referrals through the intake and assessment workflow</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> New Referral</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by participant or referrer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All programs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All programs</SelectItem>
            {FRN_PROGRAMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {REFERRAL_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          {referrals.length === 0 ? 'No referrals yet. Click "New Referral" to get started.' : 'No referrals match your filters.'}
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm text-foreground truncate">{r.participant_name}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{PROGRAM_LABELS[r.program] || r.program}</span>
                    <span>{REFERRAL_SOURCE_LABELS[r.referral_source]}</span>
                    {r.referring_organization && <span>{r.referring_organization}</span>}
                    {r.referral_date && <span>{new Date(r.referral_date).toLocaleDateString()}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReferralFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={handleSaved} />
    </div>
  );
}