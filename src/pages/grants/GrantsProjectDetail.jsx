import React, { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Save, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProposalTab from '@/components/project/ProposalTab';
import DocumentsTab from '@/components/project/DocumentsTab';
import SubmissionTab from '@/components/project/SubmissionTab';
import NotesTab from '@/components/project/NotesTab';
import ReportsTab from '@/components/project/ReportsTab';
import QuickReferenceTab from '@/components/project/QuickReferenceTab';
import AIAssistant from '@/components/project/AIAssistant';
import ProjectProgress from '@/components/project/ProjectProgress';

const STATUS_COLORS = {
  draft: 'bg-secondary text-secondary-foreground',
  in_progress: 'bg-accent/10 text-accent',
  submitted: 'bg-primary/15 text-amber-800',
  awarded: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  closed: 'bg-gray-100 text-gray-500',
};

export default function GrantsProjectDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'proposal');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => base44.entities.Project.get(id),
    enabled: !!id,
  });

  const { data: orgInfoList = [] } = useQuery({
    queryKey: ['orgInfo'],
    queryFn: () => base44.entities.OrganizationInfo.list(),
  });
  const orgInfo = orgInfoList[0];

  const refetchProject = () => queryClient.invalidateQueries(['project', id]);

  const handleStatusChange = async (status) => {
    await base44.entities.Project.update(id, { status });
    refetchProject();
  };

  const handleTitleSave = async () => {
    if (!titleDraft.trim()) return;
    setSavingTitle(true);
    await base44.entities.Project.update(id, { title: titleDraft.trim() });
    refetchProject();
    setEditingTitle(false);
    setSavingTitle(false);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!project) return <div className="text-center py-12 text-muted-foreground">Proposal not found.</div>;

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <Link to="/grants/projects"><Button variant="ghost" size="icon" className="flex-shrink-0"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setEditingTitle(false); }}
                className="text-xl font-heading font-bold bg-transparent border-b border-primary outline-none flex-1"
                autoFocus
              />
              <Button size="sm" onClick={handleTitleSave} disabled={savingTitle}><Save className="h-3.5 w-3.5 mr-1" />Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <h1 className="text-xl font-heading font-bold leading-tight">{project.title}</h1>
              <button onClick={() => { setTitleDraft(project.title); setEditingTitle(true); }} className="mt-1 text-muted-foreground hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-muted-foreground">{project.funding_source_name || 'No funder'}</span>
            {project.group_name && <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{project.group_name}</span>}
            {(project.tags || []).map(t => <span key={t} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{t}</span>)}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={project.status}
            onChange={e => handleStatusChange(e.target.value)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 cursor-pointer ${STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-700'}`}
          >
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="awarded">Awarded</option>
            <option value="declined">Declined</option>
            <option value="cancelled">Cancelled</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <ProjectProgress project={project} onUpdate={refetchProject} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="flex-wrap h-auto gap-1 bg-accent/10 p-1">
          <TabsTrigger value="proposal">Proposal Builder</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="submission">Final Submission</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="reference">Quick Reference</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
        </TabsList>
        <TabsContent value="proposal" className="mt-4">
          <ProposalTab project={project} orgInfo={orgInfo} onUpdate={refetchProject} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <DocumentsTab project={project} onUpdate={refetchProject} />
        </TabsContent>
        <TabsContent value="submission" className="mt-4">
          <SubmissionTab project={project} onUpdate={refetchProject} />
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <NotesTab project={project} onUpdate={refetchProject} />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <ReportsTab project={project} onUpdate={refetchProject} />
        </TabsContent>
        <TabsContent value="reference" className="mt-4">
          <QuickReferenceTab orgInfo={orgInfo} onUpdate={() => queryClient.invalidateQueries(['orgInfo'])} />
        </TabsContent>
        <TabsContent value="ai" className="mt-4">
          <AIAssistant project={project} orgInfo={orgInfo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}