import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Phone, Mail, MapPin, Pencil, Plus, Calendar, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/rc/StatusBadge';
import ClientFormCore from '@/components/rc/ClientFormCore';
import ServiceLogDialog from '@/components/rc/ServiceLogDialog';
import ReferralDialog from '@/components/rc/ReferralDialog';
import AppointmentDialog from '@/components/rc/AppointmentDialog';
import { CASE_STATUS_OPTIONS, FUNDER_CATEGORIES, SERVICE_TYPE_LABELS, APPOINTMENT_STATUS_OPTIONS, REFERRAL_STATUS_OPTIONS, REFERRAL_DIRECTION_LABELS, IS_PHAC } from '@/lib/rcConstants';

const EMPTY_FORM = {};

export default function RCClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [serviceLogOpen, setServiceLogOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);

  const { data: client, isLoading } = useQuery({ queryKey: ['rc-client', id], queryFn: () => base44.entities.RCClient.get(id) });
  const { data: serviceLogs = [] } = useQuery({ queryKey: ['rc-service-logs', id], queryFn: () => base44.entities.RCServiceLog.filter({ client_id: id }) });
  const { data: appointments = [] } = useQuery({ queryKey: ['rc-appointments', id], queryFn: () => base44.entities.RCAppointment.filter({ client_id: id }) });
  const { data: referrals = [] } = useQuery({ queryKey: ['rc-referrals', id], queryFn: () => base44.entities.RCReferral.filter({ client_id: id }) });

  const phac = IS_PHAC(client);

  const openEdit = () => { setEditForm({ ...client }); setEditOpen(true); };
  const update = (field, value) => setEditForm(prev => ({ ...prev, [field]: value }));

  const handleSaveEdit = async () => {
    try {
      await base44.entities.RCClient.update(id, editForm);
      queryClient.invalidateQueries({ queryKey: ['rc-client', id] });
      queryClient.invalidateQueries({ queryKey: ['rc-clients'] });
      setEditOpen(false);
      toast({ title: 'Client updated' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['rc-service-logs', id] });
    queryClient.invalidateQueries({ queryKey: ['rc-appointments', id] });
    queryClient.invalidateQueries({ queryKey: ['rc-referrals', id] });
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  if (!client) return <div className="text-center py-8"><p className="text-muted-foreground">Client not found</p><Link to="/rc/clients"><Button variant="outline" className="mt-4">Back to Database</Button></Link></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/rc/clients"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
        <Button variant="outline" size="sm" onClick={openEdit}><Pencil className="h-4 w-4" /> Edit</Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center"><span className="text-primary font-bold text-lg">{client.first_name?.[0]}{client.last_name?.[0]}</span></div>
              <div>
                <h1 className="text-xl font-heading font-bold text-foreground">{client.first_name} {client.last_name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={client.case_status} options={CASE_STATUS_OPTIONS} />
                  {client.assigned_worker && <span className="text-xs text-muted-foreground">Worker: {client.assigned_worker}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 justify-end">
              {(client.funder_categories || []).map(f => {
                const fc = FUNDER_CATEGORIES.find(x => x.value === f);
                return fc ? <span key={f} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: fc.color + '20', color: fc.color }}>{fc.label}</span> : null;
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {client.phone && <p className="text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {client.phone}</p>}
            {client.email && <p className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {client.email}</p>}
            {client.address && <p className="text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {client.city || ''}</p>}
            {client.date_of_birth && <p className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(client.date_of_birth).toLocaleDateString()}</p>}
          </div>
          {phac && (
            <div className="mt-3 p-3 rounded-lg bg-sky-50 border border-sky-200">
              <p className="text-sm font-medium text-sky-900 flex items-center gap-1.5"><Baby className="h-4 w-4" /> PHAC Caregiver Capacity</p>
              <p className="text-xs text-sky-700 mt-0.5">Children 0-6: {client.has_children_0_6 ? `Yes (${client.children_count_0_6 || '?'})` : 'Not specified'} {client.children_ages_detail ? `— ${client.children_ages_detail}` : ''}</p>
            </div>
          )}
          {client.presenting_needs && <div className="mt-3 pt-3 border-t border-border/50"><p className="text-xs text-muted-foreground mb-0.5">Presenting Needs</p><p className="text-sm text-foreground">{client.presenting_needs}</p></div>}
        </CardContent>
      </Card>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Service History ({serviceLogs.length})</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({appointments.length})</TabsTrigger>
          <TabsTrigger value="referrals">Referrals ({referrals.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="services">
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Service History</CardTitle><Button size="sm" onClick={() => setServiceLogOpen(true)}><Plus className="h-4 w-4" /> Log Service</Button></CardHeader>
            <CardContent>{serviceLogs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No services logged yet</p> : (
              <div className="space-y-2">{serviceLogs.sort((a, b) => new Date(b.service_date) - new Date(a.service_date)).map(s => (
                <div key={s.id} className="p-3 rounded-md border border-border/50">
                  <div className="flex items-center justify-between mb-1"><p className="text-sm font-medium text-foreground">{SERVICE_TYPE_LABELS[s.service_type] || s.service_type || 'Service'}</p><span className="text-xs text-muted-foreground">{new Date(s.service_date).toLocaleDateString()}</span></div>
                  {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">{s.worker_name && <span>Worker: {s.worker_name}</span>}{s.duration_minutes > 0 && <span>{s.duration_minutes} min</span>}{s.funder_category && <span>Funder: {FUNDER_CATEGORIES.find(f => f.value === s.funder_category)?.label}</span>}{s.follow_up_needed && <span className="text-amber-600">Follow-up: {s.follow_up_date || 'needed'}</span>}</div>
                </div>
              ))}</div>
            )}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appointments">
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Appointments</CardTitle><Button size="sm" onClick={() => setApptOpen(true)}><Plus className="h-4 w-4" /> Schedule</Button></CardHeader>
            <CardContent>{appointments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No appointments yet</p> : (
              <div className="space-y-2">{appointments.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date)).map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-md border border-border/50">
                  <div><p className="text-sm font-medium text-foreground">{new Date(a.appointment_date).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p><p className="text-xs text-muted-foreground">{a.purpose || 'No purpose specified'}</p></div>
                  <StatusBadge status={a.status} options={APPOINTMENT_STATUS_OPTIONS} />
                </div>
              ))}</div>
            )}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="referrals">
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Referrals</CardTitle><Button size="sm" onClick={() => setReferralOpen(true)}><Plus className="h-4 w-4" /> New Referral</Button></CardHeader>
            <CardContent>{referrals.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No referrals yet</p> : (
              <div className="space-y-2">{referrals.sort((a, b) => new Date(b.referral_date) - new Date(a.referral_date)).map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-md border border-border/50">
                  <div><p className="text-sm font-medium text-foreground capitalize">{REFERRAL_DIRECTION_LABELS[r.direction]} — {r.organization || r.service_program || 'N/A'}</p><p className="text-xs text-muted-foreground">{new Date(r.referral_date).toLocaleDateString()}{r.reason ? ` · ${r.reason}` : ''}</p></div>
                  <StatusBadge status={r.status} options={REFERRAL_STATUS_OPTIONS} />
                </div>
              ))}</div>
            )}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditOpen(false)}>
          <div className="bg-card rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Edit Client</h2>
            <ClientFormCore form={editForm} update={update} />
            <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={handleSaveEdit}>Save</Button></div>
          </div>
        </div>
      </Dialog>

      <ServiceLogDialog open={serviceLogOpen} onOpenChange={setServiceLogOpen} clientId={id} clientName={`${client.first_name} ${client.last_name}`} onSaved={() => { setServiceLogOpen(false); invalidateAll(); }} />
      <AppointmentDialog open={apptOpen} onOpenChange={setApptOpen} clientId={id} clientName={`${client.first_name} ${client.last_name}`} clientEmail={client.email} onSaved={() => { setApptOpen(false); invalidateAll(); }} />
      <ReferralDialog open={referralOpen} onOpenChange={setReferralOpen} clientId={id} clientName={`${client.first_name} ${client.last_name}`} onSaved={() => { setReferralOpen(false); invalidateAll(); }} />
    </div>
  );
}