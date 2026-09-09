import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ClipboardList, History, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/rc/StatusBadge';
import { CASE_STATUS_OPTIONS, SERVICE_TYPE_OPTIONS } from '@/lib/rcConstants';
import ServiceLogDialog from '@/components/rc/ServiceLogDialog';
import NeedBarrierDialog, { NEED_CATEGORY_OPTIONS, NEED_STATUS_OPTIONS } from '@/components/rc/NeedBarrierDialog';
import GeneralClientCalendar from '@/components/rc/GeneralClientCalendar';
import { today } from '@/components/rc/intensive/caseConstants';
import { useAuth } from '@/lib/AuthContext';
import { matchesWorker } from '@/lib/rcCaseAccess';

const typeLabel = (v) => (SERVICE_TYPE_OPTIONS || []).find(o => o.value === v)?.label || v || '—';
const needCategoryLabel = (v, other) => v === 'other' ? (other ? `Other — ${other}` : 'Other') : (NEED_CATEGORY_OPTIONS.find(o => o.value === v)?.label || v);

const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-muted text-muted-foreground',
};

// General Clients workspace — clients who aren't on a monitored intensive workflow.
// Structured but light: a needs & barriers assessment plus the client's history of
// interactions, so staff can give accurate advice and make appropriate referrals.
export default function GeneralClientsWorkspace({ category = 'general', onlyMine = false }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [needOpen, setNeedOpen] = useState(false);
  const [needRecord, setNeedRecord] = useState(null);

  const { data: allClients = [], isLoading } = useQuery({
    queryKey: ['rc-clients-all'],
    queryFn: () => base44.entities.RCClient.list('last_name', 500),
  });
  const isCaregiver = category === 'caregiver';
  // The General tab shows everyone not on the intensive workflow (General,
  // unset legacy records, and 0-6 Caregiver Capacity clients). The dedicated
  // Caregiver Capacity 0-6y tab shows only the Caregiver Capacity clients.
  const scoped = onlyMine ? allClients.filter(c => matchesWorker(c.assigned_worker, user)) : allClients;
  const general = isCaregiver
    ? scoped.filter(c => c.service_category === 'caregiver_capacity_0_5')
    : scoped.filter(c => c.service_category !== 'intensive_services');
  const heading = isCaregiver ? 'Caregiver Capacity 0-6y' : 'General Clients';

  const filtered = general.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const selected = general.find(c => c.id === selectedId);

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['rc-service-logs', selectedId],
    queryFn: () => base44.entities.RCServiceLog.filter({ client_id: selectedId }, '-service_date', 200),
    enabled: !!selectedId,
  });

  const { data: needs = [] } = useQuery({
    queryKey: ['rc-client-needs', selectedId],
    queryFn: () => base44.entities.RCClientNeed.filter({ client_id: selectedId }, '-date_identified', 200),
    enabled: !!selectedId,
  });

  const invalidateNeeds = () => queryClient.invalidateQueries({ queryKey: ['rc-client-needs', selectedId] });

  const updateNeedStatus = (need, status) => {
    base44.entities.RCClientNeed.update(need.id, { status, addressed_date: status === 'addressed' ? (need.addressed_date || today()) : null })
      .then(invalidateNeeds)
      .catch(err => toast({ title: 'Error updating need', description: err.message, variant: 'destructive' }));
  };

  const deleteNeed = (id) => {
    base44.entities.RCClientNeed.delete(id)
      .then(invalidateNeeds)
      .catch(err => toast({ title: 'Error deleting need', description: err.message, variant: 'destructive' }));
  };

  const onLogSaved = () => {
    setLogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['rc-service-logs', selectedId] });
  };

  const openNeeds = needs.filter(n => n.status !== 'addressed');

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  if (general.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        {onlyMine
          ? (isCaregiver ? 'No Caregiver Capacity 0-6y clients assigned to you.' : 'No General clients assigned to you yet — clients you work with appear here once your name is on their record.')
          : isCaregiver
          ? 'No 0-6 Caregiver Capacity clients yet. Clients whose Service Category is Caregiver Capacity 0-5 will appear here.'
          : 'No General clients yet. Clients whose Service Category is General or 0-6 Caregiver Capacity will appear here.'}
      </CardContent></Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-4 items-start">
      {/* Client list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{heading} ({general.length})</CardTitle>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." className="pl-8 h-8 text-sm" />
          </div>
        </CardHeader>
        <CardContent className="max-h-[65vh] overflow-y-auto space-y-0.5 p-2 pt-0">
          {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No matches.</p>}
          {filtered.map(c => (
            <button key={c.id} onClick={() => setSelectedId(c.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors ${c.id === selectedId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}>
              {c.first_name} {c.last_name}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Selected client — assessment + history */}
      <div className="min-w-0 space-y-4">
        {!selected ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Select a client to view their assessment and history with Candora.</CardContent></Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <h2 className="text-xl font-heading font-bold text-foreground truncate">
                  {selected.first_name} {selected.last_name}
                </h2>
                <StatusBadge status={selected.case_status} options={CASE_STATUS_OPTIONS} />
                <Link to={`/rc/clients/${selected.id}`} className="text-xs text-primary hover:underline shrink-0">View profile</Link>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => { setNeedRecord(null); setNeedOpen(true); }}>
                  <ClipboardList className="h-4 w-4" /> Add Need / Barrier
                </Button>
                <Button size="sm" variant="outline" onClick={() => setLogOpen(true)}>
                  <Plus className="h-4 w-4" /> Log Interaction
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-4 gap-3">
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Open needs</p>
                <p className="text-2xl font-heading font-bold">{openNeeds.length}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total interactions</p>
                <p className="text-2xl font-heading font-bold">{logs.length}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Last interaction</p>
                <p className="text-lg font-semibold mt-1">{logs[0]?.service_date || '—'}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Follow-ups flagged</p>
                <p className="text-2xl font-heading font-bold">{logs.filter(l => l.follow_up_needed).length}</p>
              </CardContent></Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Needs & Barriers Assessment</CardTitle>
                <CardDescription className="text-xs">
                  The needs and barriers identified for this client, with priority and status — so advice and referrals stay grounded in what's actually going on.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {needs.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-sm text-muted-foreground">No needs or barriers recorded yet for this client.</p>
                    <Button size="sm" variant="outline" onClick={() => { setNeedRecord(null); setNeedOpen(true); }}>
                      <Plus className="h-4 w-4" /> Record the first need / barrier
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {needs.map(n => (
                      <div key={n.id} className="p-3 rounded-md border border-border/50">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${PRIORITY_STYLES[n.priority] || PRIORITY_STYLES.low}`}>{n.priority || 'low'}</span>
                          <span className="text-sm font-medium">{needCategoryLabel(n.category, n.category_other)}</span>
                          {n.date_identified && <span className="text-xs text-muted-foreground">identified {n.date_identified}</span>}
                          <div className="ml-auto flex items-center gap-1.5">
                            <Select value={n.status || 'open'} onValueChange={(v) => updateNeedStatus(n, v)}>
                              <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{NEED_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setNeedRecord(n); setNeedOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteNeed(n.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {n.description && <p className="text-sm mt-1.5 text-foreground/90">{n.description}</p>}
                        {n.notes && <p className="text-xs mt-1 text-muted-foreground italic">{n.notes}</p>}
                        {n.status === 'addressed' && n.addressed_date && <p className="text-xs mt-1 text-muted-foreground">Addressed {n.addressed_date}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Calendar</CardTitle>
                <CardDescription className="text-xs">
                  This client's appointments and follow-up dates — book appointments directly from here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GeneralClientCalendar
                  clientId={selected.id}
                  clientName={`${selected.first_name} ${selected.last_name}`}
                  clientEmail={selected.email}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Interaction History</CardTitle>
                <CardDescription className="text-xs">
                  Every logged interaction — information & referrals, advocacy, navigation, practical support and crisis response.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">Loading history...</div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-sm text-muted-foreground">No interactions logged yet for this client.</p>
                    <Button size="sm" variant="outline" onClick={() => setLogOpen(true)}><Plus className="h-4 w-4" /> Log the first interaction</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map(l => (
                      <div key={l.id} className="p-3 rounded-md border border-border/50">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{l.service_date}</span>
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{typeLabel(l.service_type)}</span>
                          {l.follow_up_needed && <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Follow-up {l.follow_up_date ? `due ${l.follow_up_date}` : 'needed'}</span>}
                          {l.worker_name && <span className="text-xs text-muted-foreground ml-auto">{l.worker_name}</span>}
                        </div>
                        {l.description && <p className="text-sm mt-1.5 text-foreground/90">{l.description}</p>}
                        {l.outcome && <p className="text-xs mt-1 text-muted-foreground">Outcome: {l.outcome}</p>}
                        {l.notes && <p className="text-xs mt-1 text-muted-foreground italic">{l.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <ServiceLogDialog
              open={logOpen}
              onOpenChange={(o) => { if (!o) setLogOpen(false); }}
              clientId={selected.id}
              clientName={`${selected.first_name} ${selected.last_name}`}
              onSaved={onLogSaved}
            />
            <NeedBarrierDialog
              open={needOpen}
              onOpenChange={(o) => { if (!o) { setNeedOpen(false); setNeedRecord(null); } }}
              clientId={selected.id}
              clientName={`${selected.first_name} ${selected.last_name}`}
              record={needRecord}
              onSaved={() => { setNeedOpen(false); setNeedRecord(null); invalidateNeeds(); }}
            />
          </>
        )}
      </div>
    </div>
  );
}