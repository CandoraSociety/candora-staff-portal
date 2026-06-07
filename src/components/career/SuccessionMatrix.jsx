import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';

const readinessColors = {
  ready_now: 'bg-green-100 text-green-800 border-green-200',
  ready_1_year: 'bg-blue-100 text-blue-800 border-blue-200',
  ready_2_years: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  developing: 'bg-orange-100 text-orange-800 border-orange-200',
  not_applicable: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function SuccessionMatrix({ plans }) {
  const byTarget = {};
  plans.forEach(plan => {
    if (!plan.target_position) return;
    if (!byTarget[plan.target_position]) byTarget[plan.target_position] = [];
    byTarget[plan.target_position].push(plan);
  });

  const roles = Object.keys(byTarget);
  if (roles.length === 0) return <EmptyState icon={Users} title="No succession plans" description="Add career plans with target positions to see the matrix." />;

  const readinessOrder = { ready_now: 0, ready_1_year: 1, ready_2_years: 2, developing: 3, not_applicable: 4 };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Showing succession candidates grouped by target role.</p>
      {roles.sort().map(role => {
        const candidates = byTarget[role].sort((a, b) => (readinessOrder[a.readiness] ?? 9) - (readinessOrder[b.readiness] ?? 9));
        return (
          <Card key={role}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                {role}
                <span className="text-sm font-normal text-muted-foreground">({candidates.length} candidate{candidates.length !== 1 ? 's' : ''})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {candidates.map(plan => (
                <div key={plan.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                  <div>
                    <p className="font-medium">{plan.employee_name}</p>
                    <p className="text-muted-foreground text-xs">{plan.current_position}</p>
                  </div>
                  <Badge className={`${readinessColors[plan.readiness]} border text-xs`}>
                    {plan.readiness?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}