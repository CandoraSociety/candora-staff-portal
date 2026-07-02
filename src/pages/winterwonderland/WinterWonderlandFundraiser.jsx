import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Sparkles, Plus, Clock, MapPin, Mail } from 'lucide-react';
import FestivalEventDialog from '@/components/winterwonderland/FestivalEventDialog';
import { COMPONENT_STATUS_OPTIONS, EVENT_STATUS_OPTIONS } from '@/lib/winterFestivalConstants';
import { useToast } from '@/components/ui/use-toast';

function StatusPill({ status, options }) {
  const opt = options.find(o => o.value === status);
  if (!opt) return null;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: opt.color + '20', color: opt.color }}>{opt.label}</span>;
}

export default function WinterWonderlandFundraiser() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [eventDialog, setEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});

  const { data: festivals } = useQuery({ queryKey: ['winterFestivals'], queryFn: () => base44.entities.WinterFestival.list() });
  const activeFestival = festivals?.filter(f => f.status === 'planning' || f.status === 'active').sort((a, b) => b.year - a.year)[0] || festivals?.[0];

  const { data: components } = useQuery({
    queryKey: ['festivalComponents', activeFestival?.id],
    queryFn: () => base44.entities.FestivalComponent.filter({ festival_id: activeFestival.id }),
    enabled: !!activeFestival,
  });
  const fundraiserComp = components?.find(c => c.component_type === 'fundraiser');

  const { data: events } = useQuery({
    queryKey: ['festivalEvents', activeFestival?.id],
    queryFn: () => base44.entities.FestivalEvent.filter({ festival_id: activeFestival.id }),
    enabled: !!activeFestival,
  });
  const fundraiserEvents = events?.filter(e => e.component_id === fundraiserComp?.id) || [];

  useEffect(() => {
    if (fundraiserComp) setForm({ name: fundraiserComp.name || '', description: fundraiserComp.description || '', lead_name: fundraiserComp.lead_name || '', lead_email: fundraiserComp.lead_email || '', location: fundraiserComp.location || '', schedule_description: fundraiserComp.schedule_description || '', status: fundraiserComp.status || 'planning', notes: fundraiserComp.notes || '' });
  }, [fundraiserComp]);

  const handleCreateFundraiser = async () => {
    try {
      await base44.entities.FestivalComponent.create({ festival_id: activeFestival.id, festival_year: activeFestival.year, name: 'Annual Fundraiser', component_type: 'fundraiser', status: 'planning' });
      qc.invalidateQueries({ queryKey: ['festivalComponents'] });
      toast({ title: 'Fundraiser component created' });
    } catch (e) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const handleSave = async () => {
    try {
      await base44.entities.FestivalComponent.update(fundraiserComp.id, form);
      qc.invalidateQueries({ queryKey: ['festivalComponents'] });
      setEditMode(false);
      toast({ title: 'Fundraiser updated' });
    } catch (e) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const handleSaveEvent = async (data) => {
    try {
      if (editingEvent) {
        await base44.entities.FestivalEvent.update(editingEvent.id, data);
      } else {
        await base44.entities.FestivalEvent.create({ ...data, festival_id: activeFestival.id, component_id: fundraiserComp.id, component_name: fundraiserComp.name });
      }
      qc.invalidateQueries({ queryKey: ['festivalEvents'] });
      toast({ title: editingEvent ? 'Event updated' : 'Event created' });
    } catch (e) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  if (!activeFestival) return <Card><CardContent className="pt-6"><p className="text-muted-foreground text-sm">Create a festival first from the Dashboard.</p></CardContent></Card>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center"><Sparkles className="h-5 w-5 text-white" /></div>
        <div><h1 className="text-2xl font-display font-bold">Annual Fundraiser</h1><p className="text-sm text-muted-foreground">Supporting the Winter Wonderland Festival{activeFestival.fundraiser_name ? ` — ${activeFestival.fundraiser_name}` : ''}</p></div>
      </div>

      {!fundraiserComp ? (
        <Card><CardContent className="pt-6 text-center space-y-3"><p className="text-muted-foreground">No fundraiser component set up for this festival yet.</p><Button onClick={handleCreateFundraiser}><Plus className="h-4 w-4" /> Create Fundraiser Component</Button></CardContent></Card>
      ) : editMode ? (
        <Card>
          <CardHeader><CardTitle>Edit Fundraiser</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Lead Name</Label><Input value={form.lead_name} onChange={e => setForm(f => ({ ...f, lead_name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Lead Email</Label><Input value={form.lead_email} onChange={e => setForm(f => ({ ...f, lead_email: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Schedule</Label><Input value={form.schedule_description} onChange={e => setForm(f => ({ ...f, schedule_description: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMPONENT_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <div className="flex gap-2"><Button onClick={handleSave}>Save</Button><Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button></div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>{fundraiserComp.name}</CardTitle><CardDescription>{fundraiserComp.description || 'No description yet'}</CardDescription></div><div className="flex items-center gap-2"><StatusPill status={fundraiserComp.status} options={COMPONENT_STATUS_OPTIONS} /><Button variant="outline" size="sm" onClick={() => setEditMode(true)}>Edit</Button></div></CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                {fundraiserComp.lead_name && <p className="text-muted-foreground">👤 Lead: {fundraiserComp.lead_name}</p>}
                {fundraiserComp.lead_email && <p className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {fundraiserComp.lead_email}</p>}
                {fundraiserComp.location && <p className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {fundraiserComp.location}</p>}
                {fundraiserComp.schedule_description && <p className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {fundraiserComp.schedule_description}</p>}
                {fundraiserComp.notes && <p className="text-muted-foreground mt-2 italic">{fundraiserComp.notes}</p>}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold">Fundraiser Events</h2>
            <Button size="sm" onClick={() => { setEditingEvent(null); setEventDialog(true); }}><Plus className="h-4 w-4" /> Add Event</Button>
          </div>
          {fundraiserEvents.length === 0 ? (
            <Card><CardContent className="pt-6"><p className="text-muted-foreground text-sm text-center">No fundraiser events yet.</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {fundraiserEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date)).map(ev => (
                <Card key={ev.id}><CardContent className="pt-4 flex items-start justify-between">
                  <div><div className="flex items-center gap-2"><h4 className="font-medium text-sm">{ev.title}</h4><StatusPill status={ev.status} options={EVENT_STATUS_OPTIONS} /></div><p className="text-xs text-muted-foreground mt-1">{new Date(ev.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{ev.start_time ? ` at ${ev.start_time}` : ''}{ev.location ? ` • ${ev.location}` : ''}</p></div>
                  <Button variant="ghost" size="sm" onClick={() => { setEditingEvent(ev); setEventDialog(true); }}>Edit</Button>
                </CardContent></Card>
              ))}
            </div>
          )}
        </>
      )}

      {eventDialog && <FestivalEventDialog open={eventDialog} onClose={() => { setEventDialog(false); setEditingEvent(null); }} onSave={handleSaveEvent} event={editingEvent} components={components} />}
    </div>
  );
}