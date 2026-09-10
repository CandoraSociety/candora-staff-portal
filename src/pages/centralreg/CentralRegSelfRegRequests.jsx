import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Inbox, Check, X, ListOrdered } from 'lucide-react';
import { REG_AREA_LABELS, REG_AREA_COLORS } from '@/lib/centralRegConstants';

const STATUS_BADGES = {
  pending: { label: 'Pending review', cls: 'bg-warning/10 text-warning' },
  approved: { label: 'Approved', cls: 'bg-success/10 text-success' },
  rejected: { label: 'Rejected', cls: 'bg-destructive/10 text-destructive-foreground' },
  waitlisted: { label: 'Waitlisted', cls: 'bg-accent/10 text-accent-foreground' },
};

// Self-registration requests submitted from the public QR page. The registrar
// approves, rejects, or waitlists each request — approvals/waitlists create the
// registration in the program's own records.
export default function CentralRegSelfRegRequests() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [busy, setBusy] = useState(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['selfreg-requests'],
    queryFn: () => base44.entities.SelfRegRequest.list('-created_date', 500),
  });

  const pending = requests.filter(r => r.status === 'pending');
  const reviewed = requests.filter(r => r.status !== 'pending');

  const apply = async (request, action) => {
    setBusy(request.id + action);
    try {
      const res = await base44.functions.invoke('applySelfRegRequest', { request_id: request.id, action });
      const status = res.data?.status;
      toast({
        title: action === 'reject' ? 'Request rejected' : status === 'waitlisted' ? 'Added to the waitlist' : 'Registration approved',
        description: `${request.first_name} ${request.last_name} — ${request.program_name || REG_AREA_LABELS[request.area]}`,
      });
      queryClient.invalidateQueries({ queryKey: ['selfreg-requests'] });
      queryClient.invalidateQueries();
    } catch (e) {
      toast({ title: 'Error reviewing request', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const RequestCard = ({ r }) => {
    const badge = STATUS_BADGES[r.status] || STATUS_BADGES.pending;
    const area = { label: REG_AREA_LABELS[r.area] || r.area, color: REG_AREA_COLORS[r.area] || '#64748b' };
    return (
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${area.color}1a`, color: area.color }}>{area.label}</span>
                <p className="font-medium text-sm text-foreground truncate">{r.first_name} {r.last_name}</p>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{r.program_name || '—'}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                {r.auto_approved && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-success/10 text-success">Auto-approved</span>}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                {r.session_name && <span>Session: {r.session_name}{r.session_date ? ` (${r.session_date})` : ''}</span>}
                {r.phone && <span>{r.phone}</span>}
                {r.email && <span>{r.email}</span>}
                {r.parent_guardian_name && <span>Guardian: {r.parent_guardian_name}</span>}
                <span>Requested {r.created_date ? new Date(r.created_date).toLocaleDateString() : ''}</span>
                {r.status !== 'pending' && r.reviewed_by_name && <span>Reviewed by {r.reviewed_by_name}{r.reviewed_date ? ` · ${r.reviewed_date}` : ''}</span>}
              </div>
              {r.notes && <p className="text-xs text-muted-foreground/80 mt-1">"{r.notes}"</p>}
            </div>
            {r.status === 'pending' && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button size="sm" className="text-green-600" disabled={!!busy} onClick={() => apply(r, 'approve')}><Check className="h-3.5 w-3.5" /> Approve</Button>
                <Button size="sm" variant="outline" disabled={!!busy} onClick={() => apply(r, 'waitlist')}><ListOrdered className="h-3.5 w-3.5" /> Waitlist</Button>
                <Button size="sm" variant="outline" className="text-red-600" disabled={!!busy} onClick={() => apply(r, 'reject')}><X className="h-3.5 w-3.5" /> Reject</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Registration Requests</h1>
        <p className="text-muted-foreground text-sm mt-1">Requests submitted from the public QR self-registration page. Approving (or waitlisting) a request creates the registration in the program's own records; rejecting simply declines it.</p>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading…</div> : (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <Inbox className="h-4 w-4" /> Awaiting review ({pending.length})
            </p>
            {pending.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No registration requests waiting for review.</CardContent></Card>
            ) : pending.map(r => <RequestCard key={r.id} r={r} />)}
          </div>

          {reviewed.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Recently reviewed</p>
              {reviewed.slice(0, 30).map(r => <RequestCard key={r.id} r={r} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}