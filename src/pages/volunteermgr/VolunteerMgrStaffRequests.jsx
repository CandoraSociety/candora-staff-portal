import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import moment from 'moment';

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  in_review: 'bg-blue-50 text-blue-700 border-blue-200',
  fulfilled: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function VolunteerMgrStaffRequests() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [notes, setNotes] = useState({});
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['staff-volunteer-requests'],
    queryFn: () => base44.entities.StaffVolunteerRequest.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, note }) =>
      base44.entities.StaffVolunteerRequest.update(id, { status, additional_notes: note }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-volunteer-requests'] }),
  });

  const filtered = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter);

  const counts = {
    pending: requests.filter(r => r.status === 'pending').length,
    in_review: requests.filter(r => r.status === 'in_review').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <ClipboardList className="w-6 h-6" /> Staff Volunteer Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {requests.length} total · {counts.pending} pending · {counts.in_review} in review
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="fulfilled">Fulfilled</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map(req => (
          <Card key={req.id} className="shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{req.position_title}</p>
                  <p className="text-sm text-muted-foreground">
                    {req.requester_name}
                    {req.requester_department && ` · ${req.requester_department}`}
                    {req.requester_email && ` · ${req.requester_email}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{moment(req.created_date).format('MMM D, YYYY')}</p>
                </div>
                <Badge className={`text-xs border shrink-0 ${statusColors[req.status]}`}>
                  {req.status?.replace(/_/g, ' ')}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-sm">
                {req.program && <div><span className="text-muted-foreground">Program: </span>{req.program}</div>}
                {req.volunteers_needed && <div><span className="text-muted-foreground">Volunteers needed: </span>{req.volunteers_needed}</div>}
                {req.location && <div><span className="text-muted-foreground">Location: </span>{req.location}</div>}
                {req.when_needed && <div><span className="text-muted-foreground">When: </span>{req.when_needed}</div>}
                {req.duration && <div><span className="text-muted-foreground">Duration: </span>{req.duration}</div>}
                {req.english_level && <div><span className="text-muted-foreground">English: </span>{req.english_level}</div>}
                {req.criminal_record_check && <div className="text-amber-700">⚠ CRC Required</div>}
                {req.intervention_record_check && <div className="text-amber-700">⚠ IRC Required</div>}
              </div>

              {req.duties && <div className="text-sm"><span className="font-medium">Duties: </span>{req.duties}</div>}
              {req.personal_qualities && <div className="text-sm"><span className="font-medium">Qualities: </span>{req.personal_qualities}</div>}
              {req.additional_notes && <div className="text-sm text-muted-foreground border-t pt-2">{req.additional_notes}</div>}

              {req.status !== 'fulfilled' && req.status !== 'closed' && (
                <div className="border-t pt-3 space-y-2">
                  <Textarea
                    placeholder="Add a note..."
                    rows={1}
                    value={notes[req.id] || ''}
                    onChange={e => setNotes(p => ({ ...p, [req.id]: e.target.value }))}
                    className="text-sm"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {req.status === 'pending' && (
                      <Button size="sm" variant="outline" className="gap-1"
                        onClick={() => updateMutation.mutate({ id: req.id, status: 'in_review', note: notes[req.id] })}>
                        <Clock className="w-3.5 h-3.5" /> Mark In Review
                      </Button>
                    )}
                    <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700"
                      onClick={() => updateMutation.mutate({ id: req.id, status: 'fulfilled', note: notes[req.id] })}>
                      <CheckCircle className="w-3.5 h-3.5" /> Fulfilled
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-muted-foreground"
                      onClick={() => updateMutation.mutate({ id: req.id, status: 'closed', note: notes[req.id] })}>
                      <XCircle className="w-3.5 h-3.5" /> Close
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No requests found.</p>
          </div>
        )}
      </div>
    </div>
  );
}