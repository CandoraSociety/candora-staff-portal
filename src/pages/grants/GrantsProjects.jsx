import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, FolderOpen, Tag, ChevronDown, ChevronRight, MoreVertical, Pencil, Trash2, Group } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import GroupManagerModal from '@/components/projects/GroupManagerModal';
import AssignGroupModal from '@/components/projects/AssignGroupModal';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  submitted: 'bg-purple-100 text-purple-700',
  awarded: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  closed: 'bg-gray-100 text-gray-500',
};

const STATUS_TABS = ['all', 'draft', 'in_progress', 'submitted', 'awarded', 'declined', 'closed'];

export default function GrantsProjects() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [groupView, setGroupView] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [assignGroupTarget, setAssignGroupTarget] = useState(null);

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list('-updated_date', 200) });
  const { data: groups = [] } = useQuery({ queryKey: ['projectGroups'], queryFn: () => base44.entities.ProjectGroup.list('name') });

  const allTags = useMemo(() => {
    const tags = new Set();
    projects.forEach(p => (p.tags || []).forEach(t => tags.add(t)));
    return [...tags].sort();
  }, [projects]);

  const filtered = useMemo(() => {
    let list = projects;
    if (statusTab !== 'all') list = list.filter(p => p.status === statusTab);
    if (search) list = list.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()) || p.funding_source_name?.toLowerCase().includes(search.toLowerCase()));
    if (selectedTag) list = list.filter(p => (p.tags || []).includes(selectedTag));
    if (selectedGroup) list = list.filter(p => p.group_id === selectedGroup);
    if (sortBy === 'updated') list = [...list].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
    else if (sortBy === 'deadline') list = [...list].sort((a, b) => { if (!a.submission_deadline) return 1; if (!b.submission_deadline) return -1; return new Date(a.submission_deadline) - new Date(b.submission_deadline); });
    else if (sortBy === 'amount') list = [...list].sort((a, b) => (b.amount_requested || 0) - (a.amount_requested || 0));
    else if (sortBy === 'title') list = [...list].sort((a, b) => a.title?.localeCompare(b.title));
    return list;
  }, [projects, statusTab, search, selectedTag, selectedGroup, sortBy]);

  const groupedProjects = useMemo(() => {
    const map = {};
    filtered.forEach(p => {
      const key = p.group_id || '__ungrouped__';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [filtered]);

  const toggleGroup = (key) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    await base44.entities.Project.delete(id);
    queryClient.invalidateQueries(['projects']);
  };

  const ProjectRow = ({ project }) => (
    <div className="flex items-center justify-between group hover:bg-muted/50 rounded-lg p-3 -mx-1 transition-colors">
      <Link to={`/grants/projects/${project.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{project.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{project.funding_source_name || 'No funder'}</span>
              {project.submission_deadline && (
                <span className="text-xs text-muted-foreground">· Due {format(new Date(project.submission_deadline), 'MMM d, yyyy')}</span>
              )}
              {(project.tags || []).map(tag => (
                <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {project.amount_requested && (
          <span className="text-xs text-muted-foreground hidden sm:inline">${project.amount_requested.toLocaleString()}</span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-700'}`}>
          {project.status?.replace('_', ' ')}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild><Link to={`/grants/projects/${project.id}`}><Pencil className="h-3.5 w-3.5 mr-2" />Open</Link></DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAssignGroupTarget(project)}><Group className="h-3.5 w-3.5 mr-2" />Assign Group / Tags</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(project.id)}><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const renderGroupSection = (key, items) => {
    const group = groups.find(g => g.id === key);
    const label = key === '__ungrouped__' ? 'Ungrouped' : group?.name || 'Unknown Group';
    const collapsed = collapsedGroups[key];
    return (
      <div key={key} className="mb-4">
        <button onClick={() => toggleGroup(key)} className="flex items-center gap-2 w-full text-left py-2 px-1 hover:text-primary transition-colors">
          {collapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-semibold">{label}</span>
          {group?.color && <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: group.color }} />}
          <span className="text-xs text-muted-foreground ml-1">({items.length})</span>
        </button>
        {!collapsed && (
          <Card>
            <CardContent className="pt-2 pb-2">
              {items.map(p => <ProjectRow key={p.id} project={p} />)}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{projects.length} total projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowGroupManager(true)}><FolderOpen className="h-4 w-4 mr-1.5" />Groups</Button>
          <Link to="/grants/projects/new"><Button className="gap-2"><Plus className="h-4 w-4" />New Project</Button></Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="updated">Last Updated</option>
          <option value="deadline">Deadline</option>
          <option value="amount">Amount</option>
          <option value="title">Title A–Z</option>
        </select>
        <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="">All Groups</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        {allTags.length > 0 && (
          <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">All Tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <Button variant={groupView ? 'default' : 'outline'} size="sm" onClick={() => setGroupView(v => !v)}>
          {groupView ? 'Flat View' : 'Group View'}
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap border-b pb-2">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setStatusTab(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-md capitalize transition-colors ${statusTab === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {s === 'all' ? `All (${projects.length})` : `${s.replace('_', ' ')} (${projects.filter(p => p.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground text-sm">No projects found.</p></CardContent></Card>
      ) : groupView ? (
        <div>
          {Object.entries(groupedProjects).map(([key, items]) => renderGroupSection(key, items))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-2 pb-2">
            {filtered.map(p => <ProjectRow key={p.id} project={p} />)}
          </CardContent>
        </Card>
      )}

      {showGroupManager && <GroupManagerModal onClose={() => { setShowGroupManager(false); queryClient.invalidateQueries(['projectGroups']); }} />}
      {assignGroupTarget && <AssignGroupModal project={assignGroupTarget} groups={groups} onClose={() => { setAssignGroupTarget(null); queryClient.invalidateQueries(['projects']); }} />}
    </div>
  );
}