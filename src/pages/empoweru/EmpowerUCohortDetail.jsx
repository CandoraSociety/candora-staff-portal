import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Pencil, Landmark, UserPlus, Sparkles, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/rc/StatusBadge';
import CohortFormDialog from '@/components/empoweru/CohortFormDialog';
import RegistrationDialog from '@/components/empoweru/RegistrationDialog';
import EmpowerUApplicationsPanel from '@/components/empoweru/EmpowerUApplicationsPanel';
import ParticipantProgressDialog from '@/components/empoweru/ParticipantProgressDialog';
import { ALL_CHECKPOINTS, progressOf, outstandingPreProgram, isPreProgramComplete } from '@/lib/empoweruProgress';
import { COHORT_STATUS_OPTIONS, REGISTRATION_STATUS_OPTIONS, DELIVERY_MODE_LABELS, ACCOUNT_SETUP_STATUS_OPTIONS } from '@/lib/empoweruConstants';
import { formatDate } from '@/lib/dateUtils';

export default function EmpowerUCohortDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [regOpen, setRegOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);

  const { data: cohort } = useQuery({ queryKey: ['empoweru-cohort', id], queryFn: () => base44.entities.EmpowerUCohort.get(id) });
  const { data: registrations = [] } = useQuery({ queryKey: ['empoweru-registrations', id], queryFn: () => base44.entities.EmpowerURegistration.filter({ cohort_id: id }) });
  const { data: accountSetups = [] } = useQuery({ queryKey: ['empoweru-account-setups', id], queryFn: () => base44.entities.EmpowerUAccountSetup.filter({ cohort_id: id }) });
  const participantIds = registrations.map(r => r.participant_id).filter(Boolean);
  const { data: cohortParticipants = [] } = useQuery({ queryKey: ['empoweru-participants-by-ids', participantIds], queryFn: () => base44.entities.EmpowerUParticipant.filter({ id: { $in: participantIds } }), enabled: participantIds.length > 0 });
  const participantMap = Object.fromEntries(cohortParticipants.map(p => [p.id, p]));

  const enrolledCount = registrations.filter(r => r.status === 'enrolled').length;
  const waitlistCount = registrations.filter(r => r.status === 'waitlisted').length;
  const activeRegs = registrations.filter(r => r.status === 'enrolled');
  const preProgramCompleteCount = activeRegs.filter(isPreProgramComplete).length;
  const withOutstandingStepsCount = activeRegs.filter(r => ALL_CHECKPOINTS.some(c => !r[c.key])).length;

  const handleStatusChange = async (regId, newStatus) => {
    try {
      await base44.entities.EmpowerURegistration.update(regId, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['empoweru-registrations', id] });
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const handleGenerateAccountSetups = async () => {
    try {
      const res = await base44.functions.invoke('ensureEmpowerUAccountSetups', { cohort_id: id });
      const created = res.data?.created || 0;
      toast({ title: created > 0 ? `Created ${created} account setup record(s)` : 'All enrolled participants already have account setup records' });
      queryClient.invalidateQueries({ queryKey: ['empoweru-account-setups'] });
      queryClient.invalidateQueries({ queryKey: ['empoweru-account-setup-counts'] });
      queryClient.invalidateQueries({ queryKey: ['empoweru-account-setup-attention'] });
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
            <div><h1 className="text-xl font-heading font-bold text-foreground">{cohort.name}</h1><p className="text-sm text-muted-foreground mt-0.5">{cohort.start_date ? formatDate(cohort.start_date) : 'TBD'} → {cohort.end_date ? formatDate(cohort.end_date) : 'TBD'}</p></div>
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

      <EmpowerUApplicationsPanel cohort={cohort} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Participants ({registrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
            <span>Active participants: <span className="font-medium text-foreground">{activeRegs.length}</span></span>
            <span>Pre-program setup complete: <span className="font-medium text-foreground">{preProgramCompleteCount}</span></span>
            <span>Program/completion steps outstanding: <span className="font-medium text-foreground">{withOutstandingStepsCount}</span></span>
          </div>
          {registrations.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No registrations yet</p> : (
            <div className="space-y-2">{registrations.map(r => {
              const isActive = r.status === 'enrolled';
              const p = participantMap[r.participant_id];
              const prog = progressOf(r);
              const preOutstanding = outstandingPreProgram(r);
              return (
                <div key={r.id}
                  className={`flex items-center justify-between gap-3 p-2 rounded-md border ${isActive ? 'border-border/60 cursor-pointer hover:border-primary/40 hover:bg-muted/50' : 'border-transparent hover:bg-muted/50'}`}
                  onClick={isActive ? () => setSelectedReg(r) : undefined}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.participant_name}</p>
                    {isActive ? (
                      <>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          <Phone className="inline h-3 w-3 mr-0.5" />{p?.phone || 'No phone'}
                          <Mail className="inline h-3 w-3 ml-2 mr-0.5" />{p?.email || 'No email'}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-success/15 text-success">{prog.completed}/{prog.total} checkpoints</span>
                          {preOutstanding.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-foreground">Needs: {preOutstanding.join(', ')}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">Registered: {formatDate(r.registration_date)}{r.accommodation_needs ? ` · ${r.accommodation_needs}` : ''}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Select value={r.status} onValueChange={(v) => handleStatusChange(r.id, v)}>
                      <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{REGISTRATION_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}</div>
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
                <div><p className="text-sm font-medium text-foreground">{a.participant_name}</p><p className="text-xs text-muted-foreground">{a.follow_up_attempts > 0 ? `${a.follow_up_attempts} contact attempts` : 'No contact yet'}{a.next_action_date ? ` · Due: ${formatDate(a.next_action_date)}` : ''}</p></div>
                <StatusBadge status={a.status} options={ACCOUNT_SETUP_STATUS_OPTIONS} />
              </Link>
            ))}</div>
          )}
        </CardContent>
      </Card>

      {selectedReg && (
        <ParticipantProgressDialog
          open
          onOpenChange={(o) => !o && setSelectedReg(null)}
          registration={selectedReg}
          participant={participantMap[selectedReg.participant_id]}
          cohortName={cohort?.name}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['empoweru-registrations', id] })}
        />
      )}

      <CohortFormDialog open={editOpen} onOpenChange={setEditOpen} cohort={cohort} onSaved={() => { setEditOpen(false); queryClient.invalidateQueries({ queryKey: ['empoweru-cohort', id] }); queryClient.invalidateQueries({ queryKey: ['empoweru-cohorts'] }); }} />
      <RegistrationDialog open={regOpen} onOpenChange={setRegOpen} onSaved={() => { setRegOpen(false); queryClient.invalidateQueries({ queryKey: ['empoweru-registrations', id] }); }} />
    </div>
  );
}