import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, UserPlus, Edit, AlertCircle, Building2, X } from 'lucide-react';
import moment from 'moment-timezone';
import { toast } from 'sonner';

const typeConfig = {
  new_registration: { icon: UserPlus, label: 'New Registration', color: 'bg-blue-50 text-blue-700' },
  profile_change: { icon: Edit, label: 'Profile Change', color: 'bg-amber-50 text-amber-700' },
  hour_adjustment: { icon: Clock, label: 'Hour Adjustment', color: 'bg-purple-50 text-purple-700' },
  cohort_registration: { icon: Building2, label: 'Cohort Registration', color: 'bg-indigo-50 text-indigo-700' },
  practicum_placement: { icon: Building2, label: 'Practicum Placement', color: 'bg-emerald-50 text-emerald-700' },
};

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

export default function VolunteerMgrApprovals() {
  const [reviewNotes, setReviewNotes] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
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

  const { data: practicumRequests = [] } = useQuery({
    queryKey: ['vol-practicum-requests'],
    queryFn: () => base44.entities.VolunteerApproval.filter({ request_type: 'practicum_placement' }, '-created_date', 100),
  });

  const approveCohortMutation = useMutation({
    mutationFn: async ({ cohortRequestId }) => {
      const result = await base44.functions.invoke('approveCohortRequest', { cohortRequestId });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-cohort-requests'] });
      queryClient.invalidateQueries({ queryKey: ['vol-approvals-all'] });
      queryClient.invalidateQueries({ queryKey: ['portal-cards'] });
      toast.success('Cohort request approved and portal card created!');
    },
    onError: (error) => {
      toast.error('Approval failed: ' + (error.message || 'Unknown error'));
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
  const pendingPracticumRequests = practicumRequests.filter(p => p.status === 'pending');
  const resolvedPracticumRequests = practicumRequests.filter(p => p.status !== 'pending');
  const resolvedProfileChanges = profileChanges.filter(c => c.status !== 'pending');
  const resolvedApprovals = approvals.filter(a => a.status !== 'pending');

  const renderCohortCard = (req, isClickable = true) => (
    <Card 
      key={req.id} 
      className={`shadow-sm ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={() => isClickable && setSelectedRequest({ type: 'cohort', data: req })}
    >
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
        <p className="text-xs text-muted-foreground">Submitted: {moment.utc(req.created_date).tz('America/Edmonton').format('MMM D, YYYY h:mm A')}</p>

        {req.status === 'pending' && (
          <Button size="sm" variant="outline" className="w-full mt-2" onClick={(e) => { e.stopPropagation(); setSelectedRequest({ type: 'cohort', data: req }); }}>
            View Details
          </Button>
        )}

        {req.status === 'pending' && (
          <div className="space-y-2 pt-2 border-t">
            <Textarea
              placeholder="Review notes (optional)..."
              rows={2}
              value={reviewNotes[req.id] || ''}
              onChange={(e) => {
                e.stopPropagation();
                setReviewNotes(p => ({ ...p, [req.id]: e.target.value }));
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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

  const renderPracticumCard = (req, isClickable = true) => (
    <Card 
      key={req.id} 
      className={`shadow-sm ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={() => isClickable && setSelectedRequest({ type: 'practicum', data: req })}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">{req.volunteer_name}</p>
            <Badge className={`text-xs mt-1 ${typeConfig.practicum_placement.color}`}>
              <Building2 className="w-3 h-3 mr-1" />Practicum Placement
            </Badge>
          </div>
          <Badge className={`text-xs border shrink-0 ${statusColors[req.status]}`}>{req.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{req.description}</p>
        <p className="text-xs text-muted-foreground">Submitted: {moment.utc(req.created_date).tz('America/Edmonton').format('MMM D, YYYY h:mm A')}</p>

        {req.status === 'pending' && (
          <Button size="sm" variant="outline" className="w-full mt-2" onClick={(e) => { e.stopPropagation(); setSelectedRequest({ type: 'practicum', data: req }); }}>
            View Details
          </Button>
        )}

        {req.status === 'pending' && (
          <div className="space-y-2 pt-2 border-t">
            <Textarea
              placeholder="Review notes (optional)..."
              rows={2}
              value={reviewNotes[req.id] || ''}
              onChange={(e) => {
                e.stopPropagation();
                setReviewNotes(p => ({ ...p, [req.id]: e.target.value }));
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button 
                size="sm" 
                className="gap-1 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  base44.entities.VolunteerApproval.update(req.id, {
                    status: 'approved',
                    reviewed_by: 'admin@candorasociety.com',
                    review_date: moment().format('YYYY-MM-DD'),
                    review_notes: reviewNotes[req.id] || '',
                  });
                  queryClient.invalidateQueries({ queryKey: ['vol-practicum-requests'] });
                  queryClient.invalidateQueries({ queryKey: ['vol-approvals-all'] });
                }}
              >
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => {
                  base44.entities.VolunteerApproval.update(req.id, {
                    status: 'rejected',
                    reviewed_by: 'admin@candorasociety.com',
                    review_date: moment().format('YYYY-MM-DD'),
                    review_notes: reviewNotes[req.id] || '',
                  });
                  queryClient.invalidateQueries({ queryKey: ['vol-practicum-requests'] });
                  queryClient.invalidateQueries({ queryKey: ['vol-approvals-all'] });
                }}
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
            </div>
          </div>
        )}
        {req.review_notes && <p className="text-xs text-muted-foreground border-t pt-2"><strong>Notes:</strong> {req.review_notes}</p>}
      </CardContent>
    </Card>
  );

  const renderProfileChangeCard = (change, isClickable = true) => (
    <Card 
      key={change.id} 
      className={`shadow-sm ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={() => isClickable && setSelectedRequest({ type: 'profile', data: change })}
    >
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
        <p className="text-xs text-muted-foreground">Submitted: {moment.utc(change.submitted_date).tz('America/Edmonton').format('MMM D, YYYY h:mm A')}</p>

        {change.status === 'pending' && (
          <Button size="sm" variant="outline" className="w-full mt-2" onClick={(e) => { e.stopPropagation(); setSelectedRequest({ type: 'profile', data: change }); }}>
            View Details
          </Button>
        )}

        {change.status === 'pending' && (
          <div className="space-y-2 pt-2 border-t">
            <Textarea
              placeholder="Review notes (optional)..."
              rows={2}
              value={reviewNotes[change.id] || ''}
              onChange={(e) => {
                e.stopPropagation();
                setReviewNotes(p => ({ ...p, [change.id]: e.target.value }));
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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

  const renderCard = (req, isClickable = true) => {
    const config = typeConfig[req.request_type] || { icon: AlertCircle, label: req.request_type, color: 'bg-muted' };
    const Icon = config.icon;

    return (
      <Card 
        key={req.id} 
        className={`shadow-sm ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        onClick={() => isClickable && setSelectedRequest({ type: 'approval', data: req })}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-sm">{req.volunteer_name || 'Unknown Volunteer'}</p>
              <Badge className={`text-xs mt-1 ${config.color}`}><Icon className="w-3 h-3 mr-1" />{config.label}</Badge>
            </div>
            <Badge className={`text-xs border shrink-0 ${statusColors[req.status]}`}>{req.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{req.description}</p>
          <p className="text-xs text-muted-foreground">Submitted: {moment.utc(req.created_date).tz('America/Edmonton').format('MMM D, YYYY h:mm A')}</p>

          {req.status === 'pending' && (
            <Button size="sm" variant="outline" className="w-full mt-2" onClick={(e) => { e.stopPropagation(); setSelectedRequest({ type: 'approval', data: req }); }}>
              View Details
            </Button>
          )}

          {req.status === 'pending' && (
            <div className="space-y-2 pt-2 border-t">
              <Textarea
                placeholder="Review notes (optional)..."
                rows={2}
                value={reviewNotes[req.id] || ''}
                onChange={(e) => {
                  e.stopPropagation();
                  setReviewNotes(p => ({ ...p, [req.id]: e.target.value }));
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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

      {pendingPracticumRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Practicum Placements ({pendingPracticumRequests.length})</h2>
          {pendingPracticumRequests.map(renderPracticumCard)}
        </div>
      )}

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

      {resolvedPracticumRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resolved Practicum Placements ({resolvedPracticumRequests.length})</h2>
          {resolvedPracticumRequests.map(req => renderPracticumCard(req, false))}
        </div>
      )}

      {resolvedCohortRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resolved Cohort Requests ({resolvedCohortRequests.length})</h2>
          {resolvedCohortRequests.map(req => renderCohortCard(req, false))}
        </div>
      )}

      {resolvedProfileChanges.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resolved Profile Changes ({resolvedProfileChanges.length})</h2>
          {resolvedProfileChanges.map(change => renderProfileChangeCard(change, false))}
        </div>
      )}

      {resolvedApprovals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resolved Other ({resolvedApprovals.length})</h2>
          {resolvedApprovals.map(req => renderCard(req, false))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedRequest?.type === 'cohort' && selectedRequest?.data?.organization_name}
              {selectedRequest?.type === 'practicum' && selectedRequest?.data?.volunteer_name}
              {selectedRequest?.type === 'profile' && selectedRequest?.data?.volunteer_name}
              {selectedRequest?.type === 'approval' && selectedRequest?.data?.volunteer_name}
            </DialogTitle>
            <DialogDescription className="mt-1">
              {selectedRequest?.type === 'cohort' && 'Cohort Registration Request'}
              {selectedRequest?.type === 'practicum' && 'Practicum Placement Request'}
              {selectedRequest?.type === 'profile' && 'Profile Change Request'}
              {selectedRequest?.type === 'approval' && 'Volunteer Approval Request'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest?.type === 'cohort' && (
            <div className="space-y-6">
              {/* Organization Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Organization Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Organization Name</p>
                    <p className="font-medium">{selectedRequest.data.organization_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Organization Type</p>
                    <p className="font-medium">{selectedRequest.data.organization_type?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Contact Person</p>
                    <p className="font-medium">{selectedRequest.data.contact_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedRequest.data.contact_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedRequest.data.contact_phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Vulnerable Sector Check */}
              {selectedRequest.data.vulnerable_sector_check && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-semibold text-sm">✓ Vulnerable Sector Check Acknowledged</p>
                  <p className="text-yellow-700 text-sm mt-1">Organization acknowledges that volunteers may be required to complete a Vulnerable Sector Check</p>
                </div>
              )}

              {/* Volunteer Group Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Volunteer Group Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Number of Volunteers</p>
                    <p className="font-medium">{selectedRequest.data.number_of_volunteers}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Preferred Start Date</p>
                    <p className="font-medium">{selectedRequest.data.preferred_start_date ? moment(selectedRequest.data.preferred_start_date).format('MMMM D, YYYY') : 'Not specified'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">General Availability</p>
                  <p className="font-medium">{selectedRequest.data.availability || 'Not specified'}</p>
                </div>
              </div>

              {/* Areas of Interest */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Areas of Interest</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.data.areas_of_interest?.length > 0 ? (
                    selectedRequest.data.areas_of_interest.map(area => (
                      <Badge key={area} variant="secondary" className="text-sm">{area}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">Not specified</span>
                  )}
                </div>
              </div>

              {/* Skills and Motivation */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Skills & Motivation</h3>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Skills or Focus Areas</p>
                  <p className="font-medium text-sm">{selectedRequest.data.skills_or_focus || 'Not specified'}</p>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Motivation</p>
                  <p className="font-medium text-sm">{selectedRequest.data.motivation || 'Not specified'}</p>
                </div>
              </div>

              

              {/* Donation Information */}
              {selectedRequest.data.include_donation && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Donation Information</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-900 font-semibold text-sm">Donation Included</p>
                    <div className="mt-2 text-sm text-blue-700">
                      <p><strong>Amount:</strong> ${selectedRequest.data.donation_amount}</p>
                      <p className="mt-1"><strong>Message:</strong> {selectedRequest.data.donation_message || 'No message provided'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Information */}
              {(selectedRequest.data.notes || selectedRequest.data.status || selectedRequest.data.approved_by) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Admin Information</h3>
                  {selectedRequest.data.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="font-medium text-sm bg-muted p-3 rounded">{selectedRequest.data.notes}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge className={`mt-1 ${statusColors[selectedRequest.data.status]}`}>{selectedRequest.data.status}</Badge>
                    </div>
                    {selectedRequest.data.approved_by && (
                      <div>
                        <p className="text-xs text-muted-foreground">Approved By</p>
                        <p className="font-medium text-sm">{selectedRequest.data.approved_by}</p>
                      </div>
                    )}
                    {selectedRequest.data.approval_date && (
                      <div>
                        <p className="text-xs text-muted-foreground">Approval Date</p>
                        <p className="font-medium text-sm">{moment(selectedRequest.data.approval_date).format('MMMM D, YYYY')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Portal Card Status */}
              {selectedRequest.data.card_created && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold text-sm">✓ Portal Card Created</p>
                  <p className="text-green-700 text-sm mt-1">Card ID: {selectedRequest.data.card_id}</p>
                </div>
              )}

              {/* Submission Date */}
              <div className="text-xs text-muted-foreground pt-4 border-t mt-6">
                <p>Submitted: {moment(selectedRequest.data.created_date).tz('America/Edmonton').format('MMMM D, YYYY [at] h:mm A z')}</p>
              </div>
            </div>
          )}

          {selectedRequest?.type === 'practicum' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Request Details</h3>
                <p className="text-sm">{selectedRequest.data.description}</p>
              </div>
              {selectedRequest.data.review_notes && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Review Notes</h3>
                  <p className="text-sm bg-muted p-3 rounded">{selectedRequest.data.review_notes}</p>
                </div>
              )}
              <div className="text-xs text-muted-foreground pt-4 border-t mt-6">
                <p>Submitted: {moment.utc(selectedRequest.data.created_date).tz('America/Edmonton').format('MMMM D, YYYY [at] h:mm A z')}</p>
                {selectedRequest.data.review_date && <p>Reviewed: {moment.utc(selectedRequest.data.review_date).tz('America/Edmonton').format('MMMM D, YYYY [at] h:mm A z')}</p>}
              </div>
            </div>
          )}

          {selectedRequest?.type === 'profile' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Summary of Changes</h3>
                <p className="font-medium text-sm">{selectedRequest.data.change_summary}</p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Detailed Changes</h3>
                <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                  {JSON.stringify(selectedRequest.data.changes_requested, null, 2)}
                </pre>
              </div>
              {selectedRequest.data.review_notes && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Review Notes</h3>
                  <p className="text-sm bg-muted p-3 rounded">{selectedRequest.data.review_notes}</p>
                </div>
              )}
              <div className="text-xs text-muted-foreground pt-4 border-t mt-6">
                <p>Submitted: {moment.utc(selectedRequest.data.submitted_date).tz('America/Edmonton').format('MMMM D, YYYY [at] h:mm A z')}</p>
                {selectedRequest.data.reviewed_by && <p>Reviewed by: {selectedRequest.data.reviewed_by}</p>}
              </div>
            </div>
          )}

          {selectedRequest?.type === 'approval' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Request Type</h3>
                <Badge className="text-sm">{typeConfig[selectedRequest.data.request_type]?.label || selectedRequest.data.request_type}</Badge>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Description</h3>
                <p className="text-sm">{selectedRequest.data.description}</p>
              </div>
              {selectedRequest.data.review_notes && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Review Notes</h3>
                  <p className="text-sm bg-muted p-3 rounded">{selectedRequest.data.review_notes}</p>
                </div>
              )}
              <div className="text-xs text-muted-foreground pt-4 border-t mt-6">
                <p>Submitted: {moment.utc(selectedRequest.data.created_date).tz('America/Edmonton').format('MMMM D, YYYY [at] h:mm A z')}</p>
                {selectedRequest.data.review_date && <p>Reviewed: {moment.utc(selectedRequest.data.review_date).tz('America/Edmonton').format('MMMM D, YYYY [at] h:mm A z')}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}