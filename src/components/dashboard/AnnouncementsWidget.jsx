import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, AlertTriangle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const priorityConfig = {
  urgent: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
  high: { color: 'bg-accent/10 text-accent-foreground border-accent/20', icon: AlertTriangle },
  normal: { color: 'bg-primary/10 text-primary border-primary/20', icon: Info },
  low: { color: 'bg-muted text-muted-foreground border-border', icon: Info },
};

export default function AnnouncementsWidget({ announcements = [] }) {
  const active = announcements
    .filter(a => a.is_active)
    .sort((a, b) => {
      const order = { urgent: 0, high: 1, normal: 2, low: 3 };
      return (order[a.priority] || 2) - (order[b.priority] || 2);
    })
    .slice(0, 5);

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" />
          <CardTitle className="text-base font-heading font-semibold">Announcements</CardTitle>
          {active.length > 0 && (
            <Badge variant="secondary" className="text-xs ml-auto">{active.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {active.map(ann => {
            const config = priorityConfig[ann.priority] || priorityConfig.normal;
            return (
              <div key={ann.id} className={`p-3 rounded-xl border ${config.color}`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ann.title}</p>
                    <p className="text-xs mt-1 opacity-80 line-clamp-2">{ann.content}</p>
                    <p className="text-[10px] mt-2 opacity-60">
                      {formatDistanceToNow(new Date(ann.created_date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {active.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No announcements right now</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}