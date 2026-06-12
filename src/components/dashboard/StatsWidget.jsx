import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, AppWindow, Shield, Building2 } from 'lucide-react';

export default function StatsWidget({ stats }) {
  const items = [
    { label: 'Active Users', value: stats?.users || 0, icon: Users, color: 'text-primary bg-primary/10' },
    { label: 'Portal Tools', value: stats?.cards || 0, icon: AppWindow, color: 'text-accent-foreground bg-accent/10' },
    { label: 'Departments', value: stats?.departments || 0, icon: Building2, color: 'text-chart-3 bg-chart-3/10' },
    { label: 'Permissions', value: stats?.permissions || 0, icon: Shield, color: 'text-chart-4 bg-chart-4/10' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="shadow-sm border-border/50">
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color} mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-display font-bold text-foreground"><span>{item.value}</span></p>
              <p className="text-xs text-muted-foreground mt-0.5"><span>{item.label}</span></p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}