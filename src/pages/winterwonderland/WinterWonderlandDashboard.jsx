import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Snowflake, Plus, Calendar, Layers, Users, Sparkles, ExternalLink, Edit2 } from 'lucide-react';
import FestivalDialog from '@/components/winterwonderland/FestivalDialog';
import { COMPONENT_TYPE_OPTIONS, FESTIVAL_STATUS_OPTIONS, COMPONENT_STATUS_OPTIONS } from '@/lib/winterFestivalConstants';
import { useToast } from '@/components/ui/use-toast';

function StatusPill({ status, options }) {
  const opt = options.find(o => o.value === status);
  if (!opt) return null;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: opt.color + '20', color: opt.color }}>{opt.label}</span>;
}

export default function WinterWonderlandDashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [festivalDialog, setFestivalDialog] = useState(false);

  const { data: festivals } = useQuery({
    queryKey: ['winterFestivals'],
    queryFn: () => base44.entities.WinterFestival.list(),
  });

  const activeFestival = festivals?.filter(f => f.status === 'planning' || f.status === 'active').sort((a, b) => b.year - a.year)[0] || festivals?.[0];

  const { data: components } = useQuery({
    queryKey: ['festivalComponents', activeFestival?.id],
    queryFn: () => base44.entities.FestivalComponent.filter({ festival_id: activeFestival.id }),
    enabled: !!activeFestival,
  });

  const { data: events } = useQuery({
    queryKey: ['festivalEvents', activeFestival?.id],
    queryFn: () => base44.entities.FestivalEvent.filter({ festival_id: activeFestival.id }),
    enabled: !!activeFestival,
  });

  const handleSaveFestival = async (data) => {
    try {
      if (activeFestival && data.year === activeFestival.year && !festivalDialog) {
        await base44.entities.WinterFestival.update(activeFestival.id, data);
      } else {
        await base44.entities.WinterFestival.create(data);
      }
      qc.invalidateQueries({ queryKey: ['winterFestivals'] });
      toast({ title: 'Festival saved' });
    } catch (e) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const upcomingEvents = events?.filter(e => e.status === 'scheduled').sort((a, b) => new Date(a.event_date) - new Date(b.event_date)).slice(0, 5) || [];
  const volunteersNeeded = events?.reduce((sum, e) => sum + (e.volunteer_count_needed || 0), 0) || 0;
  const fundraiserComp = components?.find(c => c.component_type === 'fundraiser');

  return (
    <div className="space-y-6">
      {/* Festival Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-6">
          {activeFestival ? (
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center"><Snowflake className="h-6 w-6 text-white" /></div>
                <div>
                  <h1 className="text-2xl font-display font-bold">{activeFestival.theme || `Winter Wonderland ${activeFestival.year}`}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <StatusPill status={activeFestival.status} options={FESTIVAL_STATUS_OPTIONS} />
                    {activeFestival.start_date && <span className="text-sm text-muted-foreground">{new Date(activeFestival.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {activeFestival.end_date ? new Date(activeFestival.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}</span>}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFestivalDialog(true)}><Edit2 className="h-4 w-4" /> Edit Festival</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center"><Snowflake className="h-6 w-6 text-white" /></div>
                <div><h1 className="text-2xl font-display font-bold">Winter Wonderland Festival</h1><p className="text-sm text-muted-foreground">No festival created yet — get started by creating one.</p></div>
              </div>
              <Button onClick={() => setFestivalDialog(true)}><Plus className="h-4 w-4" /> Create Festival</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/winter-wonderland/components"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Components</CardTitle><div className="bg-blue-500 p-2 rounded-lg"><Layers className="h-4 w-4 text-white" /></div></CardHeader><CardContent><div className="text-2xl font-bold">{components?.length || 0}</div></CardContent></Card></Link>
        <Link to="/winter-wonderland/schedule"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Scheduled Events</CardTitle><div className="bg-green-500 p-2 rounded-lg"><Calendar className="h-4 w-4 text-white" /></div></CardHeader><CardContent><div className="text-2xl font-bold">{events?.filter(e => e.status === 'scheduled').length || 0}</div></CardContent></Card></Link>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Volunteers Needed</CardTitle><div className="bg-amber-500 p-2 rounded-lg"><Users className="h-4 w-4 text-white" /></div></CardHeader><CardContent><div className="text-2xl font-bold">{volunteersNeeded}</div></CardContent></Card>
        <Link to="/winter-wonderland/fundraiser"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Fundraiser</CardTitle><div className="bg-purple-500 p-2 rounded-lg"><Sparkles className="h-4 w-4 text-white" /></div></CardHeader><CardContent><div className="text-sm font-bold">{fundraiserComp ? fundraiserComp.status : 'Not set up'}</div></CardContent></Card></Link>
      </div>

      {/* Component Cards */}
      {components && components.length > 0 && (
        <div>
          <h2 className="text-lg font-display font-semibold mb-3">Festival Components</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {components.map(comp => {
              const typeOpt = COMPONENT_TYPE_OPTIONS.find(t => t.value === comp.component_type);
              return (
                <Link key={comp.id} to="/winter-wonderland/components">
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <CardHeader><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-2xl">{typeOpt?.icon || '❄️'}</span><CardTitle className="text-base">{comp.name}</CardTitle></div><StatusPill status={comp.status} options={COMPONENT_STATUS_OPTIONS} /></div></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground line-clamp-2">{comp.description || 'No description'}</p>{comp.lead_name && <p className="text-xs text-muted-foreground mt-2">Lead: {comp.lead_name}</p>}{comp.schedule_description && <p className="text-xs text-muted-foreground">{comp.schedule_description}</p>}</CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <Card>
        <CardHeader><CardTitle>Upcoming Events</CardTitle><CardDescription>Next scheduled events for this festival</CardDescription></CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? <p className="text-muted-foreground text-sm">No upcoming events scheduled.</p> : (
            <div className="space-y-2">
              {upcomingEvents.map(ev => (
                <div key={ev.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div><h4 className="font-medium text-sm">{ev.title}</h4><p className="text-xs text-muted-foreground">{ev.component_name} • {new Date(ev.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{ev.start_time ? ` at ${ev.start_time}` : ''}</p></div>
                  <StatusPill status={ev.status} options={[{ value: 'scheduled', label: 'Scheduled', color: '#3b82f6' }]} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link to Events Portal */}
      <Card className="border-dashed">
        <CardContent className="pt-6 flex items-center justify-between">
          <div><p className="text-sm font-medium">This festival is also managed alongside other Candora events.</p><p className="text-xs text-muted-foreground">Access the full Events/Projects/Programs portal for broader event management.</p></div>
          <Link to="/eventsmgr"><Button variant="outline" size="sm">Events Portal <ExternalLink className="h-3 w-3" /></Button></Link>
        </CardContent>
      </Card>

      {festivalDialog && <FestivalDialog open={festivalDialog} onClose={() => setFestivalDialog(false)} onSave={handleSaveFestival} festival={activeFestival} />}
    </div>
  );
}