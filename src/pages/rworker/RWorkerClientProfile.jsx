import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Phone, Mail, MapPin, CalendarPlus, Route, Plus, ClipboardList, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import StatusBadge from '@/components/rc/StatusBadge';
import ClientNotesSection from '@/components/rc/ClientNotesSection';
import AppointmentDialog from '@/components/rc/AppointmentDialog';
import ReferralDialog from '@/components/rc/ReferralDialog';
import ExternalReferralDialog from '@/components/rc/ExternalReferralDialog';
import ReferralToProgramDialog from '@/components/referrals/ReferralToProgramDialog';
import ServiceLogDialog from '@/components/rc/ServiceLogDialog';
import { STAGE_LABELS } from '@/components/rc/intensive/caseConstants';
import { CASE_STATUS_OPTIONS, APPOINTMENT_STATUS_OPTIONS, REFERRAL_STATUS_OPTIONS, REFERRAL_DIRECTION_LABELS, SERVICE_TYPE_LABELS, FUNDER_CATEGORIES } from '@/lib/rcConstants';

// Resource Worker client profile — the client's activity in one place, with
// scheduling, referral and service logging one click from the top of the page.
export default function RWorkerClientProfile() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [apptOpen, setApptOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [extRefOpen, setExtRefOpen] = useState(false);
  const [programRefOpen, setProgramRefOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);

  const { data: client, isLoading } = useQuery({ queryKey: ['rc-client', id], queryFn: () => base44.entities.RCClient.get(id) });
  const { data: serviceLogs = [] } = useQuery({ queryKey: ['rc-service-logs', id], queryFn: () => base44.entities.RCServiceLog.filter({ client_id: id }) });
  const { data: appointments = [] } = useQuery({ queryKey: ['rc-appointments', id], queryFn: () => base44.entities.RCAppointment.filter({ client_id: id }) });
  const { data: referrals = [] } = useQuery({ queryKey: ['rc-referrals', id], queryFn: () => base44.entities.RCReferral.filter({ client_id: id }) });
  const { data: notes = [] } = useQuery({ queryKey: ['rc-client-notes', id], queryFn: () => base44.entities.RCClientNote.filter({ client_id: id }) });
  const { data: intensiveCases = [] } = useQuery({ queryKey: ['rw-intensive-case', id], queryFn: () => base44.entities.IntensiveCase.filter({ client_id: id }) });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['rc-service-logs', id] });
    queryClient.invalidateQueries({ queryKey: ['rc-appointments', id] });
    queryClient.invalidateQueries({ queryKey: ['rc-referrals', id] });
    queryClient.invalidateQueries({ queryKey: ['rc-client', id] });
  };
  const invalidateNotes = () => queryClient.invalidateQueries({ queryKey: ['rc-client-notes', id] });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  if (!client) return <div className="text-center py-8"><p className="text-muted-foreground">Client not found</p><Link to="/rworker/case-management"><Button variant="outline" className="mt-4">Back to Case Management</Button></Link></div>;

  const clientName = `${client.first_name} ${client.last_name}`;
  const visitDates = [
    ...serviceLogs.map((s) => s.service_date).filter(Boolean),
    ...appointments.filter((a) => a.appointment_date && new Date(a.appointment_date) <= new Date()).map((a) => a.appointment_date),
  ];
  const lastVisit = visitDates.length ? new Date(Math.max(...visitDates.map((d) => new Date(d).getTime()))).toLocaleDateString() : '—';
  const intensiveCase = intensiveCases[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/rworker/case-management"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Case Management</Button></Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setServiceOpen(true)}><Plus className="h-4 w-4" /> Log Visit / Service</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Route className="h-4 w-4" /> Referral <ChevronDown className="h-3.5 w-3.5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setProgramRefOpen(true)}>Refer to a Candora program</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExtRefOpen(true)}>Record external referral</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRefOpen(true)}>Record incoming referral</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => setApptOpen(true)}><CalendarPlus className="h-4 w-4" /> Schedule Appointment</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-lg">{client.first_name?.[0]}{client.last_name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-heading font-bold text-foreground">{clientName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <StatusBadge status={client.case_status} options={CASE_STATUS_OPTIONS} />
                {client.assigned_worker && <span className="text-xs text-muted-foreground">Worker: {client.assigned_worker}</span>}
                {client.service_category && (
                  <span className="text-xs text-muted-foreground capitalize">{client.service_category.replace(/_/g, ' ')}</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-4">
            {client.phone && <p className="text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {client.phone}</p>}
            {client.email && <p className="text-muted-foreground flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5" /> {client.email}</p>}
            {client.city && <p className="text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {client.city}</p>}
            <p className="text-muted-foreground">Last visit: {lastVisit}</p>
            <p className="text-muted-foreground">Visits: {client.visit_count || 0}</p>
          </div>

          {intensiveCase && (
            <div className="mt-4 p-3 rounded-lg bg-sky-50 border border-sky-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-sky-900 flex items-center gap-1.5"><ClipboardList className="h-4 w-4" /> Intensive Services Case</p>
                <p className="text-xs text-sky-700 mt-0.5">
                  Stage: {STAGE_LABELS[intensiveCase.current_stage] || intensiveCase.current_stage || '—'}
                  {Array.isArray(intensiveCase.tasks) ? ` · ${intensiveCase.tasks.filter((t) => t.status !== 'done').length} open tasks` : ''}
                </p>
              </div>
              <Link to={`/rc/case-management?client=${client.id}`}><Button variant="outline" size="sm">Open case file</Button></Link>
            </div>
          )}

          <ClientNotesSection notes={notes} onChanged={invalidateNotes} />
        </CardContent>
      </Card>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Service History ({serviceLogs.length})</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({appointments.length})</TabsTrigger>
          <TabsTrigger value="referrals">Referrals ({referrals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Service History</CardTitle>
              <Button size="sm" onClick={() => setServiceOpen(true)}><Plus className="h-4 w-4" /> Log Service</Button>
            </CardHeader>
            <CardContent>
              {serviceLogs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No services logged yet</p> : (
                <div className="space-y-2">
                  {[...serviceLogs].sort((a, b) => new Date(b.service_date) - new Date(a.service_date)).map((s) => (
                    <div key={s.id} className="p-3 rounded-md border border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-foreground">{SERVICE_TYPE_LABELS[s.service_type] || s.service_type || 'Service'}</p>
                        <span className="text-xs text-muted-foreground">{new Date(s.service_date).toLocaleDateString()}</span>
                      </div>
                      {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        {s.worker_name && <span>Worker: {s.worker_name}</span>}
                        {s.duration_minutes > 0 && <span>{s.duration_minutes} min</span>}
                        {s.funder_category && <span>Funder: {FUNDER_CATEGORIES.find((f) => f.value === s.funder_category)?.label}</span>}
                        {s.follow_up_needed && <span className="text-amber-600">Follow-up: {s.follow_up_date || 'needed'}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Appointments</CardTitle>
              <Button size="sm" onClick={() => setApptOpen(true)}><CalendarPlus className="h-4 w-4" /> Schedule</Button>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No appointments yet</p> : (
                <div className="space-y-2">
                  {[...appointments].sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date)).map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-md border border-border/50">
                      <div>
                        <p className="text-sm font-medium text-foreground">{new Date(a.appointment_date).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                        <p className="text-xs text-muted-foreground">{a.purpose || 'No purpose specified'}</p>
                      </div>
                      <StatusBadge status={a.status} options={APPOINTMENT_STATUS_OPTIONS} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Referrals</CardTitle>
              <Button size="sm" onClick={() => setRefOpen(true)}><Plus className="h-4 w-4" /> New Referral</Button>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No referrals yet</p> : (
                <div className="space-y-2">
                  {[...referrals].sort((a, b) => new Date(b.referral_date) - new Date(a.referral_date)).map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-md border border-border/50">
                      <div>
                        <p className="text-sm font-medium text-foreground capitalize">{REFERRAL_DIRECTION_LABELS[r.direction]} — {r.organization || r.service_program || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.referral_date).toLocaleDateString()}{r.reason ? ` · ${r.reason}` : ''}</p>
                      </div>
                      <StatusBadge status={r.status} options={REFERRAL_STATUS_OPTIONS} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AppointmentDialog open={apptOpen} onOpenChange={setApptOpen} clientId={id} clientName={clientName} clientEmail={client.email} onSaved={() => { setApptOpen(false); invalidate(); }} />
      <ServiceLogDialog open={serviceOpen} onOpenChange={setServiceOpen} clientId={id} clientName={clientName} onSaved={() => { setServiceOpen(false); invalidate(); }} />
      <ReferralDialog open={refOpen} onOpenChange={setRefOpen} clientId={id} clientName={clientName} onSaved={() => { setRefOpen(false); invalidate(); }} />
      <ExternalReferralDialog open={extRefOpen} onOpenChange={setExtRefOpen} clientId={id} clientName={clientName} onSaved={() => { setExtRefOpen(false); invalidate(); }} />
      <ReferralToProgramDialog
        open={programRefOpen}
        onOpenChange={setProgramRefOpen}
        person={{ name: clientName, rcClientId: client.id, phone: client.phone, email: client.email }}
        sourceLabel="Candora Central Database"
      />
    </div>
  );
}