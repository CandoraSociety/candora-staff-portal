import React from 'react';
import { TrendingUp, FolderOpen, BarChart3, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function GrantsStatsRow({ projects = [], reports = [] }) {
  const active = projects.filter(p => ['draft', 'in_progress', 'submitted'].includes(p.status)).length;
  const awarded = projects.filter(p => p.status === 'awarded');
  const totalAwarded = awarded.reduce((sum, p) => sum + (p.amount_awarded || 0), 0);
  const pendingReports = reports.filter(r => ['not_started', 'in_progress', 'draft_complete'].includes(r.status)).length;
  const totalRequested = projects.reduce((sum, p) => sum + (p.amount_requested || 0), 0);

  const stats = [
    { label: 'Active Projects', value: active, icon: FolderOpen, color: 'text-blue-500' },
    { label: 'Total Awarded', value: `$${totalAwarded.toLocaleString()}`, icon: TrendingUp, color: 'text-green-500' },
    { label: 'Pending Reports', value: pendingReports, icon: BarChart3, color: 'text-amber-500' },
    { label: 'Total Requested', value: `$${totalRequested.toLocaleString()}`, icon: CheckCircle, color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{s.value}</p>
              </div>
              <s.icon className={`h-8 w-8 opacity-60 ${s.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}