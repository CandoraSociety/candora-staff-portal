import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, UserPlus, Edit, AlertCircle, Building2, X } from 'lucide-react';
import moment from 'moment-timezone';
import { toast } from 'sonner';
import RejectionDialog from '@/components/volunteermgr/RejectionDialog';
import WaitlistDialog from '@/components/volunteermgr/WaitlistDialog';

const typeConfig = {
  new_registration: { icon: UserPlus, label: 'New Registration', color: 'bg-blue-50 text-blue-700' },
  profile_change: { icon: Edit, label: 'Profile Change', color: 'bg-amber-50 text-amber-700' },
  hour_adjustment: { icon: Clock, label: 'Hour Adjustment', color: 'bg-purple-50 text-purple-700' },
  cohort_registration: { icon: Building2, label: 'Cohort Registration', color: 'bg-indigo-50 text-indigo-700' },
  practicum_placement: { icon: Building2, label: 'Practicum Placement', color: 'bg-emerald-50 text-emerald-700' },
};

const rejectionReasons = {
  not_in_good_standing: 'Volunteer is not in good standing',
  account_exists: 'Account already exists',
  more_info_needed: 'More information needed',
  other: 'Other',
};

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  waitlisted: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function VolunteerMgrApprovals() {
  const [reviewNotes, setReviewNotes] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [volunteerData, setVolunteerData] = useState(null);
  const [rejectionDialog, setRejectionDialog] = useState({ open: false, type: null, data: null });
  const [waitlistDialog, setWaitlistDialog] = useState({ open: false, type: null, data: null });
  const queryClient = useQueryClient();

  // Fetch full volunteer data when viewing a new_registration approval
  useEffect(() => {
    if (selectedRequest?.type === 'approval' && selectedRequest.data.request_type === 'new_registration' && selectedRequest.data.volunteer_id) {
      base44.entities.Volunteer.get(selectedRequest.data.volunteer_id)
        .then(setVolunteerData)
        .catch(() => setVolunteerData(null));
    } else {
      setVolunteerData(null);
    }
  }, [selectedRequest]);

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

  const handleWaitlist = async (requestType, reason, details, sendEmail, emailBody) => {
    const { data } = waitlistDialog;
    
    try {
      if (requestType === 'practicum') {
        await base44.entities.VolunteerApproval.update(data.id, {
          status: 'waitlisted',
          reviewed_by: 'admin@candorasociety.com',
          review_date: moment().format('YYYY-MM-DD'),
          review_notes: reviewNotes[data.id] || (details ? `Waitlisted: ${details}` : 'Waitlisted'),
        });
        if (data.volunteer_id) {
          await base44.entities.Volunteer.update(data.volunteer_id, { 
            status: 'waitlist',
            notes: details || '',
            start_date: moment().format('YYYY-MM-DD')
          });
        }
        queryClient.invalidateQueries({ queryKey: ['vol-practicum-requests'] });
        queryClient.invalidateQueries({ queryKey: ['vol-approvals-all'] });
        
        if (sendEmail && data.volunteer_email) {
          await base44.functions.invoke('sendRejectionEmail', {
            to: data.volunteer_email,
            subject: 'Candora Society Practicum Application - Waitlist Status',
            body: emailBody || `Dear ${data.volunteer_name},\n\nThank you for your interest in a practicum placement with The Candora Society. We appreciate your enthusiasm and commitment.\n\nDue to current capacity, we are placing your application on our waitlist. This means we will keep your information on file and contact you as soon as a suitable opportunity becomes available.\n\nWe truly value your interest in making a difference with us and look forward to connecting with you soon.\n\nWarm regards,\nThe Candora Society Volunteer Team`,
          });
        }
      } else {
        await base44.entities.VolunteerApproval.update(data.id, {
          status: 'waitlisted',
          reviewed_by: 'admin@candorasociety.com',
          review_date: moment().format('YYYY-MM-DD'),
          review_notes: reviewNotes[data.id] || (details ? `Waitlisted: ${details}` : 'Waitlisted'),
        });
        if (data.volunteer_id) {
          await base44.entities.Volunteer.update(data.volunteer_id, { 
            status: 'waitlist',
            notes: details || ''
          });
        }
        queryClient.invalidateQueries({ queryKey: ['vol-approvals-all'] });
        queryClient.invalidateQueries({ queryKey: ['vol-approvals'] });
        
        if (sendEmail && data.volunteer_email) {
          await base44.functions.invoke('sendRejectionEmail', {
            to: data.volunteer_email,
            subject: 'Candora Society Volunteer Application - Waitlist Status',
            body: emailBody || `Dear ${data.volunteer_name},\n\nThank you for your interest in volunteering with The Candora Society. We appreciate your enthusiasm and commitment.\n\nDue to current capacity, we are placing your application on our waitlist. This means we will keep your information on file and contact you as soon as a suitable opportunity becomes available.\n\nWe truly value your interest in making a difference with us and look forward to connecting with you soon.\n\nWarm regards,\nThe Candora Society Volunteer Team`,
          });
        }
      }
      
      toast.success('Request placed on waitlist' + (sendEmail ? ' and email sent' : ''));
      setWaitlistDialog({ open: false, type: null, data: null });
    } catch (error) {
      toast.error('Failed to waitlist: ' + (error.message || 'Unknown error'));
    }
  };

  const handleRejection = async (requestType, reason, details, sendEmail, emailBody) => {
    const { data } = rejectionDialog;
    
    try {
      // Update the record with rejection details
      if (requestType === 'cohort') {
        await base44.entities.VolunteerCohortRequest.update(data.id, {
          status: 'rejected',
          approved_by: 'admin@candorasociety.com',
          approval_date: moment().format('YYYY-MM-DD'),
          rejection_reason: reason,
          rejection_details: details,
          notes: reviewNotes[data.id] || '',
        });
        queryClient.invalidateQueries({ queryKey: ['vol-cohort-requests'] });
        
        // Send email if requested
        if (sendEmail && data.contact_email) {
          await base44.functions.invoke('sendRejectionEmail', {
            to: data.contact_email,
            subject: 'Candora Society Volunteer Request Update',
            body: emailBody || `Dear ${data.organization_name},\n\nThank you for your interest in volunteering with The Candora Society. After careful review, we are unable to move forward with your request at this time.\n\nWe appreciate your understanding and wish you all the best.\n\nWarm regards,\nThe Candora Society Volunteer Team`,
          });
        }
      } else if (requestType === 'practicum') {
        await base44.entities.VolunteerApproval.update(data.id, {
          status: 'rejected',
          reviewed_by: 'admin@candorasociety.com',
          review_date: moment().format('YYYY-MM-DD'),
          rejection_reason: reason,
          rejection_details: details,
          review_notes: reviewNotes[data.id] || '',
        });
        queryClient.invalidateQueries({ queryKey: ['vol-practicum-requests'] });
        queryClient.invalidateQueries({ queryKey: ['vol-approvals-all'] });
        
        if (sendEmail && data.volunteer_email) {
          await base44.functions.invoke('sendRejectionEmail', {
            to: data.volunteer_email,
            subject: 'Practicum Placement Request Update',
            body: emailBody || `Dear ${data.volunteer_name},\n\nThank you for your interest in a practicum placement with The Candora Society. After careful review, we are unable to move forward with your request at this time.\n\nWe appreciate your understanding and wish you all the best.\n\nWarm regards,\nThe Candora Society Volunteer Team`,
          });
        }
      } else if (requestType === 'profile') {
        await base44.entities.VolunteerProfileChange.update(data.id, {
          status: 'rejected',
          reviewed_by: 'admin@candorasociety.com',
          review_date: moment().format('YYYY-MM-DD'),
          rejection_reason: reason,
          rejection_details: details,
          review_notes: reviewNotes[data.id] || '',
        });
        queryClient.invalidateQueries({ queryKey: ['vol-profile-changes'] });
        
        if (sendEmail && data.volunteer_email) {
          await base44.functions.invoke('sendRejectionEmail', {
            to: data.volunteer_email,
            subject: 'Profile Change Request Update',
            body: emailBody || `Dear ${data.volunteer_name},\n\nThank you for your profile update request. After review, we are unable to approve these changes at this time.\n\nPlease contact us if you have questions.\n\nWarm regards,\nThe Candora Society Volunteer Team`,
          });
        }
      } else if (requestType === 'approval') {
        await base44.entities.VolunteerApproval.update(data.id, {
          status: 'rejected',
          reviewed_by: 'admin@candorasociety.com',
          review_date: moment().format('YYYY-MM-DD'),
          rejection_reason: reason,
          rejection_details: details,
          review_notes: reviewNotes[data.id] || '',
        });
        queryClient.invalidateQueries({ queryKey: ['vol-approvals-all'] });
        queryClient.invalidateQueries({ queryKey: ['vol-approvals'] });
        
        if (sendEmail && data.volunteer_email) {
          await base44.functions.invoke('sendRejectionEmail', {
            to: data.volunteer_email,
            subject: 'Volunteer Application Update',
            body: emailBody || `Dear ${data.volunteer_name},\n\nThank you for your interest in volunteering with The Candora Society. After careful review, we are unable to move forward with your application at this time.\n\nWe appreciate your understanding and wish you all the best.\n\nWarm regards,\nThe Candora Society Volunteer Team`,
          });
        }
      }
      
      toast.success('Request rejected' + (sendEmail ? ' and email sent' : ''));
      setRejectionDialog({ open: false, type: null, data: null });
    } catch (error) {
      toast.error('Failed to reject: ' + (error.message || 'Unknown error'));
    }
  };

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

  const undoRejectionMutation = useMutation({
    mutationFn: async ({ id, type }) => {
      if (type === 'cohort') {
        await base44.entities.VolunteerCohortRequest.update(id, {
          status: 'pending',
          approved_by: null,
          approval_date: null,
          rejection_reason: null,
          rejection_details: null,
        });
      } else if (type === 'practicum') {
        await base44.entities.VolunteerApproval.update(id, {
          status: 'pending',
          reviewed_by: null,
          review_date: null,
          rejection_reason: null,
          rejection_details: null,
        });
      } else if (type === 'profile') {
        await base44.entities.VolunteerProfileChange.update(id, {
          status: 'pending',
          reviewed_by: null,
          review_date: null,
          rejection_reason: null,
          rejection_details: null,
        });
      } else if (type === 'approval') {
        await base44.entities.VolunteerApproval.update(id, {
          status: 'pending',
          reviewed_by: null,
          review_date: null,
          rejection_reason: null,
          rejection_details: null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-approvals-all'] });
      queryClient.invalidateQueries({ queryKey: ['vol-cohort-requests'] });
      queryClient.invalidateQueries({ queryKey: ['vol-practicum-requests'] });
      queryClient.invalidateQueries({ queryKey: ['vol-profile-changes'] });
      toast.success('Rejection undone - request restored to pending');
    },
  });

  const undoApprovalMutation = useMutation({
    mutationFn: async ({ id, type }) => {
      if (type === 'cohort') {
        await base44.entities.VolunteerCohortRequest.update(id, {
          status: 'pending',
          approved_by: null,
          approval_date: null,
          card_created: false,
          card_id: null,
        });
      } else if (type === 'practicum') {
        await base44.entities.VolunteerApproval.update(id, {
          status: 'pending',
          reviewed_by: null,
          review_date: null,
          review_notes: null,
        });
        const req = practicumRequests.find(r => r.id === id);
        if (req?.volunteer_id) {
          await base44.entities.Volunteer.update(req.volunteer_id, { status: 'pending' });
        }
      } else if (type === 'approval') {
        await base44.entities.VolunteerApproval.update(id, {
          status: 'pending',
          reviewed_by: null,
          review_date: null,
          review_notes: null,
        });
        const req = approvals.find(r => r.id === id);
        if (req?.volunteer_id && req?.request_type === 'new_registration') {
          await base44.entities.Volunteer.update(req.volunteer_id, { status: 'pending' });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-approvals-all'] });
      queryClient.invalidateQueries({ queryKey: ['vol-cohort-requests'] });
      queryClient.invalidateQueries({ queryKey: ['vol-practicum-requests'] });
      queryClient.invalidateQueries({ queryKey: ['vol-volunteers'] });
      toast.success('Approval undone - request restored to pending');
    },
  });

  const undoWaitlistMutation = useMutation({
    mutationFn: async ({ id, type }) => {
      if (type === 'practicum') {
        await base44.entities.VolunteerApproval.update(id, {
          status: 'pending',
          reviewed_by: null,
          review_date: null,
          review_notes: null,
        });
        const req = practicumRequests.find(r => r.id === id);
        if (req?.volunteer_id) {
          await base44.entities.Volunteer.update(req.volunteer_id, { status: 'pending' });
        }
      } else if (type === 'approval') {
        await base44.entities.VolunteerApproval.update(id, {
          status: 'pending',
          reviewed_by: null,
          review_date: null,
          review_notes: null,
        });
        const req = approvals.find(r => r.id === id);
        if (req?.volunteer_id) {
          await base44.entities.Volunteer.update(req.volunteer_id, { status: 'pending' });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-approvals-all'] });
      queryClient.invalidateQueries({ queryKey: ['vol-practicum-requests'] });
      queryClient.invalidateQueries({ queryKey: ['vol-volunteers'] });
      toast.success('Waitlist undone - request restored to pending');
    },
  });

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const waitlistedApprovals = approvals.filter(a => a.status === 'waitlisted');
  const pendingProfileChanges = profileChanges.filter(c => c.status === 'pending');
  const pendingCohortRequests = cohortRequests.filter(c => c.status === 'pending');
  const resolvedCohortRequests = cohortRequests.filter(c => c.status !== 'pending');
  const pendingPracticumRequests = practicumRequests.filter(p => p.status === 'pending');
  const waitlistedPracticumRequests = practicumRequests.filter(p => p.status === 'waitlisted');
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

        {req.status === 'rejected' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full mt-2 text-primary hover:text-primary/90"
            onClick={(e) => { 
              e.stopPropagation(); 
              if (confirm('Undo this rejection? The request will be restored to pending status.')) {
                undoRejectionMutation.mutate({ id: req.id, type: 'cohort' });
              }
            }}
          >
            <Clock className="w-3.5 h-3.5 mr-1" /> Undo Rejection
          </Button>
        )}

        {req.status === 'approved' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full mt-2 text-primary hover:text-primary/90"
            onClick={(e) => { 
              e.stopPropagation(); 
              if (confirm('Undo this approval? The request will be restored to pending status.')) {
                undoApprovalMutation.mutate({ id: req.id, type: 'cohort' });
              }
            }}
          >
            <Clock className="w-3.5 h-3.5 mr-1" /> Undo Approval
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
                onClick={() => setRejectionDialog({ open: true, type: 'cohort', data: req })}
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

        {req.status === 'rejected' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full mt-2 text-primary hover:text-primary/90"
            onClick={(e) => { 
              e.stopPropagation(); 
              if (confirm('Undo this rejection? The request will be restored to pending status.')) {
                undoRejectionMutation.mutate({ id: req.id, type: 'practicum' });
              }
            }}
          >
            <Clock className="w-3.5 h-3.5 mr-1" /> Undo Rejection
          </Button>
        )}

        {req.status === 'approved' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full mt-2 text-primary hover:text-primary/90"
            onClick={(e) => { 
              e.stopPropagation(); 
              if (confirm('Undo this approval? The request will be restored to pending status.')) {
                undoApprovalMutation.mutate({ id: req.id, type: 'practicum' });
              }
            }}
          >
            <Clock className="w-3.5 h-3.5 mr-1" /> Undo Approval
          </Button>
        )}

        {req.status === 'waitlisted' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full mt-2 text-primary hover:text-primary/90"
            onClick={(e) => { 
              e.stopPropagation(); 
              if (confirm('Undo this waitlist? The request will be restored to pending status.')) {
                undoWaitlistMutation.mutate({ id: req.id, type: 'practicum' });
              }
            }}
          >
            <Clock className="w-3.5 h-3.5 mr-1" /> Undo Waitlist
          </Button>
        )}

        {req.status === 'pending' && (
          <div className="space-y-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
            <Textarea
              placeholder="Review notes (optional)..."
              rows={2}
              value={reviewNotes[req.id] || ''}
              onChange={(e) => {
                e.stopPropagation();
                setReviewNotes(p => ({ ...p, [req.id]: e.target.value }));
              }}
            />
            <div className="flex gap-2">
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
                  if (req.volunteer_id) {
                    base44.entities.Volunteer.update(req.volunteer_id, { status: 'active', start_date: moment().format('YYYY-MM-DD') });
                  }
                  queryClient.invalidateQueries({ queryKey: ['vol-practicum-requests'] });
                  queryClient.invalidateQueries({ queryKey: ['vol-approvals-all'] });
                }}
              >
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-1 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => setWaitlistDialog({ open: true, type: 'practicum', data: req })}
              >
                <Clock className="w-3.5 h-3.5" /> Waitlist
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setRejectionDialog({ open: true, type: 'practicum', data: req })}
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

        {change.status === 'rejected' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full mt-2 text-primary hover:text-primary/90"
            onClick={(e) => { 
              e.stopPropagation(); 
              if (confirm('Undo this rejection? The request will be restored to pending status.')) {
                undoRejectionMutation.mutate({ id: change.id, type: 'profile' });
              }
            }}
          >
            <Clock className="w-3.5 h-3.5 mr-1" /> Undo Rejection
          </Button>
        )}

        {change.status === 'pending' && (
          <div className="space-y-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
            <Textarea
              placeholder="Review notes (optional)..."
              rows={2}
              value={reviewNotes[change.id] || ''}
              onChange={(e) => {
                e.stopPropagation();
                setReviewNotes(p => ({ ...p, [change.id]: e.target.value }));
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700"
                onClick={() => updateProfileChangeMutation.mutate({ id: change.id, status: 'approved', notes: reviewNotes[change.id] })}>
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setRejectionDialog({ open: true, type: 'profile', data: change })}>
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

          {req.status === 'rejected' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full mt-2 text-primary hover:text-primary/90"
              onClick={(e) => { 
                e.stopPropagation(); 
                if (confirm('Undo this rejection? The request will be restored to pending status.')) {
                  undoRejectionMutation.mutate({ id: req.id, type: 'approval' });
                }
              }}
            >
              <Clock className="w-3.5 h-3.5 mr-1" /> Undo Rejection
            </Button>
          )}

          {req.status === 'approved' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full mt-2 text-primary hover:text-primary/90"
              onClick={(e) => { 
                e.stopPropagation(); 
                if (confirm('Undo this approval? The request will be restored to pending status.')) {
                  undoApprovalMutation.mutate({ id: req.id, type: 'approval' });
                }
              }}
            >
              <Clock className="w-3.5 h-3.5 mr-1" /> Undo Approval
            </Button>
          )}

          {req.status === 'waitlisted' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full mt-2 text-primary hover:text-primary/90"
              onClick={(e) => { 
                e.stopPropagation(); 
                if (confirm('Undo this waitlist? The request will be restored to pending status.')) {
                  undoWaitlistMutation.mutate({ id: req.id, type: 'approval' });
                }
              }}
            >
              <Clock className="w-3.5 h-3.5 mr-1" /> Undo Waitlist
            </Button>
          )}

          {req.status === 'pending' && (
            <div className="space-y-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
              <Textarea
                placeholder="Review notes (optional)..."
                rows={2}
                value={reviewNotes[req.id] || ''}
                onChange={(e) => {
                  e.stopPropagation();
                  setReviewNotes(p => ({ ...p, [req.id]: e.target.value }));
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700"
                  onClick={() => updateMutation.mutate({ id: req.id, status: 'approved', notes: reviewNotes[req.id], volunteerStatus: 'active' })}>
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="gap-1 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => setWaitlistDialog({ open: true, type: 'approval', data: req })}>
                  <Clock className="w-3.5 h-3.5" /> Waitlist
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setRejectionDialog({ open: true, type: 'approval', data: req })}>
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

  const totalPending = pendingApprovals.length + pendingProfileChanges.length + pendingCohortRequests.length + pendingPracticumRequests.length;
  const totalWaitlisted = waitlistedApprovals.length + waitlistedPracticumRequests.length;
  const totalResolved = resolvedApprovals.length + resolvedProfileChanges.length + resolvedCohortRequests.length + resolvedPracticumRequests.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">{totalPending} pending, {totalWaitlisted} waitlisted, {totalResolved} resolved</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - Pending Items */}
        <div className="lg:col-span-3 space-y-6">
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
        </div>

        {/* Sidebar - Waitlisted Items */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            {(waitlistedApprovals.length > 0 || waitlistedPracticumRequests.length > 0) && (
              <Card className="bg-amber-50/50 border-amber-200">
                <CardHeader className="pb-3 border-b border-amber-200">
                  <CardTitle className="text-sm font-semibold text-amber-800 uppercase tracking-wider">
                    Waitlisted ({totalWaitlisted})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {waitlistedPracticumRequests.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-amber-700 uppercase">Practicum</h3>
                      {waitlistedPracticumRequests.map(req => (
                        <Card 
                          key={req.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedRequest({ type: 'practicum', data: req })}
                        >
                          <CardContent className="p-3">
                            <p className="font-medium text-sm">{req.volunteer_name}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  {waitlistedApprovals.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-amber-700 uppercase">Other</h3>
                      {waitlistedApprovals.map(req => (
                        <Card 
                          key={req.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedRequest({ type: 'approval', data: req })}
                        >
                          <CardContent className="p-3">
                            <p className="font-medium text-sm">{req.volunteer_name || 'Unknown Volunteer'}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

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

      {/* Waitlist Dialog */}
      <WaitlistDialog
        open={waitlistDialog.open}
        onClose={() => setWaitlistDialog({ open: false, type: null, data: null })}
        onWaitlist={handleWaitlist}
        requestType={waitlistDialog.type}
        requestName={
          waitlistDialog.type === 'practicum' ? waitlistDialog.data?.volunteer_name :
          waitlistDialog.data?.volunteer_name
        }
        requesterEmail={
          waitlistDialog.type === 'practicum' ? waitlistDialog.data?.volunteer_email :
          waitlistDialog.data?.volunteer_email
        }
      />

      {/* Rejection Dialog */}
      <RejectionDialog
        open={rejectionDialog.open}
        onClose={() => setRejectionDialog({ open: false, type: null, data: null })}
        onReject={handleRejection}
        requestType={rejectionDialog.type}
        requestName={
          rejectionDialog.type === 'cohort' ? rejectionDialog.data?.organization_name :
          rejectionDialog.type === 'practicum' ? rejectionDialog.data?.volunteer_name :
          rejectionDialog.type === 'profile' ? rejectionDialog.data?.volunteer_name :
          rejectionDialog.data?.volunteer_name
        }
        requesterEmail={
          rejectionDialog.type === 'cohort' ? rejectionDialog.data?.contact_email :
          rejectionDialog.type === 'practicum' ? rejectionDialog.data?.volunteer_email :
          rejectionDialog.type === 'profile' ? rejectionDialog.data?.volunteer_email :
          rejectionDialog.data?.volunteer_email
        }
      />

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
              {/* Student Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Student Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Student Name</p>
                    <p className="font-medium">{selectedRequest.data.volunteer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedRequest.data.volunteer_email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedRequest.data.student_phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Institution Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Institution Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Institution</p>
                    <p className="font-medium">{selectedRequest.data.institution_name || selectedRequest.data.organization_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Faculty / Department</p>
                    <p className="font-medium">{selectedRequest.data.faculty || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Program / Course</p>
                    <p className="font-medium">{selectedRequest.data.program || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Year of Study</p>
                    <p className="font-medium">{selectedRequest.data.year_of_study || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Practicum Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Practicum Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-medium">{selectedRequest.data.practicum_start_date ? moment(selectedRequest.data.practicum_start_date).format('MMMM D, YYYY') : 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="font-medium">{selectedRequest.data.practicum_end_date ? moment(selectedRequest.data.practicum_end_date).format('MMMM D, YYYY') : 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Hours Required</p>
                    <p className="font-medium">{selectedRequest.data.total_hours_required || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Placement Area Preferences</p>
                  <p className="font-medium text-sm">{selectedRequest.data.placement_preferences || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Learning Goals</p>
                  <p className="font-medium text-sm">{selectedRequest.data.learning_goals || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Additional Requirements</p>
                  <p className="font-medium text-sm">{selectedRequest.data.additional_requirements || 'Not provided'}</p>
                </div>
              </div>

              {/* Coordinator Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Coordinator Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Coordinator Name</p>
                    <p className="font-medium">{selectedRequest.data.coordinator_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Coordinator Email</p>
                    <p className="font-medium">{selectedRequest.data.coordinator_email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Coordinator Phone</p>
                    <p className="font-medium">{selectedRequest.data.coordinator_phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Vulnerable Sector Check */}
              {selectedRequest.data.vulnerable_sector_check && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-semibold text-sm">✓ Vulnerable Sector Check Acknowledged</p>
                  <p className="text-yellow-700 text-sm mt-1">Student consents to undergoing a Vulnerable Sector Check as part of practicum requirements</p>
                </div>
              )}

              {/* Review Notes */}
              {selectedRequest.data.review_notes && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Review Notes</h3>
                  <p className="text-sm bg-muted p-3 rounded">{selectedRequest.data.review_notes}</p>
                </div>
              )}

              {/* Submission Date */}
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

              {/* New Registration - Show full volunteer form data */}
              {selectedRequest.data.request_type === 'new_registration' && volunteerData && (
                <>
                  {/* Personal Information */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Full Name</p>
                        <p className="font-medium">{volunteerData.first_name} {volunteerData.last_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{volunteerData.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{volunteerData.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">{volunteerData.birth_date ? moment(volunteerData.birth_date).format('MMMM D, YYYY') : 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sex</p>
                        <p className="font-medium">{volunteerData.gender || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Volunteer Type</p>
                        <p className="font-medium">{volunteerData.volunteer_type?.replace('_', ' ') || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">English Proficiency</p>
                        <p className="font-medium">{volunteerData.ell_level || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Address Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="font-medium">{volunteerData.address || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">City</p>
                        <p className="font-medium">{volunteerData.city || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Emergency Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Contact Name</p>
                        <p className="font-medium">{volunteerData.emergency_contact_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Contact Phone</p>
                        <p className="font-medium">{volunteerData.emergency_contact_phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Volunteer Preferences */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Volunteer Preferences</h3>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Areas of Interest</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {volunteerData.programs?.length > 0 ? (
                          volunteerData.programs.map(area => (
                            <Badge key={area} variant="secondary" className="text-sm">{area}</Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">Not specified</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">How They Heard</p>
                        <p className="font-medium">{volunteerData.how_heard || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Photo Consent</p>
                        <p className="font-medium">{volunteerData.pictures_consent === 'yes' ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Skills & Experience</p>
                      <p className="font-medium text-sm">{volunteerData.skills || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Motivation</p>
                      <p className="font-medium text-sm">{volunteerData.notes || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Availability</h3>
                    {volunteerData.availability_schedule && Object.keys(volunteerData.availability_schedule).length > 0 ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Weekly Schedule:</p>
                        <div className="space-y-1">
                          {Object.entries(volunteerData.availability_schedule).map(([day, slots]) => (
                            <div key={day} className="flex justify-between py-1 border-b border-muted">
                              <span className="capitalize text-sm font-medium">{day}</span>
                              <span className="text-sm text-muted-foreground">
                                {slots && slots.length > 0 ? slots.join(', ') : 'Not available'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No weekly schedule provided</p>
                    )}
                    {volunteerData.blocked_dates?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Blocked Dates:</p>
                        <div className="flex flex-wrap gap-2">
                          {volunteerData.blocked_dates.map((block, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {moment(block.date).format('MMM D, YYYY')}
                              {block.reason ? ` — ${block.reason}` : ''}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {!volunteerData.availability_schedule && (!volunteerData.blocked_dates || volunteerData.blocked_dates.length === 0) && (
                      <p className="text-sm text-muted-foreground">No availability information provided</p>
                    )}
                  </div>

                  {/* Vulnerable Sector Check */}
                  {volunteerData.vulnerable_sector_check && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 font-semibold text-sm">✓ Vulnerable Sector Check Acknowledged</p>
                      <p className="text-yellow-700 text-sm mt-1">Volunteer consents to undergoing a Vulnerable Sector Check if required</p>
                    </div>
                  )}

                  {/* Donation Information */}
                  {volunteerData.include_donation && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">Donation Information</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-900 font-semibold text-sm">Donation Included</p>
                        <div className="mt-2 text-sm text-blue-700">
                          <p><strong>Amount:</strong> ${volunteerData.donation_amount}</p>
                          <p className="mt-1"><strong>Message:</strong> {volunteerData.donation_message || 'No message provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Hour Adjustment */}
              {selectedRequest.data.request_type === 'hour_adjustment' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Date of Service</p>
                      <p className="font-medium">{selectedRequest.data.service_date ? moment(selectedRequest.data.service_date).format('MMMM D, YYYY') : 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Hours Requested</p>
                      <p className="font-medium">{selectedRequest.data.hours_adjustment || 'Not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reason for Adjustment</p>
                    <p className="font-medium text-sm">{selectedRequest.data.adjustment_reason || 'Not provided'}</p>
                  </div>
                </>
              )}

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

      {/* Rejection Dialog */}
      <RejectionDialog
        open={rejectionDialog.open}
        onClose={() => setRejectionDialog({ open: false, type: null, data: null })}
        onReject={handleRejection}
        requestType={rejectionDialog.type}
        requestName={
          rejectionDialog.type === 'cohort' ? rejectionDialog.data?.organization_name :
          rejectionDialog.type === 'practicum' ? rejectionDialog.data?.volunteer_name :
          rejectionDialog.type === 'profile' ? rejectionDialog.data?.volunteer_name :
          rejectionDialog.data?.volunteer_name
        }
        requesterEmail={
          rejectionDialog.type === 'cohort' ? rejectionDialog.data?.contact_email :
          rejectionDialog.type === 'practicum' ? rejectionDialog.data?.volunteer_email :
          rejectionDialog.type === 'profile' ? rejectionDialog.data?.volunteer_email :
          rejectionDialog.data?.volunteer_email
        }
      />
    </div>
  );
}