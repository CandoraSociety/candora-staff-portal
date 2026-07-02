import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Clock, MapPin, Users } from 'lucide-react';
import FestivalEventDialog from '@/components/winterwonderland/FestivalEventDialog';
import { EVENT_STATUS_OPTIONS } from '@/lib/winterFestivalConstants';
import { useToast } from '@/components/ui/use-toast';

function StatusPill({ status }) {
  const opt = EVENT_STATUS_OPTIONS.find(o => o.value === status);
  if (!opt) return null;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: opt.color + '20', color: opt.color }}>{opt.label}</span>;
}

export default function WinterWonderlandSchedule() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: festivals } = useQuery({ queryKey: ['winterFestivals'], queryFn: () => base44.entities.WinterFestival.list() });
  const activeFestival = festivals?.filter(f => f.status === 'planning' || f.status === 'active').sort((a, b) => b.year - a.year)[0] || festivals?.[0];

  const { data: components } = useQuery({
    queryKey: ['festivalComponents', activeFestival?.id],
    queryFn: () => base44.entities.FestivalComponent.filter({ festival_id: activeFestival.id }),
    enabled: !!activeFestival,
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ['festivalEvents', activeFestival?.id],
    queryFn: () => base44.entities.FestivalEvent.filter({ festival_id: activeFestival.id }),
    enabled: !!activeFestival,
  });

  const grouped = useMemo(() => {
    const sorted = [...(events || [])].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    const groups = {};
    sorted.forEach(e => {
      const key = e.event_date || 'No Date';
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return Object.entries(groups);
  }, [events]);

  const handleSave = async (data) => {
    try {
      if (editing) {
        await base44.entities.FestivalEvent.update(editing.id, data);
      } else {
        await base44.entities.FestivalEvent.create({ ...data, festival_id: activeFestival.id });
      }
      qc.invalidateQueries({ queryKey: ['festivalEvents'] });
      toast({ title: editing ? 'Event updated' : 'Event created' });
    } catch (e) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await base44.entities.FestivalEvent.delete(id);
      qc.invalidateQueries({ queryKey: ['festivalEvents'] });
      toast({ title: 'Event deleted' });
    } catch (e) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  if (!activeFestival) return <Card><CardContent className="pt-6"><p className="text-muted-foreground text-sm">Create a festival first from the Dashboard.</p></CardContent></Card>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-display font-bold">Festival Schedule</h1><p className="text-sm text-muted-foreground">All events for {activeFestival.theme || `Winter Wonderland ${activeFestival.year}`}</p></div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} disabled={!components?.length}><Plus className="h-4 w-4" /> New Event</Button>
      </div>

      {isLoading ? <p className="text-muted-foreground text-sm">Loading...</p> : grouped.length === 0 ? (
        <Card><CardContent className="pt-6 text-center"><p className="text-muted-foreground">{!components?.length ? 'Create at least one component before scheduling events.' : 'No events scheduled yet. Click "New Event" to add one.'}</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, dayEvents]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{date === 'No Date' ? 'No Date' : new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
              <div className="space-y-2">
                {dayEvents.map(ev => (
                  <Card key={ev.id}>
                    <CardContent className="pt-4 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><h4 className="font-medium text-sm">{ev.title}</h4><StatusPill status={ev.status} /></div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {ev.component_name && <span>📋 {ev.component_name}</span>}
                          {ev.start_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {ev.start_time}{ev.end_time ? `–${ev.end_time}` : ''}</span>}
                          {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {ev.location}</span>}
                          {ev.volunteer_count_needed > 0 && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {ev.volunteer_count_needed} needed</span>}
                        </div>
                        {ev.description && <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>}
                      </div>
                      <div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(ev); setDialogOpen(true); }}><Edit2 className="h-3 w-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(ev.id)}><Trash2 className="h-3 w-3" /></Button></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {dialogOpen && <FestivalEventDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} onSave={handleSave} event={editing} components={components} />}
    </div>
  );
}