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

export default function EmpowerUAccountSetup() {
  const [cohortFilter, setCohortFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: accountSetups = [], isLoading } = useQuery({ queryKey: ['empoweru-account-setups'], queryFn: () => base44.entities.EmpowerUAccountSetup.list() });
  const { data: cohorts = [] } = useQuery({ queryKey: ['empoweru-cohorts'], queryFn: () => base44.entities.EmpowerUCohort.list() });

  const now = new Date();
  const filtered = accountSetups.filter(a => {
    const matchCohort = cohortFilter === 'all' || a.cohort_id === cohortFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchCohort && matchStatus;
  });

  const counts = ACCOUNT_SETUP_STATUS_OPTIONS.map(s => ({ ...s, count: accountSetups.filter(a => a.status === s.value).length }));
  const needsAttention = accountSetups.filter(a => {
    if (['completed', 'declined'].includes(a.status)) return false;
    if (a.next_action_date && new Date(a.next_action_date) < now) return true;
    if ((a.follow_up_attempts || 0) >= 3 && a.status === 'contacting') return true;
    return false;
  });

  const openEdit = (r) => { setEditing(r); setDialogOpen(true); };
  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const onSaved = () => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['empoweru-account-setups'] }); };

  const getAttemptsColor = (n) => n === 0 ? '#64748b' : n <= 2 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">ATB Account Setup</h1><p className="text-muted-foreground text-sm mt-1">Track savings account setup for each participant</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New</Button>
      </div>

      {needsAttention.length > 0 && (
        <Card className="border-amber-300 bg-amber-50"><CardContent className="p-3 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-600" /><p className="text-sm text-amber-900"><span className="font-medium">{needsAttention.length}</span> need attention — overdue follow-ups or 3+ contact attempts</p></CardContent></Card>
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
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{accountSetups.length === 0 ? 'No account setup records yet.' : 'No records match your filters.'}</CardContent></Card> :
      (
        <div className="space-y-2">
          {filtered.sort((a, b) => {
            const aDate = a.next_action_date ? new Date(a.next_action_date) : new Date(9999, 0, 1);
            const bDate = b.next_action_date ? new Date(b.next_action_date) : new Date(9999, 0, 1);
            return aDate - bDate;
          }).map(a => {
            const isOverdue = a.next_action_date && new Date(a.next_action_date) < now && !['completed', 'declined'].includes(a.status);
            const isHighAttempts = (a.follow_up_attempts || 0) >= 3 && a.status === 'contacting';
            return (
              <Card key={a.id} className={`hover:shadow-sm transition-shadow ${(isOverdue || isHighAttempts) ? 'border-amber-300' : ''}`}>
                <CardContent className="p-3 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1"><p className="font-medium text-sm text-foreground truncate">{a.participant_name}</p><StatusBadge status={a.status} options={ACCOUNT_SETUP_STATUS_OPTIONS} /></div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{a.cohort_name}</span>
                      {a.follow_up_attempts > 0 && <span className="flex items-center gap-0.5" style={{ color: getAttemptsColor(a.follow_up_attempts) }}><Phone className="h-3 w-3" /> {a.follow_up_attempts} attempts</span>}
                      {a.last_contact_attempt_date && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {new Date(a.last_contact_attempt_date).toLocaleDateString()}</span>}
                      {a.next_action_date && <span className={isOverdue ? 'text-red-600 font-medium' : ''}>Due: {new Date(a.next_action_date).toLocaleDateString()}</span>}
                      {a.appointment_date && <span>Appt: {new Date(a.appointment_date).toLocaleDateString()}</span>}
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