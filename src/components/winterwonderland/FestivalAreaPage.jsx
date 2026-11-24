import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Clock, MapPin, Mail, User, Edit2 } from 'lucide-react';
import ComponentDialog from '@/components/winterwonderland/ComponentDialog';
import FestivalEventDialog from '@/components/winterwonderland/FestivalEventDialog';
import { COMPONENT_STATUS_OPTIONS, EVENT_STATUS_OPTIONS } from '@/lib/winterFestivalConstants';
import { useToast } from '@/components/ui/use-toast';

function StatusPill({ status, options }) {
  const opt = options.find(o => o.value === status);
  if (!opt) return null;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: opt.color + '20', color: opt.color }}>{opt.label}</span>;
}

// One festival area — its component details and its own scheduled events — with
// any extra tabs the area needs (the Kids Gift Shop adds Registration).
export default function FestivalAreaPage({ area, extraTabs = [], accent, showEvents = true, showComponent = true, overviewExtra }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [componentDialog, setComponentDialog] = useState(false);
  const [eventDialog, setEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const { data: festivals } = useQuery({ queryKey: ['winterFestivals'], queryFn: () => base44.entities.WinterFestival.list() });
  const activeFestival = festivals?.filter(f => f.status === 'planning' || f.status === 'active').sort((a, b) => b.year - a.year)[0] || festivals?.[0];

  const { data: components } = useQuery({
    queryKey: ['festivalComponents', activeFestival?.id],
    queryFn: () => base44.entities.FestivalComponent.filter({ festival_id: activeFestival.id }),
    enabled: !!activeFestival,
  });
  const component = components?.find(c => c.component_type === area.type);

  const { data: events } = useQuery({
    queryKey: ['festivalEvents', activeFestival?.id],
    queryFn: () => base44.entities.FestivalEvent.filter({ festival_id: activeFestival.id }),
    enabled: !!activeFestival,
  });
  const areaEvents = (events || []).filter(e => e.component_id === component?.id);

  const createComponent = async () => {
    try {
      await base44.entities.FestivalComponent.create({
        festival_id: activeFestival.id,
        festival_year: activeFestival.year,
        name: area.label,
        component_type: area.type,
        status: 'planning',
      });
      qc.invalidateQueries({ queryKey: ['festivalComponents'] });
      toast({ title: `${area.label} set up for this festival` });
    } catch (e) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const saveComponent = async (data) => {
    try {
      if (component) await base44.entities.FestivalComponent.update(component.id, data);
      else await base44.entities.FestivalComponent.create({ ...data, festival_id: activeFestival.id, festival_year: activeFestival.year, component_type: area.type });
      qc.invalidateQueries({ queryKey: ['festivalComponents'] });
      toast({ title: 'Saved' });
    } catch (e) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const saveEvent = async (data) => {
    try {
      if (editingEvent) {
        await base44.entities.FestivalEvent.update(editingEvent.id, data);
      } else {
        await base44.entities.FestivalEvent.create({ ...data, festival_id: activeFestival.id, component_id: component.id, component_name: component.name });
      }
      qc.invalidateQueries({ queryKey: ['festivalEvents'] });
      toast({ title: editingEvent ? 'Event updated' : 'Event created' });
    } catch (e) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const overview = !activeFestival ? (
    <Card><CardContent className="pt-6"><p className="text-muted-foreground text-sm">Create a festival first from the Dashboard.</p></CardContent></Card>
  ) : (
    <>
      {overviewExtra?.({ festival: activeFestival, component })}
      {showComponent && (!component ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-muted-foreground">{area.label} is not set up for this festival yet.</p>
            <Button onClick={createComponent}><Plus className="h-4 w-4" /> Set up {area.label}</Button>
          </CardContent>
        </Card>
      ) : (
        <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{component.name}</CardTitle>
            <CardDescription>{component.description || 'No description yet'}</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusPill status={component.status} options={COMPONENT_STATUS_OPTIONS} />
            <Button variant="outline" size="sm" onClick={() => setComponentDialog(true)}><Edit2 className="h-3.5 w-3.5" /> Edit</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            {component.lead_name && <p className="text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Lead: {component.lead_name}</p>}
            {component.lead_email && <p className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {component.lead_email}</p>}
            {component.location && <p className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {component.location}</p>}
            {component.schedule_description && <p className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {component.schedule_description}</p>}
            {component.notes && <p className="text-muted-foreground mt-2 italic">{component.notes}</p>}
          </div>
        </CardContent>
      </Card>

      {showEvents && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold">{area.label} Events</h2>
            <Button size="sm" onClick={() => { setEditingEvent(null); setEventDialog(true); }}><Plus className="h-4 w-4" /> Add Event</Button>
          </div>
          {areaEvents.length === 0 ? (
            <Card><CardContent className="pt-6"><p className="text-muted-foreground text-sm text-center">No events scheduled for {area.label} yet.</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {areaEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date)).map(ev => (
                <Card key={ev.id}>
                  <CardContent className="pt-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2"><h4 className="font-medium text-sm">{ev.title}</h4><StatusPill status={ev.status} options={EVENT_STATUS_OPTIONS} /></div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(ev.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {ev.start_time ? ` at ${ev.start_time}` : ''}{ev.location ? ` • ${ev.location}` : ''}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingEvent(ev); setEventDialog(true); }}>Edit</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      </>
      ))}
      </>
      );

  // An area may ask for its own brighter treatment: a gradient badge and a gold
  // highlight on the open tab. Without it the header stays as it always was.
  const tabTriggerClass = accent
    ? 'font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md'
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center text-xl"
          style={accent
            ? {
                background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.4), 0 8px 18px -8px ${accent.from}`,
              }
            : { backgroundColor: area.color + '20' }}
        >{area.emoji}</div>
        <div>
          <h1 className="text-2xl font-display font-bold">{area.label}</h1>
          <p className="text-sm text-muted-foreground">{area.blurb}</p>
        </div>
      </div>

      {extraTabs.length > 0 ? (
        <Tabs defaultValue="overview">
          <TabsList
            style={accent ? { background: `linear-gradient(90deg, ${accent.from}24, ${accent.to}2e)` } : undefined}
            className={accent ? 'border' : undefined}
          >
            <TabsTrigger value="overview" className={tabTriggerClass}>Overview</TabsTrigger>
            {extraTabs.map(tab => <TabsTrigger key={tab.value} value={tab.value} className={tabTriggerClass}>{tab.label}</TabsTrigger>)}
          </TabsList>
          <TabsContent value="overview" className="space-y-4 mt-4">{overview}</TabsContent>
          {extraTabs.map(tab => <TabsContent key={tab.value} value={tab.value} className="mt-4">{tab.content}</TabsContent>)}
        </Tabs>
      ) : overview}

      {componentDialog && component && (
        <ComponentDialog open={componentDialog} onClose={() => setComponentDialog(false)} onSave={saveComponent} component={component} lockType />
      )}
      {eventDialog && component && (
        <FestivalEventDialog
          open={eventDialog}
          onClose={() => { setEventDialog(false); setEditingEvent(null); }}
          onSave={saveEvent}
          event={editingEvent}
          components={[component]}
        />
      )}
    </div>
  );
}