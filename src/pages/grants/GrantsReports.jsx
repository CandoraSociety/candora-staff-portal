import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileBarChart } from 'lucide-react';
import HubPanel from '@/components/reports/HubPanel';
import AddHubModal from '@/components/reports/AddHubModal';
import GrantsReportCalendar from '@/components/grants/dashboard/GrantsReportCalendar';

export default function GrantsReports() {
  const [tab, setTab] = useState('ongoing');
  const [addingHub, setAddingHub] = useState(false);

  const { data: hubs = [], refetch: refetchHubs } = useQuery({
    queryKey: ['funder-hubs'],
    queryFn: () => base44.entities.FunderReportingHub.list('name'),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list('-due_date', 100),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 200),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.ProjectMilestone.list('due_date', 100),
  });

  const { data: deadlines = [] } = useQuery({
    queryKey: ['funder-deadlines'],
    queryFn: () => base44.entities.FunderReportingDeadline.list('due_date', 200),
  });

  // Merge hub deadlines into the calendar as type 'hub_deadline'
  const calendarDeadlines = useMemo(() => {
    return deadlines.map(d => ({
      id: `hd-${d.id}`,
      type: 'report',
      date: d.due_date,
      title: d.title,
      project_id: null,
    }));
  }, [deadlines]);

  const ongoingHubs = hubs.filter(h => h.hub_type === 'ongoing_core' || !h.hub_type);
  const grantHubs = hubs.filter(h => h.hub_type === 'grant');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{hubs.length} reporting hubs</p>
        </div>
        <Button onClick={() => setAddingHub(true)} className="gap-2">
          <Plus className="h-4 w-4" />New Reporting Hub
        </Button>
      </div>

      {/* Calendar */}
      <GrantsReportCalendar
        reports={[...reports, ...calendarDeadlines.map(d => ({ id: d.id, due_date: d.date, title: d.title, project_id: d.project_id }))]}
        projects={projects}
        milestones={milestones}
      />

      {/* Hubs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ongoing">Ongoing / Core Funders ({ongoingHubs.length})</TabsTrigger>
          <TabsTrigger value="grants">Grants ({grantHubs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ongoing" className="mt-4">
          {ongoingHubs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <FileBarChart className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No ongoing reporting hubs</p>
              <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setAddingHub(true)}>
                <Plus className="h-3.5 w-3.5" />Add Hub
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {ongoingHubs.map(hub => <HubPanel key={hub.id} hub={hub} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="grants" className="mt-4">
          {grantHubs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <FileBarChart className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No grant reporting hubs</p>
              <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setAddingHub(true)}>
                <Plus className="h-3.5 w-3.5" />Add Hub
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {grantHubs.map(hub => <HubPanel key={hub.id} hub={hub} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {addingHub && <AddHubModal onClose={() => { setAddingHub(false); refetchHubs(); }} />}
    </div>
  );
}