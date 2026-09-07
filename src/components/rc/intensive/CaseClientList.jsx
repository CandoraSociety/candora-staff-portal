import React from 'react';
import { ArrowRight, CheckCircle2, History, Hourglass, ListChecks, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CASE_STAGES, today } from './caseConstants';

const stageLabel = (key) => (CASE_STAGES.find(s => s.key === key) || {}).label || key || '';
const daysWaiting = (d) => {
  if (!d) return null;
  const n = Math.floor((new Date(today()) - new Date(d)) / 86400000);
  return isNaN(n) ? null : Math.max(0, n);
};

// Landing list for the Intensive Services tab — clients grouped by case status.
// Click a client to enter their case management workflow.
export default function CaseClientList({ clients = [], cases = [], onOpenClient }) {
  const caseByClient = {};
  cases.forEach(c => { if (!caseByClient[c.client_id]) caseByClient[c.client_id] = c; });

  const active = [], followUp = [], closed = [], waitlisted = [], notStarted = [];
  clients.forEach(cl => {
    const c = caseByClient[cl.id];
    if (!c) { notStarted.push({ client: cl }); return; }
    const row = { client: cl, caseRec: c };
    if (c.case_status === 'waitlisted') waitlisted.push(row);
    else if (c.case_status === 'closed') closed.push(row);
    else if (c.current_stage === 'post_service_followup') followUp.push(row);
    else active.push(row);
  });

  const Section = ({ icon: Icon, title, rows, sub }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">{title} ({rows.length})</p>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">None.</p>
        ) : (
          <div className="divide-y divide-border/50">
            {rows.map(({ client, caseRec }) => (
              <button key={client.id} type="button"
                className="w-full flex items-center justify-between gap-2 py-2 px-1.5 -mx-1.5 text-left rounded-sm hover:bg-muted/60 transition-colors"
                onClick={() => onOpenClient(client.id)}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{client.first_name} {client.last_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{sub({ client, caseRec })}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid md:grid-cols-2 gap-3 items-start">
      <Section icon={ListChecks} title="Active Clients" rows={active}
        sub={({ caseRec }) => `${caseRec.assigned_worker ? `Worker: ${caseRec.assigned_worker}` : 'No assigned worker'}${caseRec.current_stage ? ` — ${stageLabel(caseRec.current_stage)}` : ''}`} />
      <Section icon={History} title="In Follow-Up" rows={followUp}
        sub={({ caseRec }) => `Post-service follow-up${caseRec.assigned_worker ? ` — ${caseRec.assigned_worker}` : ''}`} />
      <Section icon={Hourglass} title="Waitlisted" rows={waitlisted}
        sub={({ caseRec }) => {
          const d = daysWaiting(caseRec.waitlist_date);
          return `Added ${caseRec.waitlist_date || '—'}${d !== null ? ` — ${d} day${d === 1 ? '' : 's'} waiting` : ''}`;
        }} />
      <Section icon={CheckCircle2} title="Closed" rows={closed}
        sub={({ caseRec }) => caseRec.transition?.closure_date ? `Closed ${caseRec.transition.closure_date}` : (caseRec.assigned_worker ? `Worker: ${caseRec.assigned_worker}` : '')} />
      <Section icon={UserPlus} title="Not Started" rows={notStarted}
        sub={() => 'No case management workflow yet — click to start'} />
    </div>
  );
}