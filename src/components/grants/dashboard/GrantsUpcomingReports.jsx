import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

const STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  draft_complete: 'bg-amber-100 text-amber-700',
  under_review: 'bg-purple-100 text-purple-700',
  submitted: 'bg-green-100 text-green-700',
  accepted: 'bg-green-100 text-green-700',
  revision_requested: 'bg-red-100 text-red-700',
};

export default function GrantsUpcomingReports({ reports = [], projects = [] }) {
  const pending = reports
    .filter(r => r.due_date && ['not_started', 'in_progress', 'draft_complete', 'under_review'].includes(r.status))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-accent" />
          Upcoming Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No pending reports</p>
        ) : (
          <div className="space-y-2">
            {pending.map(r => {
              const project = projects.find(p => p.id === r.project_id);
              const daysLeft = differenceInDays(parseISO(r.due_date), new Date());
              const isUrgent = daysLeft <= 7;
              return (
                <Link
                  key={r.id}
                  to={`/grants/projects/${r.project_id}?tab=reports`}
                  className="block hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{project?.title || 'Unknown Project'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        {daysLeft === 0 ? 'Today' : daysLeft < 0 ? 'Overdue' : `${daysLeft}d`}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                        {r.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <Link to="/grants/reports" className="block text-xs text-primary hover:underline mt-3">
          View all reports →
        </Link>
      </CardContent>
    </Card>
  );
}