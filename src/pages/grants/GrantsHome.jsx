import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import GrantsStatsRow from '@/components/grants/dashboard/GrantsStatsRow';
import GrantsOrgQuickReference from '@/components/grants/dashboard/GrantsOrgQuickReference';
import GrantsActiveProposalsList from '@/components/grants/dashboard/GrantsActiveProposalsList';
import GrantsReportCalendar from '@/components/grants/dashboard/GrantsReportCalendar';
import GrantsUpcomingReports from '@/components/grants/dashboard/GrantsUpcomingReports';
import GrantsCountdownBanner from '@/components/grants/dashboard/GrantsCountdownBanner';

function buildAllDeadlines(projects, reports, milestones) {
  const deadlines = [];
  reports.forEach(r => {
    if (!r.due_date) return;
    const project = projects.find(p => p.id === r.project_id);
    deadlines.push({ id: `report-${r.id}`, type: 'report', date: r.due_date, title: r.title, project_id: r.project_id, projectTitle: project?.title || 'Unknown Project' });
  });
  projects.forEach(p => {
    if (!p.submission_deadline) return;
    deadlines.push({ id: `proposal-${p.id}`, type: 'proposal', date: p.submission_deadline, title: p.title, project_id: p.id });
  });
  milestones.forEach(m => {
    if (!m.due_date) return;
    deadlines.push({ id: `milestone-${m.id}`, type: 'milestone', date: m.due_date, title: m.title, project_id: m.project_id });
  });
  return deadlines;
}

export default function GrantsHome() {
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list('-updated_date') });
  const { data: reports = [] } = useQuery({ queryKey: ['reports'], queryFn: () => base44.entities.Report.list('-due_date') });
  const { data: milestones = [] } = useQuery({ queryKey: ['milestones'], queryFn: () => base44.entities.ProjectMilestone.list('-due_date') });
  const { data: orgInfoList = [] } = useQuery({ queryKey: ['orgInfo'], queryFn: () => base44.entities.OrganizationInfo.list() });
  const orgInfo = orgInfoList[0];
  const allDeadlines = buildAllDeadlines(projects, reports, milestones);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-accent">Grant / Proposal Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your grants and proposals</p>
        </div>
        <Link to="/grants/projects/new">
          <Button className="gap-2 shadow-sm"><Plus className="w-4 h-4" />New Proposal</Button>
        </Link>
      </div>

      <GrantsCountdownBanner deadlines={allDeadlines} />

      <Link to="/filemanager/files" className="block">
        <div className="flex items-center gap-4 bg-accent/5 border border-accent/20 rounded-xl px-5 py-4 hover:shadow-md hover:border-accent/40 transition-all group">
          <div className="p-2.5 rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">File Storage</p>
            <p className="text-xs text-muted-foreground">Funder agreements, signed contracts &amp; past reports</p>
          </div>
          <span className="text-xs text-accent font-medium group-hover:underline">Browse files →</span>
        </div>
      </Link>

      <GrantsStatsRow projects={projects} reports={reports} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-semibold text-base">Recent Projects</h2>
              <Link to="/grants/projects" className="text-xs text-primary hover:underline font-medium">View all</Link>
            </div>
            <GrantsActiveProposalsList projects={projects} />
          </div>
          <GrantsReportCalendar reports={reports} projects={projects} milestones={milestones} />
        </div>
        <div className="space-y-6">
          <GrantsUpcomingReports reports={reports} projects={projects} />
          <GrantsOrgQuickReference orgInfo={orgInfo} />
        </div>
      </div>
    </div>
  );
}