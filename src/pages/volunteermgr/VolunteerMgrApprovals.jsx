import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, UserPlus, Edit, AlertCircle, Building2 } from 'lucide-react';
import moment from 'moment';

const typeConfig = {
  new_registration: { icon: UserPlus, label: 'New Registration', color: 'bg-blue-50 text-blue-700' },
  profile_change: { icon: Edit, label: 'Profile Change', color: 'bg-amber-50 text-amber-700' },
  hour_adjustment: { icon: Clock, label: 'Hour Adjustment', color: 'bg-purple-50 text-purple-700' },
  cohort_registration: { icon: Building2, label: 'Cohort Registration', color: 'bg-indigo-50 text-indigo-700' },
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

  const { data: profileChanges = [] } = useQuery({
    queryKey: ['vol-profile-changes'],
    queryFn: () => base44.entities.VolunteerProfileChange.list('-submitted_date', 100),
  });

  const { data: cohortRequests = [] } = useQuery({
    queryKey: ['vol-cohort-requests'],
    queryFn: () => base44.entities.VolunteerCohortRequest.list('-created_date', 100),
  });

  const approveCohortMutation = useMutation({
    mutationFn: async ({ cohortRequestId }) => {
      return await base44.functions.invoke('approveCohortRequest', { cohortRequestId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-cohort-requests'] });
      queryClient.invalidateQueries({ queryKey: ['vol-approvals-all'] });
      queryClient.invalidateQueries({ queryKey: ['portal-cards'] });
    },
  });

  const updateProfileChangeMutation = useMutation({
    mutationFn: async ({ id, status, notes }) => {
      const change = profileChanges.find(c => c.id === id);
      
      await base44.entities.VolunteerProfileChange.update(id, {
        status,
        reviewed_by: 'admin@candorasociety.com',
        review_notes: notes || '',
      });

      if (status === 'approved' && change?.changes_requested) {
        await base44.entities.Volunteer.update(change.volunteer_id, change.changes_requested);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-profile-changes'] });
      queryClient.invalidateQueries({ queryKey: ['vol-volunteers'] });
    },
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
          await base44.functions.invoke('sendWelcomeEmail', { volunteer_id: req.volunteer_id });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-approvals-all'] });
      queryClient.invalidateQueries({ queryKey: ['vol-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['vol-volunteers'] });
    },
  });

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const pendingProfileChanges = profileChanges.filter(c => c.status === 'pending');
  const pendingCohortRequests = cohortRequests.filter(c => c.status === 'pending');
  const resolvedCohortRequests = cohortRequests.filter(c => c.status !== 'pending');
  const resolvedProfileChanges = profileChanges.filter(c => c.status !== 'pending');
  const resolvedApprovals = approvals.filter(a => a.status !== 'pending');

  const renderCohortCard = (req) => (
    <Card key={req.id} className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">{req.organization_name}</p>
            <Badge className={`text-xs mt-1 ${typeConfig.cohort_registration.color}`}>
              <Building2 className="w-3 h-3 mr-1" />Cohort Registration
            </Badge>
          </div>
          <Badge className={`text-xs border shrink-0 ${statusColors[req.status]}`}>{req.status}</Badge>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Type:</strong> {req.organization_type.replace(/_/g, ' ')}</p>
          <p><strong>Contact:</strong> {req.contact_name} ({req.contact_email})</p>
          <p><strong>Volunteers:</strong> {req.number_of_volunteers} expected</p>
          {req.preferred_start_date && <p><strong>Start Date:</strong> {moment(req.preferred_start_date).format('MMM D, YYYY')}</p>}
          {req.availability && <p><strong>Availability:</strong> {req.availability}</p>}
          {req.areas_of_interest?.length > 0 && <p><strong>Areas:</strong> {req.areas_of_interest.join(', ')}</p>}
          {req.skills_or_focus && <p><strong>Skills:</strong> {req.skills_or_focus}</p>}
          {req.motivation && <p><strong>Motivation:</strong> {req.motivation}</p>}
        </div>
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
              <Button 
                size="sm" 
                className="gap-1 bg-green-600 hover:bg-green-700"
                onClick={() => approveCohortMutation.mutate({ cohortRequestId: req.id })}
                disabled={approveCohortMutation.isPending}
              >
                <CheckCircle className="w-3.5 h-3.5" /> Approve & Create Card
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => {
                  base44.entities.VolunteerCohortRequest.update(req.id, {
                    status: 'rejected',
                    approved_by: 'admin@candorasociety.com',
                    approval_date: moment().format('YYYY-MM-DD'),
                    notes: reviewNotes[req.id] || '',
                  });
                  queryClient.invalidateQueries({ queryKey: ['vol-cohort-requests'] });
                }}
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
            </div>
          </div>
        )}
        {req.notes && <p className="text-xs text-muted-foreground border-t pt-2"><strong>Notes:</strong> {req.notes}</p>}
        {req.card_created && req.card_id && (
          <p className="text-xs text-green-600 border-t pt-2">
            <strong>Portal Card Created:</strong> ID {req.card_id}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const renderProfileChangeCard = (change) => (
    <Card key={change.id} className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">{change.volunteer_name}</p>
            <Badge className={`text-xs mt-1 ${typeConfig.profile_change.color}`}>
              <Edit className="w-3 h-3 mr-1" />Profile Change Request
            </Badge>
          </div>
          <Badge className={`text-xs border shrink-0 ${statusColors[change.status]}`}>{change.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          <strong>Changes requested:</strong> {change.change_summary}
        </p>
        <p className="text-xs text-muted-foreground">Submitted {moment(change.submitted_date).fromNow()}</p>

        {change.status === 'pending' && (
          <div className="space-y-2 pt-2 border-t">
            <Textarea
              placeholder="Review notes (optional)..."
              rows={2}
              value={reviewNotes[change.id] || ''}
              onChange={e => setReviewNotes(p => ({ ...p, [change.id]: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700"
                onClick={() => updateProfileChangeMutation.mutate({ id: change.id, status: 'approved', notes: reviewNotes[change.id] })}>
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => updateProfileChangeMutation.mutate({ id: change.id, status: 'rejected', notes: reviewNotes[change.id] })}>
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
            </div>
          </div>
        )}
        {change.review_notes && <p className="text-xs text-muted-foreground border-t pt-2"><strong>Notes:</strong> {change.review_notes}</p>}
      </CardContent>
    </Card>
  );

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

  const totalPending = pendingApprovals.length + pendingProfileChanges.length + pendingCohortRequests.length;
  const totalResolved = resolvedApprovals.length + resolvedProfileChanges.length + resolvedCohortRequests.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">{totalPending} pending, {totalResolved} resolved</p>
      </div>

      {pendingCohortRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Cohort Requests ({pendingCohortRequests.length})</h2>
          {pendingCohortRequests.map(renderCohortCard)}
        </div>
      )}

      {pendingProfileChanges.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Profile Changes ({pendingProfileChanges.length})</h2>
          {pendingProfileChanges.map(renderProfileChangeCard)}
        </div>
      )}

      {pendingApprovals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Other Approvals ({pendingApprovals.length})</h2>
          {pendingApprovals.map(renderCard)}
        </div>
      )}

      {totalPending === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <p>No pending approvals. All caught up!</p>
        </div>
      )}

      {resolvedCohortRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resolved Cohort Requests ({resolvedCohortRequests.length})</h2>
          {resolvedCohortRequests.map(renderCohortCard)}
        </div>
      )}

      {resolvedProfileChanges.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resolved Profile Changes ({resolvedProfileChanges.length})</h2>
          {resolvedProfileChanges.map(renderProfileChangeCard)}
        </div>
      )}

      {resolvedApprovals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resolved Other ({resolvedApprovals.length})</h2>
          {resolvedApprovals.map(renderCard)}
        </div>
      )}
    </div>
  );
}