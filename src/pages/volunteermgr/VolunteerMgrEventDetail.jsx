import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Clock, Users, Pencil } from 'lucide-react';
import moment from 'moment';

const statusColors = {
  upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-gray-50 text-gray-500 border-gray-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function VolunteerMgrEventDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const { data: events = [] } = useQuery({
    queryKey: ['vol-events'],
    queryFn: () => base44.entities.VolunteerEvent.list('-date', 100),
  });

  const event = events.find((e) => e.id === id);

  const { data: signups = [] } = useQuery({
    queryKey: ['event-signups', id],
    queryFn: () => base44.entities.VolunteerEventSignup.filter({ event_id: id }),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const result = await base44.entities.VolunteerEvent.update(id, data);
      queryClient.invalidateQueries({ queryKey: ['vol-events'] });
      return result;
    },
    onSuccess: () => {
      setEditing(false);
    },
  });

  if (!event) {
    return (
      <div className="space-y-6">
        <Link to="/volunteermgr/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Event not found.</p>
        </div>
      </div>
    );
  }

  const signedUpCount = signups.length;
  const volunteersNeeded = event.volunteers_needed || 0;
  const isFull = volunteersNeeded > 0 && signedUpCount >= volunteersNeeded;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/volunteermgr/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
        <Button variant="outline" onClick={() => setEditing(true)} className="gap-2">
          <Pencil className="w-4 h-4" /> Edit Event
        </Button>
      </div>

      {/* Event Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="text-center min-w-[80px] bg-primary/10 rounded-xl p-4">
              <p className="text-sm text-primary font-medium">{moment(event.date).format('MMM')}</p>
              <p className="text-3xl font-bold text-primary">{moment(event.date).format('D')}</p>
              <p className="text-xs text-muted-foreground">{moment(event.date).format('YYYY')}</p>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold font-display">{event.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={statusColors[event.status]}>{event.status?.replace(/_/g, ' ')}</Badge>
                {event.is_placeholder && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300">Placeholder</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                {event.location && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />{event.location}
                  </span>
                )}
                {event.start_time && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />{event.start_time} - {event.end_time}
                  </span>
                )}
                {volunteersNeeded > 0 && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />{signedUpCount}/{volunteersNeeded} volunteers
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {event.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">About This Event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Volunteer Sign-ups */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" /> Volunteer Sign-ups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {signups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No volunteers signed up yet.</p>
          ) : (
            <div className="grid gap-3">
              {signups.map((signup) => (
                <div key={signup.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{signup.volunteer_name}</p>
                    {signup.position && (
                      <p className="text-xs text-muted-foreground">Role: {signup.position}</p>
                    )}
                    {signup.notes && (
                      <p className="text-xs text-muted-foreground">{signup.notes}</p>
                    )}
                  </div>
                  <Badge variant={signup.status === 'confirmed' || signup.status === 'attended' ? 'default' : 'secondary'}>
                    {signup.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          {isFull && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              This event has reached full capacity.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {event.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Contact */}
      {event.contact_person && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contact Person</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{event.contact_person}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog would go here - simplified for now */}
    </div>
  );
}