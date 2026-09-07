import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { History, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/rc/StatusBadge';
import { CASE_STATUS_OPTIONS, SERVICE_TYPE_OPTIONS } from '@/lib/rcConstants';
import ServiceLogDialog from '@/components/rc/ServiceLogDialog';

const typeLabel = (v) => (SERVICE_TYPE_OPTIONS || []).find(o => o.value === v)?.label || v || '—';

// General Clients workspace — clients who aren't on a monitored intensive case.
// No workflow wizard: staff log interactions and referrals so the client's history
// with Candora is available for accurate advice and appropriate referrals.
export default function GeneralClientsWorkspace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [logOpen, setLogOpen] = useState(false);

  const { data: allClients = [], isLoading } = useQuery({
    queryKey: ['rc-clients-all'],
    queryFn: () => base44.entities.RCClient.list('last_name', 500),
  });
  // General clients: Service Category is General (or not yet set on legacy records).
  const general = allClients.filter(c => c.service_category === 'general' || !c.service_category);

  const filtered = general.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const selected = general.find(c => c.id === selectedId);

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['rc-service-logs', selectedId],
    queryFn: () => base44.entities.RCServiceLog.filter({ client_id: selectedId }, '-service_date', 200),
    enabled: !!selectedId,
  });

  const onSaved = () => {
    setLogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['rc-service-logs', selectedId] });
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  if (general.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        No General clients yet. Clients whose Service Category is General will appear here.
      </CardContent></Card>
    );
  }

  const lastLog = logs[0];

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-4 items-start">
      {/* Client list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">General Clients ({general.length})</CardTitle>
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

      {/* Selected client history */}
      <div className="min-w-0 space-y-4">
        {!selected ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Select a client to view their history with Candora.</CardContent></Card>
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
              <Button size="sm" onClick={() => setLogOpen(true)}>
                <Plus className="h-4 w-4" /> Log Interaction
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total interactions</p>
                <p className="text-2xl font-heading font-bold">{logs.length}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Last interaction</p>
                <p className="text-lg font-semibold mt-1">{lastLog?.service_date || '—'}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Follow-ups flagged</p>
                <p className="text-2xl font-heading font-bold">{logs.filter(l => l.follow_up_needed).length}</p>
              </CardContent></Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Interaction History</CardTitle>
                <CardDescription className="text-xs">
                  Every logged interaction — information & referrals, advocacy, navigation, practical support and crisis response — so staff can give accurate advice and make appropriate referrals.
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
              onSaved={onSaved}
            />
          </>
        )}
      </div>
    </div>
  );
}