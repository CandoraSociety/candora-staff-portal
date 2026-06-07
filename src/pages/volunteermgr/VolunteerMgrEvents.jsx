import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  notes: '', contact_person: '',
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

  const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));

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
                    {event.volunteers_signed_up || 0}/{event.volunteers_needed}
                  </span>
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
                {event.is_placeholder && (
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
            <AlertDialogTitle>Delete Placeholder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "<strong>{deleteTarget?.title}</strong>". This action cannot be undone.
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}