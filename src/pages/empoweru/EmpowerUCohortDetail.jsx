import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Pencil, Landmark, UserPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/rc/StatusBadge';
import CohortFormDialog from '@/components/empoweru/CohortFormDialog';
import RegistrationDialog from '@/components/empoweru/RegistrationDialog';
import { COHORT_STATUS_OPTIONS, REGISTRATION_STATUS_OPTIONS, DELIVERY_MODE_LABELS, ACCOUNT_SETUP_STATUS_OPTIONS, DEFAULT_SAVINGS_AMOUNT } from '@/lib/empoweruConstants';

export default function EmpowerUCohortDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [regOpen, setRegOpen] = useState(false);

  const { data: cohort } = useQuery({ queryKey: ['empoweru-cohort', id], queryFn: () => base44.entities.EmpowerUCohort.get(id) });
  const { data: registrations = [] } = useQuery({ queryKey: ['empoweru-registrations', id], queryFn: () => base44.entities.EmpowerURegistration.filter({ cohort_id: id }) });
  const { data: accountSetups = [] } = useQuery({ queryKey: ['empoweru-account-setups', id], queryFn: () => base44.entities.EmpowerUAccountSetup.filter({ cohort_id: id }) });

  const enrolledCount = registrations.filter(r => r.status === 'enrolled').length;
  const waitlistCount = registrations.filter(r => r.status === 'waitlisted').length;

  const handleStatusChange = async (regId, newStatus) => {
    try {
      await base44.entities.EmpowerURegistration.update(regId, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['empoweru-registrations', id] });
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const handleGenerateAccountSetups = async () => {
    const enrolled = registrations.filter(r => r.status === 'enrolled' || r.status === 'completed');
    const existingIds = new Set(accountSetups.map(a => a.participant_id));
    const missing = enrolled.filter(r => !existingIds.has(r.participant_id));
    if (missing.length === 0) { toast({ title: 'All enrolled participants already have account setup records' }); return; }
    try {
      await base44.entities.EmpowerUAccountSetup.bulkCreate(missing.map(r => ({
        participant_id: r.participant_id, participant_name: r.participant_name, participant_email: '', participant_phone: '',
        cohort_id: id, cohort_name: cohort?.name || '', status: 'not_started', savings_amount: DEFAULT_SAVINGS_AMOUNT,
        follow_up_attempts: 0,
      })));
      toast({ title: `Created ${missing.length} account setup record(s)` });
      queryClient.invalidateQueries({ queryKey: ['empoweru-account-setups', id] });
      queryClient.invalidateQueries({ queryKey: ['empoweru-account-setups'] });
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  if (!cohort) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/empoweru/cohorts"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setRegOpen(true)}><UserPlus className="h-4 w-4" /> Add Registration</Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Edit</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div><h1 className="text-xl font-heading font-bold text-foreground">{cohort.name}</h1><p className="text-sm text-muted-foreground mt-0.5">{cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'TBD'} → {cohort.end_date ? new Date(cohort.end_date).toLocaleDateString() : 'TBD'}</p></div>
            <StatusBadge status={cohort.status} options={COHORT_STATUS_OPTIONS} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Delivery</p><p className="font-medium">{DELIVERY_MODE_LABELS[cohort.delivery_mode] || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Capacity</p><p className="font-medium">{enrolledCount} / {cohort.capacity}</p></div>
            <div><p className="text-xs text-muted-foreground">Waitlist</p><p className="font-medium">{waitlistCount}</p></div>
            <div><p className="text-xs text-muted-foreground">Facilitator</p><p className="font-medium">{cohort.facilitator_name || '—'}</p></div>
          </div>
          {cohort.location && <p className="text-xs text-muted-foreground mt-2">Location: {cohort.location}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Participants ({registrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No registrations yet</p> : (
            <div className="space-y-2">{registrations.map(r => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <Link to={`/empoweru/participants/${r.participant_id}`} className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground hover:text-primary truncate">{r.participant_name}</p><p className="text-xs text-muted-foreground">Registered: {new Date(r.registration_date).toLocaleDateString()}{r.accommodation_needs ? ` · ${r.accommodation_needs}` : ''}</p></Link>
                <Select value={r.status} onValueChange={(v) => handleStatusChange(r.id, v)}>
                  <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{REGISTRATION_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Landmark className="h-4 w-4" /> Account Setup Progress ({accountSetups.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={handleGenerateAccountSetups}><Sparkles className="h-4 w-4" /> Generate Missing</Button>
        </CardHeader>
        <CardContent>
          {accountSetups.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No account setup records. Click "Generate Missing" to create them for enrolled participants.</p> : (
            <div className="space-y-2">{accountSetups.map(a => (
              <Link key={a.id} to="/empoweru/account-setup" className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div><p className="text-sm font-medium text-foreground">{a.participant_name}</p><p className="text-xs text-muted-foreground">{a.follow_up_attempts > 0 ? `${a.follow_up_attempts} contact attempts` : 'No contact yet'}{a.next_action_date ? ` · Due: ${new Date(a.next_action_date).toLocaleDateString()}` : ''}</p></div>
                <StatusBadge status={a.status} options={ACCOUNT_SETUP_STATUS_OPTIONS} />
              </Link>
            ))}</div>
          )}
        </CardContent>
      </Card>

      <CohortFormDialog open={editOpen} onOpenChange={setEditOpen} cohort={cohort} onSaved={() => { setEditOpen(false); queryClient.invalidateQueries({ queryKey: ['empoweru-cohort', id] }); queryClient.invalidateQueries({ queryKey: ['empoweru-cohorts'] }); }} />
      <RegistrationDialog open={regOpen} onOpenChange={setRegOpen} onSaved={() => { setRegOpen(false); queryClient.invalidateQueries({ queryKey: ['empoweru-registrations', id] }); }} />
    </div>
  );
}