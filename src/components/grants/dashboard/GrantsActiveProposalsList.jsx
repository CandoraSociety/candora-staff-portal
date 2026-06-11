import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  submitted: 'bg-purple-100 text-purple-700',
  awarded: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  closed: 'bg-gray-100 text-gray-500',
};

function ProjectRow({ project }) {
  return (
    <Link
      to={`/grants/projects/${project.id}`}
      className="flex items-center justify-between group hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{project.title}</p>
        <p className="text-xs text-muted-foreground">{project.funding_source_name || 'No funder'}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {project.amount_requested && (
          <span className="text-xs text-muted-foreground hidden sm:inline">${project.amount_requested.toLocaleString()}</span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-700'}`}>
          {project.status?.replace('_', ' ')}
        </span>
      </div>
    </Link>
  );
}

export default function GrantsActiveProposalsList({ projects = [] }) {
  const inProgress = projects.filter(p => ['in_progress', 'draft'].includes(p.status));
  const submitted = projects.filter(p => p.status === 'submitted');

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No projects yet.</p>
          <Link to="/grants/projects" className="text-xs text-primary hover:underline mt-1 block">Create your first project →</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {inProgress.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">In Progress</p>
            <div className="space-y-0.5">
              {inProgress.slice(0, 5).map(p => <ProjectRow key={p.id} project={p} />)}
            </div>
          </CardContent>
        </Card>
      )}
      {submitted.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Submitted — Awaiting Decision</p>
            <div className="space-y-0.5">
              {submitted.slice(0, 5).map(p => <ProjectRow key={p.id} project={p} />)}
            </div>
          </CardContent>
        </Card>
      )}
      {inProgress.length === 0 && submitted.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-0.5">
              {projects.slice(0, 6).map(p => <ProjectRow key={p.id} project={p} />)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}