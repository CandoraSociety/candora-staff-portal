import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, ListPlus, ArrowUp, ExternalLink, HeartHandshake } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/rc/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import { VOLUNTEER_STATUS_OPTIONS, VOLUNTEER_TYPE_OPTIONS } from '@/lib/centralRegConstants';

// Volunteer registration processing. Works directly on Volunteer records —
// the same ones the Volunteer Manager portal and the public volunteer portal use.
export default function CentralRegVolunteers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: volunteers = [], isLoading } = useQuery({ queryKey: ['cr-volunteers'], queryFn: () => base44.entities.Volunteer.list('-created_date', 500) });

  const applications = volunteers.filter(v => v.status === 'pending');
  const waitlisted = volunteers.filter(v => v.status === 'waitlist');

  const updateStatus = async (v, status, message) => {
    try {
      await base44.entities.Volunteer.update(v.id, { status });
      queryClient.invalidateQueries({ queryKey: ['cr-volunteers'] });
      toast({ title: message, description: `${v.first_name} ${v.last_name}` });
    } catch (err) {
      toast({ title: 'Error updating volunteer', description: err.message, variant: 'destructive' });
    }
  };

  const typeLabel = (t) => VOLUNTEER_TYPE_OPTIONS.find(o => o.value === t)?.label || t || '—';

  const Row = ({ v, actions }) => (
    <Card className="hover:shadow-sm transition-shadow"><CardContent className="p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-sm text-foreground truncate">{v.first_name} {v.last_name}</p>
            <StatusBadge status={v.status} options={VOLUNTEER_STATUS_OPTIONS} />
            <span className="text-xs text-muted-foreground">{typeLabel(v.volunteer_type)}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            {v.email && <span>{v.email}</span>}
            {v.phone && <span>{v.phone}</span>}
            {v.availability && <span className="truncate max-w-xs">Availability: {v.availability}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">{actions}</div>
      </div>
    </CardContent></Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Volunteer Registration</h1>
          <p className="text-muted-foreground text-sm mt-1">Process volunteer applications from the public portal and staff registrations. Approvals here update the Volunteer Manager instantly.</p>
        </div>
        <Link to="/volunteermgr/volunteers"><Button variant="outline" size="sm">Volunteer Manager<ExternalLink className="h-3.5 w-3.5" /></Button></Link>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
        <div className="space-y-8">
          <div>
            <p className="font-medium text-sm text-foreground mb-3">Applications Awaiting Review ({applications.length})</p>
            {applications.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground"><HeartHandshake className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />No pending volunteer applications.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {applications.map(v => (
                  <Row key={v.id} v={v} actions={
                    <>
                      <Button size="sm" variant="outline" className="text-green-600" onClick={() => updateStatus(v, 'active', 'Volunteer approved')}><CheckCircle className="h-3.5 w-3.5" /> Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(v, 'waitlist', 'Moved to volunteer waitlist')}><ListPlus className="h-3.5 w-3.5" /> Waitlist</Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateStatus(v, 'inactive', 'Application declined')}><XCircle className="h-3.5 w-3.5" /> Decline</Button>
                    </>
                  } />
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="font-medium text-sm text-foreground mb-3">Volunteer Waitlist ({waitlisted.length})</p>
            {waitlisted.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">No volunteers are waiting for a placement right now.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {waitlisted.map(v => (
                  <Row key={v.id} v={v} actions={
                    <>
                      <Button size="sm" variant="outline" className="text-green-600" onClick={() => updateStatus(v, 'pending', 'Promoted for processing')}><ArrowUp className="h-3.5 w-3.5" /> Promote</Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateStatus(v, 'inactive', 'Removed from volunteer waitlist')}><XCircle className="h-3.5 w-3.5" /> Remove</Button>
                    </>
                  } />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}