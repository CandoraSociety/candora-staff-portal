import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Phone, Mail, MapPin, Pencil, Plus, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/rc/StatusBadge';
import ParticipantFormCore from '@/components/empoweru/ParticipantFormCore';
import ServiceLogDialog from '@/components/empoweru/ServiceLogDialog';
import AccountSetupDialog from '@/components/empoweru/AccountSetupDialog';
import { REGISTRATION_STATUS_OPTIONS, ACCOUNT_SETUP_STATUS_OPTIONS, SERVICE_TYPE_LABELS } from '@/lib/empoweruConstants';

export default function EmpowerUParticipantDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);

  const { data: participant } = useQuery({ queryKey: ['empoweru-participant', id], queryFn: () => base44.entities.EmpowerUParticipant.get(id) });
  const { data: registrations = [] } = useQuery({ queryKey: ['empoweru-registrations-by-participant', id], queryFn: () => base44.entities.EmpowerURegistration.filter({ participant_id: id }) });
  const { data: serviceLogs = [] } = useQuery({ queryKey: ['empoweru-service-logs', id], queryFn: () => base44.entities.EmpowerUServiceLog.filter({ participant_id: id }) });
  const { data: accountSetups = [] } = useQuery({ queryKey: ['empoweru-account-setups-by-participant', id], queryFn: () => base44.entities.EmpowerUAccountSetup.filter({ participant_id: id }) });

  const openEdit = () => { setEditForm({ ...participant }); setEditOpen(true); };
  const update = (f, v) => setEditForm(prev => ({ ...prev, [f]: v }));

  const handleSaveEdit = async () => {
    try { await base44.entities.EmpowerUParticipant.update(id, editForm); queryClient.invalidateQueries({ queryKey: ['empoweru-participant', id] }); queryClient.invalidateQueries({ queryKey: ['empoweru-participants'] }); setEditOpen(false); toast({ title: 'Participant updated' }); }
    catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const invalidateAll = () => { queryClient.invalidateQueries({ queryKey: ['empoweru-service-logs', id] }); queryClient.invalidateQueries({ queryKey: ['empoweru-account-setups-by-participant', id] }); };

  if (!participant) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  const fullName = `${participant.first_name} ${participant.last_name}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/empoweru/participants"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
        <Button variant="outline" size="sm" onClick={openEdit}><Pencil className="h-4 w-4" /> Edit</Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center"><span className="text-primary font-bold text-lg">{participant.first_name?.[0]}{participant.last_name?.[0]}</span></div>
            <div><h1 className="text-xl font-heading font-bold text-foreground">{fullName}</h1></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {participant.phone && <p className="text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {participant.phone}</p>}
            {participant.email && <p className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {participant.email}</p>}
            {participant.city && <p className="text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {participant.city}</p>}
          </div>
          {participant.referral_source && <p className="text-xs text-muted-foreground mt-2">Referral source: {participant.referral_source}</p>}
        </CardContent>
      </Card>

      <Tabs defaultValue="registrations">
        <TabsList>
          <TabsTrigger value="registrations">Cohorts ({registrations.length})</TabsTrigger>
          <TabsTrigger value="account">Account Setup ({accountSetups.length})</TabsTrigger>
          <TabsTrigger value="services">Services ({serviceLogs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="registrations">
          <Card><CardHeader><CardTitle className="text-base">Cohort Registrations</CardTitle></CardHeader>
            <CardContent>{registrations.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No registrations</p> : (
              <div className="space-y-2">{registrations.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-md border border-border/50">
                  <div><Link to={`/empoweru/cohorts/${r.cohort_id}`} className="text-sm font-medium text-foreground hover:text-primary">{r.cohort_name}</Link><p className="text-xs text-muted-foreground">Registered: {new Date(r.registration_date).toLocaleDateString()}</p></div>
                  <StatusBadge status={r.status} options={REGISTRATION_STATUS_OPTIONS} />
                </div>
              ))}</div>
            )}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="account">
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Account Setup</CardTitle><Button size="sm" onClick={() => setAcctOpen(true)}><Plus className="h-4 w-4" /> Add</Button></CardHeader>
            <CardContent>{accountSetups.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No account setup records</p> : (
              <div className="space-y-2">{accountSetups.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-md border border-border/50">
                  <div><p className="text-sm font-medium text-foreground">{a.cohort_name}</p><p className="text-xs text-muted-foreground">{a.follow_up_attempts > 0 ? `${a.follow_up_attempts} contact attempts` : 'No contact yet'}{a.appointment_date ? ` · Appt: ${new Date(a.appointment_date).toLocaleDateString()}` : ''}</p></div>
                  <StatusBadge status={a.status} options={ACCOUNT_SETUP_STATUS_OPTIONS} />
                </div>
              ))}</div>
            )}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="services">
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Service History</CardTitle><Button size="sm" onClick={() => setServiceOpen(true)}><Plus className="h-4 w-4" /> Log Service</Button></CardHeader>
            <CardContent>{serviceLogs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No services logged</p> : (
              <div className="space-y-2">{serviceLogs.sort((a, b) => new Date(b.service_date) - new Date(a.service_date)).map(s => (
                <div key={s.id} className="p-3 rounded-md border border-border/50"><div className="flex items-center justify-between mb-1"><p className="text-sm font-medium text-foreground">{SERVICE_TYPE_LABELS[s.service_type] || s.service_type || 'Service'}</p><span className="text-xs text-muted-foreground">{new Date(s.service_date).toLocaleDateString()}</span></div>{s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}</div>
              ))}</div>
            )}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditOpen(false)}>
          <div className="bg-card rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Edit Participant</h2>
            <ParticipantFormCore form={editForm || {}} update={update} />
            <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={handleSaveEdit}>Save</Button></div>
          </div>
        </div>
      </Dialog>

      <ServiceLogDialog open={serviceOpen} onOpenChange={setServiceOpen} participantId={id} participantName={fullName} onSaved={() => { setServiceOpen(false); invalidateAll(); }} />
      <AccountSetupDialog open={acctOpen} onOpenChange={setAcctOpen} onSaved={() => { setAcctOpen(false); invalidateAll(); }} />
    </div>
  );
}