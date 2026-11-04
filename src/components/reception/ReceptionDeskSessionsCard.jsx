import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Who has been at the external Reception desk today — read from the kiosk
// sign-ins so the front desk can see coverage at a glance.
export default function ReceptionDeskSessionsCard() {
  const { data: sessions = [] } = useQuery({
    queryKey: ['reception-desk-sessions'],
    queryFn: () => base44.entities.ReceptionDeskSession.list('-started_at', 50),
  });

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((s) => (s.started_at || '').startsWith(today));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Desk Sign-ins Today</CardTitle>
        <span className="text-xs text-muted-foreground">{todaySessions.length} today</span>
      </CardHeader>
      <CardContent>
        {todaySessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No external sign-ins today</p>
        ) : (
          <div className="space-y-1.5">
            {todaySessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  <UserCheck className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-sm text-foreground truncate">{s.operator_name}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {new Date(s.started_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}