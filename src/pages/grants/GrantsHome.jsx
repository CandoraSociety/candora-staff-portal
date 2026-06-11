import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FolderOpen, Users, FileText, BarChart3, Bell, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  submitted: 'bg-purple-100 text-purple-700',
  awarded: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  closed: 'bg-gray-100 text-gray-500',
};

export default function GrantsHome() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 100),
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => base44.entities.Reminder.filter({ status: 'pending' }),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list('-updated_date', 50),
  });

  const activeProjects = projects.filter(p => ['draft', 'in_progress', 'submitted'].includes(p.status));
  const awardedProjects = projects.filter(p => p.status === 'awarded');
  const totalAwarded = awardedProjects.reduce((sum, p) => sum + (p.amount_awarded || 0), 0);

  const upcomingDeadlines = projects
    .filter(p => p.submission_deadline && !['awarded', 'declined', 'cancelled', 'closed'].includes(p.status))
    .sort((a, b) => new Date(a.submission_deadline) - new Date(b.submission_deadline))
    .slice(0, 5);

  const overdueReminders = reminders.filter(r => isPast(new Date(r.remind_at)));
  const upcomingReminders = reminders
    .filter(r => !isPast(new Date(r.remind_at)))
    .sort((a, b) => new Date(a.remind_at) - new Date(b.remind_at))
    .slice(0, 4);

  const pendingReports = reports.filter(r => ['not_started', 'in_progress', 'draft_complete'].includes(r.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Grant / Proposal Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">Track funding applications, manage proposals, and report to funders.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{activeProjects.length}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Awarded</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">
                  ${totalAwarded.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Reports</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{pendingReports.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Overdue Reminders</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{overdueReminders.length}</p>
              </div>
              <AlertCircle className={`h-8 w-8 opacity-70 ${overdueReminders.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Upcoming Submission Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines</p>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map(p => {
                  const deadline = new Date(p.submission_deadline);
                  const isUrgent = isWithinInterval(deadline, { start: new Date(), end: addDays(new Date(), 14) });
                  return (
                    <Link key={p.id} to={`/grants/projects/${p.id}`} className="flex items-center justify-between group hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.funding_source_name || 'No funder'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                          {format(deadline, 'MMM d')}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            <Link to="/grants/projects" className="block text-xs text-primary hover:underline mt-3">
              View all projects →
            </Link>
          </CardContent>
        </Card>

        {/* Upcoming Reminders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Reminders
              {overdueReminders.length > 0 && (
                <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  {overdueReminders.length} overdue
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueReminders.length === 0 && upcomingReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pending reminders</p>
            ) : (
              <div className="space-y-2">
                {overdueReminders.slice(0, 2).map(r => (
                  <div key={r.id} className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-red-800 truncate">{r.title}</p>
                      <p className="text-xs text-red-600">{format(new Date(r.remind_at), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                ))}
                {upcomingReminders.map(r => (
                  <div key={r.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Bell className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(r.remind_at), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/grants/reminders" className="block text-xs text-primary hover:underline mt-3">
              Manage reminders →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-primary" /> Recent Projects</span>
            <Link to="/grants/projects" className="text-xs text-primary font-normal hover:underline">View all</Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No projects yet. <Link to="/grants/projects" className="text-primary hover:underline">Create your first project →</Link></p>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 6).map(p => (
                <Link key={p.id} to={`/grants/projects/${p.id}`} className="flex items-center justify-between group hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.funding_source_name || 'No funder assigned'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {p.amount_requested && (
                      <span className="text-xs text-muted-foreground">${p.amount_requested.toLocaleString()}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}