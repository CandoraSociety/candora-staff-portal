import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import moment from 'moment';

export default function PortalShiftSignup({ volunteerId, onBack }) {
  if (!onBack) onBack = () => {};
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['volunteer-events-upcoming'],
    queryFn: () => base44.entities.VolunteerEvent.filter({ status: 'upcoming' }),
  });

  const { data: mySignups = [] } = useQuery({
    queryKey: ['my-signups', volunteerId],
    queryFn: () => base44.entities.VolunteerEventSignup.filter({ volunteer_id: volunteerId }),
    enabled: !!volunteerId,
  });

  const signupMutation = useMutation({
    mutationFn: async ({ eventId, isWaitlist }) => {
      const event = events.find(e => e.id === eventId);
      const signup = await base44.entities.VolunteerEventSignup.create({
        volunteer_id: volunteerId,
        event_id: eventId,
        event_title: event?.title || 'Unknown Event',
        event_date: event?.date,
        status: isWaitlist ? 'waitlist' : 'confirmed',
        is_waitlist: isWaitlist || false,
        signup_date: new Date().toISOString(),
      });
      
      // Update event counts
      if (isWaitlist) {
        await base44.entities.VolunteerEvent.update(eventId, {
          waitlist_count: (event.waitlist_count || 0) + 1
        });
      } else {
        await base44.entities.VolunteerEvent.update(eventId, {
          volunteers_signed_up: (event.volunteers_signed_up || 0) + 1
        });
      }
      
      return signup;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-events-upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['my-signups'] });
      setSuccessMsg(variables.isWaitlist ? 'Added to waitlist! You will be notified if a spot opens up.' : 'Successfully signed up for the event!');
      setSelectedEvent(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const cancelSignupMutation = useMutation({
    mutationFn: async (signupId) => {
      return base44.entities.VolunteerEventSignup.update(signupId, {
        status: 'cancelled',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-events-upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['my-signups'] });
      setSuccessMsg('Successfully cancelled your signup.');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const isSignedUp = (eventId) => {
    return mySignups.some(s => s.event_id === eventId && (s.status === 'confirmed' || s.is_waitlist));
  };

  const getMySignup = (eventId) => {
    return mySignups.find(s => s.event_id === eventId && (s.status === 'confirmed' || s.is_waitlist));
  };

  const isOnWaitlist = (eventId) => {
    return mySignups.some(s => s.event_id === eventId && s.is_waitlist);
  };

  const handleSignup = (eventId) => {
    signupMutation.mutate(eventId);
  };

  const handleCancel = (signupId) => {
    if (confirm('Are you sure you want to cancel your signup?')) {
      cancelSignupMutation.mutate(signupId);
    }
  };

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => {
    return moment(a.date).diff(moment(b.date));
  });

  return (
    <Card className="w-full max-w-4xl shadow-2xl border-0">
      <CardHeader className="bg-gradient-to-r from-accent/20 to-accent/5 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-2xl font-display font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-accent" />
            Upcoming Events & Shifts
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-800">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Loading events...</p>
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Upcoming Events</h3>
            <p className="text-muted-foreground">Check back later for new volunteer opportunities!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedEvents.map(event => {
              const signedUp = isSignedUp(event.id);
              const mySignup = getMySignup(event.id);
              const spotsLeft = (event.volunteers_needed || 0) - (event.volunteers_signed_up || 0);
              const isFull = spotsLeft <= 0;
              const isPast = moment(event.date).isBefore(moment(), 'day');

              return (
                <div
                  key={event.id}
                  className={`border rounded-lg p-5 transition-all ${
                    signedUp 
                      ? 'bg-green-50 border-green-200' 
                      : isPast
                      ? 'bg-muted/30 opacity-60'
                      : 'bg-card hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-bold font-display text-foreground">
                          {event.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{moment(event.date).format('dddd, MMMM D, YYYY')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{event.start_time} - {event.end_time}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                        {signedUp && (
                          <Badge className="bg-green-600 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            You're Signed Up
                          </Badge>
                        )}
                        {!signedUp && !isPast && (
                          <Badge variant={isFull ? (event.enable_waitlist ? 'secondary' : 'destructive') : 'outline'}>
                            <Users className="w-3 h-3 mr-1" />
                            {isFull ? (event.enable_waitlist ? 'Waitlist Available' : 'Full') : `${spotsLeft} spots left`}
                          </Badge>
                        )}
                        {isOnWaitlist(event.id) && (
                          <Badge className="bg-amber-500 text-white">
                            On Waitlist
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {signedUp ? (
                        <Button
                          variant="outline"
                          className={mySignup.is_waitlist ? "border-amber-500 text-amber-700 hover:bg-amber-50" : "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"}
                          onClick={() => handleCancel(mySignup.id)}
                          disabled={cancelSignupMutation.isPending}
                        >
                          {mySignup.is_waitlist ? 'Leave Waitlist' : 'Cancel Signup'}
                        </Button>
                      ) : isPast ? (
                        <Button disabled className="w-full">
                          Event Ended
                        </Button>
                      ) : isFull && event.enable_waitlist ? (
                        <Button
                          className="w-full bg-amber-500 text-white hover:bg-amber-600"
                          onClick={() => signupMutation.mutate({ eventId: event.id, isWaitlist: true })}
                          disabled={signupMutation.isPending}
                        >
                          Join Waitlist
                        </Button>
                      ) : isFull ? (
                        <Button disabled className="w-full" variant="secondary">
                          Full
                        </Button>
                      ) : (
                        <Button
                          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                          onClick={() => handleSignup(event.id)}
                          disabled={signupMutation.isPending}
                        >
                          {signupMutation.isPending ? 'Signing Up...' : 'Sign Up'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* My Upcoming Signups Summary */}
        {mySignups.filter(s => s.status === 'confirmed').length > 0 && (
          <div className="border-t pt-6">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
              My Confirmed Signups
            </h4>
            <div className="grid gap-2">
              {mySignups
                .filter(s => s.status === 'confirmed')
                .sort((a, b) => moment(a.event_date).diff(moment(b.event_date)))
                .map(signup => {
                  const event = events.find(e => e.id === signup.event_id);
                  return (
                    <div key={signup.id} className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="font-medium text-sm">{signup.event_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {moment(signup.event_date).format('MMM D, YYYY')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleCancel(signup.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <Button variant="outline" onClick={onBack} className="w-full mt-4 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Button>
      </CardContent>
    </Card>
  );
}