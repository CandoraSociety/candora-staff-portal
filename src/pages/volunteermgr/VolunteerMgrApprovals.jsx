import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, UserPlus, Edit, AlertCircle } from 'lucide-react';
import moment from 'moment';

const typeConfig = {
  new_registration: { icon: UserPlus, label: 'New Registration', color: 'bg-blue-50 text-blue-700' },
  profile_change: { icon: Edit, label: 'Profile Change', color: 'bg-amber-50 text-amber-700' },
  hour_adjustment: { icon: Clock, label: 'Hour Adjustment', color: 'bg-purple-50 text-purple-700' },
};

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

export default function VolunteerMgrApprovals() {
  const [reviewNotes, setReviewNotes] = useState({});
  const queryClient = useQueryClient();

  const { data: approvals = [] } = useQuery({
    queryKey: ['vol-approvals-all'],
    queryFn: () => base44.entities.VolunteerApproval.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }) => {
      await base44.entities.VolunteerApproval.update(id, {
        status,
        review_notes: notes || '',
        review_date: moment().format('YYYY-MM-DD'),
      });

      if (status === 'approved') {
        const req = approvals.find(a => a.id === id);
        if (req?.request_type === 'new_registration' && req?.volunteer_id) {
          await base44.entities.Volunteer.update(req.volunteer_id, { status: 'active' });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-approvals-all'] });
      queryClient.invalidateQueries({ queryKey: ['vol-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['vol-volunteers'] });
    },
  });

  const pending = approvals.filter(a => a.status === 'pending');
  const resolved = approvals.filter(a => a.status !== 'pending');

  const renderCard = (req) => {
    const config = typeConfig[req.request_type] || { icon: AlertCircle, label: req.request_type, color: 'bg-muted' };
    const Icon = config.icon;

    return (
      <Card key={req.id} className="shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-sm">{req.volunteer_name || 'Unknown Volunteer'}</p>
              <Badge className={`text-xs mt-1 ${config.color}`}><Icon className="w-3 h-3 mr-1" />{config.label}</Badge>
            </div>
            <Badge className={`text-xs border shrink-0 ${statusColors[req.status]}`}>{req.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{req.description}</p>
          {req.changes && (
            <pre className="text-xs bg-muted/50 rounded p-2 overflow-auto max-h-24">{req.changes}</pre>
          )}
          <p className="text-xs text-muted-foreground">{moment(req.created_date).fromNow()}</p>

          {req.status === 'pending' && (
            <div className="space-y-2 pt-2 border-t">
              <Textarea
                placeholder="Review notes (optional)..."
                rows={2}
                value={reviewNotes[req.id] || ''}
                onChange={e => setReviewNotes(p => ({ ...p, [req.id]: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700"
                  onClick={() => updateMutation.mutate({ id: req.id, status: 'approved', notes: reviewNotes[req.id] })}>
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => updateMutation.mutate({ id: req.id, status: 'rejected', notes: reviewNotes[req.id] })}>
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
              </div>
            </div>
          )}
          {req.review_notes && <p className="text-xs text-muted-foreground border-t pt-2"><strong>Notes:</strong> {req.review_notes}</p>}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">{pending.length} pending, {resolved.length} resolved</p>
      </div>

      {pending.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Pending ({pending.length})</h2>
          {pending.map(renderCard)}
        </div>
      )}

      {pending.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <p>No pending approvals. All caught up!</p>
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resolved ({resolved.length})</h2>
          {resolved.map(renderCard)}
        </div>
      )}
    </div>
  );
}