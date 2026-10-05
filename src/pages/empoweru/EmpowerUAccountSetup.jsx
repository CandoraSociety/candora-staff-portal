import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AccountSetupDialog from '@/components/empoweru/AccountSetupDialog';
import AccountSetupProgressCard from '@/components/empoweru/AccountSetupProgressCard';
import { ACCOUNT_SETUP_STATUS_OPTIONS } from '@/lib/empoweruConstants';
import { parseDateSmart } from '@/lib/dateUtils';

export default function EmpowerUAccountSetup() {
  const [cohortFilter, setCohortFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: accountSetups = [], isLoading } = useQuery({
    queryKey: ['empoweru-account-setups', cohortFilter, statusFilter],
    queryFn: async () => {
      const query = {};
      if (cohortFilter !== 'all') query.cohort_id = cohortFilter;
      if (statusFilter !== 'all') query.status = statusFilter;
      const page = await base44.entities.EmpowerUAccountSetup.filter(query, { limit: 200 });
      return page.items || [];
    }
  });
  const { data: cohorts = [] } = useQuery({ queryKey: ['empoweru-cohorts'], queryFn: () => base44.entities.EmpowerUCohort.list() });
  const { data: statusCounts = {} } = useQuery({
    queryKey: ['empoweru-account-setup-counts'],
    queryFn: async () => {
      const res = await base44.entities.EmpowerUAccountSetup.aggregate({ groupBy: 'status' });
      return Object.fromEntries((res.rows || []).map(r => [r.status, r.count]));
    }
  });
  const today = new Date().toISOString().slice(0, 10);
  const { data: attentionCount = 0 } = useQuery({
    queryKey: ['empoweru-account-setup-attention', today],
    queryFn: () => base44.entities.EmpowerUAccountSetup.count({ status: { $nin: ['completed', 'declined'] }, $or: [{ next_action_date: { $lt: today } }, { follow_up_attempts: { $gte: 3 }, status: 'contacting' }] })
  });

  const counts = ACCOUNT_SETUP_STATUS_OPTIONS.map(s => ({ ...s, count: statusCounts[s.value] || 0 }));

  const openEdit = (r) => { setEditing(r); setDialogOpen(true); };
  const onSaved = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['empoweru-account-setups'] });
    queryClient.invalidateQueries({ queryKey: ['empoweru-account-setup-counts'] });
    queryClient.invalidateQueries({ queryKey: ['empoweru-account-setup-attention'] });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">ATB Account Setup</h1>
        <p className="text-muted-foreground text-sm mt-1">Track savings account setup for each participant</p>
      </div>

      {attentionCount > 0 && (
        <Card className="border-amber-300 bg-amber-50"><CardContent className="p-3 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-600" /><p className="text-sm text-amber-900"><span className="font-medium">{attentionCount}</span> need attention — overdue follow-ups or 3+ contact attempts</p></CardContent></Card>
      )}

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {counts.map(c => (
          <Card key={c.value} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(statusFilter === c.value ? 'all' : c.value)}>
            <CardContent className="p-2 text-center">
              <p className="text-lg font-bold" style={{ color: c.color }}>{c.count}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Select value={cohortFilter} onValueChange={setCohortFilter}><SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="All cohorts" /></SelectTrigger><SelectContent><SelectItem value="all">All cohorts</SelectItem>{cohorts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{ACCOUNT_SETUP_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       accountSetups.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{(cohortFilter !== 'all' || statusFilter !== 'all') ? 'No records match your filters.' : 'No account setup records yet — one is created automatically when a participant is enrolled in a cohort.'}</CardContent></Card> :
      (
        <div className="space-y-2">
          {accountSetups.slice().sort((a, b) => {
            const aDate = parseDateSmart(a.next_action_date) || new Date(9999, 0, 1);
            const bDate = parseDateSmart(b.next_action_date) || new Date(9999, 0, 1);
            return aDate - bDate;
          }).map(a => (
            <AccountSetupProgressCard key={a.id} record={a} onUpdated={onSaved} onEdit={() => openEdit(a)} />
          ))}
        </div>
      )}
      <AccountSetupDialog open={dialogOpen} onOpenChange={setDialogOpen} record={editing} onSaved={onSaved} />
    </div>
  );
}