import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronRight, Calendar, Pencil, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import HubDocUploader from './HubDocUploader';
import ManageDeadlinesModal from './ManageDeadlinesModal';
import AddHubModal from './AddHubModal';

const STATUS_COLORS = {
  upcoming: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-purple-100 text-purple-700',
  accepted: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

export default function HubPanel({ hub }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showDeadlines, setShowDeadlines] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const { data: deadlines = [] } = useQuery({
    queryKey: ['funder-deadlines', hub.id],
    queryFn: () => base44.entities.FunderReportingDeadline.filter({ hub_id: hub.id }),
  });

  // Find next upcoming deadline
  const upcoming = deadlines
    .filter(d => d.due_date && d.status !== 'accepted' && d.status !== 'submitted')
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

  const handleDelete = async () => {
    if (!confirm(`Delete hub "${hub.name}" and all its documents and deadlines?`)) return;
    const docs = await base44.entities.FunderReportingDoc.filter({ hub_id: hub.id });
    for (const d of docs) await base44.entities.FunderReportingDoc.delete(d.id);
    for (const d of deadlines) await base44.entities.FunderReportingDeadline.delete(d.id);
    await base44.entities.FunderReportingHub.delete(hub.id);
    queryClient.invalidateQueries(['funder-hubs']);
    queryClient.invalidateQueries(['funder-deadlines']);
    queryClient.invalidateQueries(['funder-docs']);
  };

  const isOverdue = upcoming && isPast(parseISO(upcoming.due_date)) && upcoming.status !== 'accepted';

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="text-muted-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{hub.name}</span>
            {hub.funding_source_name && <span className="text-xs text-muted-foreground">{hub.funding_source_name}</span>}
            {!hub.is_active && <span className="text-xs text-muted-foreground">(inactive)</span>}
          </div>
          {upcoming && (
            <div className={`flex items-center gap-1.5 mt-0.5 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              {isOverdue && <AlertCircle className="h-3 w-3" />}
              <span className="text-xs">
                Next: <strong>{upcoming.title}</strong> — {format(parseISO(upcoming.due_date), 'MMM d, yyyy')}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[upcoming.status] || 'bg-gray-100 text-gray-700'}`}>
                {upcoming.status?.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {hub.portal_url && (
            <a href={hub.portal_url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3.5 w-3.5" /></Button>
            </a>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowDeadlines(true)}>
            <Calendar className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowEdit(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 bg-muted/10">
          {hub.notes && <p className="text-xs text-muted-foreground mb-3 italic">{hub.notes}</p>}
          {hub.portal_login_notes && (
            <p className="text-xs text-muted-foreground mb-3">Login: {hub.portal_login_notes}</p>
          )}
          <Tabs defaultValue="docs">
            <TabsList className="h-8">
              <TabsTrigger value="docs" className="text-xs h-7">Submitted Reports</TabsTrigger>
              <TabsTrigger value="templates" className="text-xs h-7">Templates & Guides</TabsTrigger>
            </TabsList>
            <TabsContent value="docs" className="mt-3">
              <HubDocUploader hub={hub} />
            </TabsContent>
            <TabsContent value="templates" className="mt-3">
              <HubDocUploader hub={{ ...hub, _docTypeFilter: 'template' }} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {showDeadlines && <ManageDeadlinesModal hub={hub} onClose={() => setShowDeadlines(false)} />}
      {showEdit && <AddHubModal existingHub={hub} onClose={() => setShowEdit(false)} />}
    </div>
  );
}