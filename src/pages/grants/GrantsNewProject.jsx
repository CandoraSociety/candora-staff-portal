import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

const PROJECT_TYPES = [
  { value: 'grant_application', label: 'Grant Application', description: 'Apply for funding from a government or foundation' },
  { value: 'proposal', label: 'Proposal', description: 'Proposal to a corporate or individual funder' },
  { value: 'contract', label: 'Contract', description: 'Service contract or project agreement' },
  { value: 'partnership', label: 'Partnership', description: 'Collaborative project with another organization' },
  { value: 'other', label: 'Other', description: 'Other project type' },
];

const LABELS = {
  grant_application: { deadline: 'Application Deadline', amount: 'Amount Requested', openDate: 'Application Opens' },
  proposal: { deadline: 'Proposal Due Date', amount: 'Funding Requested', openDate: 'Proposal Start Date' },
  contract: { deadline: 'Contract End Date', amount: 'Contract Value', openDate: 'Contract Start Date' },
  partnership: { deadline: 'Partnership End Date', amount: 'Expected Contribution', openDate: 'Partnership Start Date' },
  other: { deadline: 'Deadline', amount: 'Amount', openDate: 'Start Date' },
};

export default function GrantsNewProject() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [projectType, setProjectType] = useState('grant_application');
  const [deadlineIsText, setDeadlineIsText] = useState(false);
  const [amountIsText, setAmountIsText] = useState(false);
  const [form, setForm] = useState({
    title: '', status: 'draft', project_type: 'grant_application',
    funding_source_id: '', funding_source_name: '',
    group_id: '', description: '', amount_requested: '', amount_requested_text: '',
    submission_deadline: '', submission_deadline_text: '',
    start_date: '', priority: 'medium', tags: '', notes: ''
  });

  const { data: funders = [] } = useQuery({ queryKey: ['fundingSources'], queryFn: () => base44.entities.FundingSource.list('name') });
  const { data: groups = [] } = useQuery({ queryKey: ['projectGroups'], queryFn: () => base44.entities.ProjectGroup.list('name') });

  const labels = LABELS[projectType] || LABELS.other;

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleFunderChange = (id) => {
    const f = funders.find(x => x.id === id);
    set('funding_source_id', id);
    set('funding_source_name', f?.name || '');
  };

  const handleGroupChange = (id) => {
    const g = groups.find(x => x.id === id);
    set('group_id', id);
    set('group_name', g?.name || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const data = {
      title: form.title,
      status: form.status,
      project_type: projectType,
      funding_source_id: form.funding_source_id || undefined,
      funding_source_name: form.funding_source_name || undefined,
      group_id: form.group_id || undefined,
      group_name: form.group_name || undefined,
      description: form.description || undefined,
      priority: form.priority,
      notes: form.notes || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };
    if (!amountIsText && form.amount_requested) data.amount_requested = parseFloat(form.amount_requested);
    if (!deadlineIsText && form.submission_deadline) data.submission_deadline = form.submission_deadline;
    if (form.start_date) data.start_date = form.start_date;
    const created = await base44.entities.Project.create(data);
    navigate(`/grants/projects/${created.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/grants/projects"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-xl font-heading font-bold">New Proposal</h1>
          <p className="text-xs text-muted-foreground">Create a new grant application or proposal</p>
        </div>
      </div>

      {/* Type selector */}
      <div>
        <p className="text-sm font-medium mb-2">Project Type</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROJECT_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setProjectType(t.value); set('project_type', t.value); }}
              className={`text-left p-3 rounded-lg border transition-all ${projectType === t.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
            >
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Proposal Title *</Label>
              <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. IRCC Settlement Services 2025-2026" className="mt-1" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="draft">Draft</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="awarded">Awarded</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              <div>
                <Label>Priority</Label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Funder</Label>
              <select value={form.funding_source_id} onChange={e => handleFunderChange(e.target.value)} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">— Select funder —</option>
                {funders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Group</Label>
              <select value={form.group_id} onChange={e => handleGroupChange(e.target.value)} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">— No group —</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Tags <span className="text-muted-foreground text-xs">(comma separated)</span></Label>
              <Input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. federal, settlement, priority" className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Dates &amp; Amounts</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{labels.deadline}</Label>
                <button type="button" onClick={() => setDeadlineIsText(v => !v)} className="text-xs text-primary hover:underline">
                  {deadlineIsText ? 'Use date picker' : 'Use text (e.g. "Rolling")'}
                </button>
              </div>
              {deadlineIsText
                ? <Input value={form.submission_deadline_text} onChange={e => set('submission_deadline_text', e.target.value)} placeholder="e.g. Rolling, TBD, End of Q2" />
                : <Input type="date" value={form.submission_deadline} onChange={e => set('submission_deadline', e.target.value)} />
              }
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />{labels.amount}</Label>
                <button type="button" onClick={() => setAmountIsText(v => !v)} className="text-xs text-primary hover:underline">
                  {amountIsText ? 'Use number' : 'Use text (e.g. "Up to $50k")'}
                </button>
              </div>
              {amountIsText
                ? <Input value={form.amount_requested_text} onChange={e => set('amount_requested_text', e.target.value)} placeholder="e.g. Up to $50,000" />
                : <Input type="number" value={form.amount_requested} onChange={e => set('amount_requested', e.target.value)} placeholder="0.00" />
              }
            </div>
            <div>
              <Label>{labels.openDate}</Label>
              <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <Label>Description / Notes</Label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              placeholder="Brief description of this project..."
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/grants/projects"><Button variant="outline" type="button">Back to Proposals</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Proposal'}</Button>
        </div>
      </form>
    </div>
  );
}