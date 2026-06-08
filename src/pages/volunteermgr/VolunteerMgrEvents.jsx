import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, MapPin, Users, Clock, Trash2, Pencil } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const emptyForm = {
title: '', description: '', date: '', start_time: '', end_time: '',
location: '', volunteers_needed: 0, positions_needed: '', status: 'upcoming',
notes: '', contact_person: '', enable_waitlist: false,
};

const statusColors = {
  upcoming: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-green-50 text-green-700',
  completed: 'bg-gray-50 text-gray-500',
  cancelled: 'bg-red-50 text-red-700',
};

export default function VolunteerMgrEvents() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [waitlistDialog, setWaitlistDialog] = useState({ open: false, event: null, waitlist: [] });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: events = [] } = useQuery({
    queryKey: ['vol-events'],
    queryFn: () => base44.entities.VolunteerEvent.list('-date', 50),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const wasCancelled = editing && editing.status !== 'cancelled' && data.status === 'cancelled';
      const result = editing
        ? await base44.entities.VolunteerEvent.update(editing.id, data)
        : await base44.entities.VolunteerEvent.create(data);

      if (wasCancelled) {
        const signups = await base44.entities.VolunteerEventSignup.filter({ event_id: editing.id });
        const volunteerIds = [...new Set(signups.map((s) => s.volunteer_id))];
        for (const vid of volunteerIds) {
          const vols = await base44.entities.Volunteer.filter({ id: vid });
          const vol = vols[0];
          if (vol?.email) {
            await base44.integrations.Core.SendEmail({
              to: vol.email,
              subject: `Event Cancelled: ${data.title}`,
              body: `Hi ${vol.first_name || vol.company_name || 'Volunteer'},\n\nThe event "${data.title}" scheduled for ${data.date} has been cancelled.\n\n${data.notes ? `Note: ${data.notes}\n\n` : ''}Thank you for your continued support!\n\nThe Candora Volunteer Team`,
            });
          }
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-events'] });
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VolunteerEvent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-events'] });
      setDeleteTarget(null);
    },
  });

  const openEdit = (ev) => {
    setEditing(ev);
    setForm(ev);
    setFormOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openWaitlist = async (event) => {
    const signups = await base44.entities.VolunteerEventSignup.filter({ event_id: event.id, status: 'waitlist' }, '-created_date');
    setWaitlistDialog({ open: true, event, waitlist: signups });
  };

  const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const handlePromoteFromWaitlist = async (signupId, volunteerId) => {
    await base44.entities.VolunteerEventSignup.update(signupId, { status: 'signed_up' });
    const event = await base44.entities.VolunteerEvent.get(waitlistDialog.event.id);
    await base44.entities.VolunteerEvent.update(event.id, { 
      volunteers_signed_up: (event.volunteers_signed_up || 0) + 1,
      waitlist_count: Math.max(0, (event.waitlist_count || 0) - 1)
    });
    const signup = await base44.entities.VolunteerEventSignup.get(signupId);
    if (signup?.volunteer_id) {
      const volunteer = await base44.entities.Volunteer.get(signup.volunteer_id);
      if (volunteer?.email) {
        await base44.integrations.Core.SendEmail({
          to: volunteer.email,
          subject: `You're Confirmed: ${event.title}`,
          body: `Hi ${volunteer.first_name || 'Volunteer'},\n\nGreat news! A spot has opened up and you are now confirmed for "${event.title}" on ${event.date}.\n\nPlease let us know if you can still make it.\n\nThank you!\nThe Candora Volunteer Team`,
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['vol-events'] });
    openWaitlist(waitlistDialog.event);
  };

  const handleRemoveFromWaitlist = async (signupId) => {
    await base44.entities.VolunteerEventSignup.update(signupId, { status: 'cancelled' });
    const event = await base44.entities.VolunteerEvent.get(waitlistDialog.event.id);
    await base44.entities.VolunteerEvent.update(event.id, { 
      waitlist_count: Math.max(0, (event.waitlist_count || 0) - 1)
    });
    queryClient.invalidateQueries({ queryKey: ['vol-events'] });
    openWaitlist(waitlistDialog.event);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">{events.length} total events</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> New Event</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card
            key={event.id}
            className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/volunteermgr/events/${event.id}`)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="text-center min-w-[60px] bg-primary/10 rounded-lg p-2">
                  <p className="text-xs text-primary font-medium">{moment(event.date).format('MMM')}</p>
                  <p className="text-xl font-bold text-primary">{moment(event.date).format('D')}</p>
                </div>
                {event.is_placeholder && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
                    Placeholder
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-sm line-clamp-2">{event.title}</h3>
                <Badge className={`text-xs mt-1 ${statusColors[event.status]}`}>
                  {event.status?.replace(/_/g, ' ')}
                </Badge>
              </div>

              {event.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{event.location}
                    </span>
                  )}
                  {event.start_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{event.start_time} - {event.end_time}
                    </span>
                  )}
                  {event.volunteers_needed > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {event.volunteers_signed_up || 0}/{event.volunteers_needed} signed up
                    </span>
                  )}
                </div>
                {event.enable_waitlist && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full text-xs h-7"
                    onClick={(e) => { e.stopPropagation(); openWaitlist(event); }}
                  >
                    <Users className="w-3 h-3 mr-1" />
                    Manage Waitlist ({event.waitlist_count || 0})
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(event);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
                {event.is_placeholder ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(event);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    title="Delete event"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(event);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No events yet. Create your first event!</p>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget?.is_placeholder ? 'Delete Placeholder?' : 'Delete Event?'}</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "<strong>{deleteTarget?.title}</strong>". This action cannot be undone.
              {!deleteTarget?.is_placeholder && ' Any sign-ups associated with this event will remain in the system.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={formOpen} onOpenChange={(o) => {
        setFormOpen(o);
        if (!o) {
          setEditing(null);
          setForm(emptyForm);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => update('title', e.target.value)} required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} required />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => update('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={form.start_time} onChange={(e) => update('start_time', e.target.value)} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={form.end_time} onChange={(e) => update('end_time', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => update('location', e.target.value)} />
            </div>
            <div>
              <Label>Volunteers Needed</Label>
              <Input type="number" min="0" value={form.volunteers_needed} onChange={(e) => update('volunteers_needed', Number(e.target.value))} />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input value={form.contact_person} onChange={(e) => update('contact_person', e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enable-waitlist">Enable Waitlist</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enable-waitlist"
                  checked={form.enable_waitlist}
                  onChange={(e) => update('enable_waitlist', e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-muted-foreground">
                  Allow volunteers to join waitlist when event is full
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Waitlist Management Dialog */}
      <Dialog open={waitlistDialog.open} onOpenChange={() => setWaitlistDialog({ open: false, event: null, waitlist: [] })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Waitlist for {waitlistDialog.event?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {waitlistDialog.waitlist.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No volunteers on the waitlist</p>
              </div>
            ) : (
              <div className="space-y-3">
                {waitlistDialog.waitlist.map((signup) => (
                  <Card key={signup.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{signup.volunteer_name}</p>
                          <p className="text-sm text-muted-foreground">{signup.volunteer_email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Added: {moment(signup.created_date).format('MMM D, YYYY h:mm A')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handlePromoteFromWaitlist(signup.id, signup.volunteer_id)}
                          >
                            Promote
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => handleRemoveFromWaitlist(signup.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWaitlistDialog({ open: false, event: null, waitlist: [] })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}