import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, FileText, CalendarCheck, Users, Star, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const TYPE_ICONS = {
  internal: CalendarCheck,
  funder: Users,
  special: Star,
  agr: BookOpen,
};

const TYPE_LABELS = {
  internal: 'Internal',
  funder: 'Funder',
  special: 'Special',
  agr: 'Annual General Report',
};

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  submitted: 'bg-purple-100 text-purple-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default function ReportingHome() {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['generated-reports'],
    queryFn: () => base44.entities.GeneratedReport.list('-updated_date'),
  });

  const byType = (type) => reports.filter(r => r.report_type === type);
  const active = reports.filter(r => r.status !== 'archived');
  const drafts = reports.filter(r => r.status === 'draft');
  const inProgress = reports.filter(r => r.status === 'in_progress');
  const completed = reports.filter(r => r.status === 'completed' || r.status === 'submitted');

  const stats = [
    { label: 'Total Reports', value: reports.length, icon: FileText, color: 'text-accent' },
    { label: 'Drafts', value: drafts.length, icon: Clock, color: 'text-slate-500' },
    { label: 'In Progress', value: inProgress.length, icon: FileText, color: 'text-blue-500' },
    { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'text-green-500' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 rounded-full animate-spin candora-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-accent">Reports Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">Generate and manage organizational reports</p>
        </div>
        <Link to="/reporting/internal">
          <Button className="gap-2 shadow-sm"><Plus className="w-4 h-4" />New Report</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white border rounded-xl p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${s.color} bg-accent/5`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Report Type Cards */}
      <div>
        <h2 className="font-heading font-semibold text-base mb-3">Report Types</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {['internal', 'funder', 'special', 'agr'].map(type => {
            const Icon = TYPE_ICONS[type];
            const typeReports = byType(type);
            const typeDrafts = typeReports.filter(r => r.status === 'draft' || r.status === 'in_progress');
            return (
              <Link
                key={type}
                to={`/reporting/${type === 'agr' ? 'agr' : type}`}
                className="bg-white border rounded-xl p-5 hover:shadow-md hover:border-accent/30 transition-all group"
              >
                <div className="p-2.5 rounded-lg bg-accent/5 text-accent w-fit mb-3 group-hover:bg-accent group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm">{TYPE_LABELS[type]}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {typeReports.length} report{typeReports.length !== 1 ? 's' : ''}
                  {typeDrafts.length > 0 && ` · ${typeDrafts.length} active`}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      {active.length > 0 && (
        <div>
          <h2 className="font-heading font-semibold text-base mb-3">Recent Reports</h2>
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="divide-y">
              {active.slice(0, 8).map(r => {
                const Icon = TYPE_ICONS[r.report_type] || FileText;
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABELS[r.report_type] || r.report_type}
                        {r.updated_date && ` · Updated ${format(new Date(r.updated_date), 'MMM d, yyyy')}`}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-600'}`}>
                      {r.status?.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
            {active.length > 8 && (
              <div className="px-4 py-2 bg-slate-50 text-center">
                <span className="text-xs text-muted-foreground">{active.length - 8} more reports</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}