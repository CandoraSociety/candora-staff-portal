import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Database, ExternalLink, Loader2, Link2, FileCheck2, AlertCircle, Phone, Mail, MapPin, Calendar, Users } from 'lucide-react';
import { matchReasons } from '@/lib/clientMatch';
import { CASE_STATUS_LABELS, SERVICE_CATEGORY_LABELS, fmtDate } from '@/lib/centralPreviewLabels';
import CentralDatabasePrograms from '@/components/client/CentralDatabasePrograms';
import CentralDatabaseHistory from '@/components/client/CentralDatabaseHistory';

const esc = (s) => (s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const HOW_META = {
  linked: { label: 'Linked file', icon: Link2, color: '#6366f1' },
  sync: { label: 'Synced from this file', icon: FileCheck2, color: '#22c55e' },
  match: { label: 'Name match — confirm', icon: AlertCircle, color: '#f59e0b' },
};

// Find the central database record that belongs to this Pathways client:
// the staff-confirmed link first, then the record whose Pathways participation
// points back at this client, then a strong identity match.
async function findCentralRecord(client) {
  if (client.linked_rc_client_id) {
    try {
      return { record: await base44.entities.RCClient.get(client.linked_rc_client_id), how: 'linked' };
    } catch { /* link is stale — fall through to a search */ }
  }

  const queries = [];
  if (client.last_name) queries.push(base44.entities.RCClient.filter({ last_name: { $regex: esc(client.last_name), $options: 'i' } }));
  if (client.first_name) queries.push(base44.entities.RCClient.filter({ first_name: { $regex: esc(client.first_name), $options: 'i' } }));
  if (client.phone) queries.push(base44.entities.RCClient.filter({ phone: client.phone }));
  if (client.email) queries.push(base44.entities.RCClient.filter({ email: client.email }));
  const results = (await Promise.all(queries.map((q) => q.catch(() => [])))).flat();
  const seen = new Map();
  results.forEach((r) => { if (r?.id) seen.set(r.id, r); });
  const candidates = Array.from(seen.values());

  const own = candidates.find((r) => (r.program_participations || [])
    .some((p) => p.program === 'pathways' && p.linked_id === client.id));
  if (own) return { record: own, how: 'sync' };

  const scored = candidates
    .map((r) => ({ record: r, ...matchReasons(r, client) }))
    .filter((s) => s.strength > 0)
    .sort((a, b) => (b.strength - a.strength) || (b.sim - a.sim));
  return scored.length ? { record: scored[0].record, how: 'match' } : { record: null, how: null };
}

export default function CentralDatabasePreviewTab({ client }) {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, record: null, how: null });
  const [notes, setNotes] = useState([]);
  const [serviceLogs, setServiceLogs] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState({ loading: true, record: null, how: null });
      const found = await findCentralRecord(client).catch(() => ({ record: null, how: null }));
      if (cancelled) return;
      setState({ loading: false, ...found });
      if (!found.record) return;
      const [n, s] = await Promise.all([
        base44.entities.RCClientNote.filter({ client_id: found.record.id }).catch(() => []),
        base44.entities.RCServiceLog.filter({ client_id: found.record.id }).catch(() => []),
      ]);
      if (cancelled) return;
      setNotes([...n].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 6));
      setServiceLogs([...s].sort((a, b) => new Date(b.service_date || b.created_date) - new Date(a.service_date || a.created_date)).slice(0, 6));
    })();
    return () => { cancelled = true; };
  }, [client.id, client.linked_rc_client_id]);

  const { loading, record, how } = state;

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Looking up this client in the central database…
      </div>
    );
  }

  if (!record) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <Database className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">No central database record found</p>
        <p className="text-sm text-muted-foreground mt-1">
          This client's file has not been matched to a central database profile yet. One is created automatically when their Pathways file syncs.
        </p>
      </div>
    );
  }

  const badge = HOW_META[how] || HOW_META.match;
  const BadgeIcon = badge.icon;
  const reason = record.reason_for_accessing === 'other'
    ? (record.reason_for_accessing_other || 'Other')
    : record.reason_for_accessing;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Window bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b" style={{ backgroundColor: 'hsl(230, 70%, 12%)' }}>
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'hsl(45, 60%, 88%)' }}>
          <Database className="w-4 h-4" style={{ color: 'hsl(45, 92%, 53%)' }} /> Central database preview
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ backgroundColor: `${badge.color}25`, color: '#fff' }}>
            <BadgeIcon className="w-3 h-3" /> {badge.label}
          </span>
          <Button size="sm" className="h-7 text-xs" onClick={() => navigate(`/rc/clients/${record.id}`)}>
            Open in central database <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Identity */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'hsl(231,64%,20%)' }}>
              {record.first_name} {record.last_name}
            </h3>
            <p className="text-xs text-muted-foreground">
              Central file · {CASE_STATUS_LABELS[record.case_status] || record.case_status || 'Status not set'}
              {record.service_category ? ` · ${categoryLabel(record.service_category)}` : ''}
            </p>
          </div>
          <div className="text-xs text-muted-foreground text-right space-y-0.5">
            {record.assigned_worker && <p>Worker: <span className="text-foreground font-medium">{record.assigned_worker}</span></p>}
            {record.intake_date && <p>Central intake: <span className="text-foreground font-medium">{fmtDate(record.intake_date)}</span></p>}
            <p>Visits logged: <span className="text-foreground font-medium">{record.visit_count || 0}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {record.phone && <p className="text-muted-foreground flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {record.phone}</p>}
          {record.email && <p className="text-muted-foreground flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 shrink-0" /> {record.email}</p>}
          {record.city && <p className="text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {record.city}</p>}
          {record.date_of_birth && <p className="text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {fmtDate(record.date_of_birth)}</p>}
          {!!record.dependants_count && <p className="text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {record.dependants_count} dependant{record.dependants_count === 1 ? '' : 's'}</p>}
        </div>

        {(reason || record.identified_needs || record.notes) && (
          <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Important notes on the central file</p>
            {reason && <p className="text-sm"><span className="text-muted-foreground">Reason for accessing services: </span>{reason}</p>}
            {record.identified_needs && <p className="text-sm"><span className="text-muted-foreground">Identified needs: </span>{record.identified_needs}</p>}
            {record.notes && <p className="text-sm whitespace-pre-wrap"><span className="text-muted-foreground">Case notes: </span>{record.notes}</p>}
          </div>
        )}

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Programs in the central database</p>
          <CentralDatabasePrograms participations={record.program_participations || []} />
        </div>

        <CentralDatabaseHistory notes={notes} serviceLogs={serviceLogs} />
      </div>
    </div>
  );
}

function categoryLabel(value) {
  return SERVICE_CATEGORY_LABELS[value] || value;
}