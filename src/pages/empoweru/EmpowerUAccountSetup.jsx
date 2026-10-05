import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Phone, Clock, AlertCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import AccountSetupDialog from '@/components/empoweru/AccountSetupDialog';
import { ACCOUNT_SETUP_STATUS_OPTIONS } from '@/lib/empoweruConstants';
import { formatDate, parseDateSmart } from '@/lib/dateUtils';

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

  const now = new Date();
  const counts = ACCOUNT_SETUP_STATUS_OPTIONS.map(s => ({ ...s, count: statusCounts[s.value] || 0 }));

  const openEdit = (r) => { setEditing(r); setDialogOpen(true); };
  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const onSaved = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['empoweru-account-setups'] });
    queryClient.invalidateQueries({ queryKey: ['empoweru-account-setup-counts'] });
    queryClient.invalidateQueries({ queryKey: ['empoweru-account-setup-attention'] });
  };

  const getAttemptsColor = (n) => n === 0 ? '#64748b' : n <= 2 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">ATB Account Setup</h1><p className="text-muted-foreground text-sm mt-1">Track savings account setup for each participant</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New</Button>
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
          }).map(a => {
            const isOverdue = a.next_action_date && parseDateSmart(a.next_action_date) < now && !['completed', 'declined'].includes(a.status);
            const isHighAttempts = (a.follow_up_attempts || 0) >= 3 && a.status === 'contacting';
            return (
              <Card key={a.id} className={`hover:shadow-sm transition-shadow ${(isOverdue || isHighAttempts) ? 'border-amber-300' : ''}`}>
                <CardContent className="p-3 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1"><p className="font-medium text-sm text-foreground truncate">{a.participant_name}</p><StatusBadge status={a.status} options={ACCOUNT_SETUP_STATUS_OPTIONS} /></div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{a.cohort_name}</span>
                      {a.follow_up_attempts > 0 && <span className="flex items-center gap-0.5" style={{ color: getAttemptsColor(a.follow_up_attempts) }}><Phone className="h-3 w-3" /> {a.follow_up_attempts} attempts</span>}
                      {a.last_contact_attempt_date && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {formatDate(a.last_contact_attempt_date)}</span>}
                      {a.next_action_date && <span className={isOverdue ? 'text-red-600 font-medium' : ''}>Due: {formatDate(a.next_action_date)}</span>}
                      {a.appointment_date && <span>Appt: {formatDate(a.appointment_date)}</span>}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <AccountSetupDialog open={dialogOpen} onOpenChange={setDialogOpen} record={editing} onSaved={onSaved} />
    </div>
  );
}