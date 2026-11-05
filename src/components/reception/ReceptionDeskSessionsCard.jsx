import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AB_TIME_ZONE } from '@/lib/abTime';

// Day and clock time always read in Alberta time (UTC-6, all year) — never the
// browser's own zone, which is what drifts the "today" list and the sign-in times.
const abDayKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: AB_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});
const abTime = new Intl.DateTimeFormat('en-US', {
  timeZone: AB_TIME_ZONE, hour: 'numeric', minute: '2-digit',
});
// Stored stamps are UTC; a value that arrives without a zone marker is UTC too,
// so tag it instead of letting the browser read it as local time.
const toStampDate = (value) => {
  if (!value) return null;
  const raw = String(value);
  if (!raw.includes('T')) {
    const [y, m, d] = raw.split('-').map(Number);
    return new Date(y, m - 1, d, 12);
  }
  return new Date(/[Zz]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw}Z`);
};

// Who has been at the external Reception desk today — read from the kiosk
// sign-ins so the front desk can see coverage at a glance.
export default function ReceptionDeskSessionsCard() {
  const { data: sessions = [] } = useQuery({
    queryKey: ['reception-desk-sessions'],
    queryFn: () => base44.entities.ReceptionDeskSession.list('-started_at', 50),
  });

  const today = abDayKey.format(new Date());
  const todaySessions = sessions.filter((s) => s.started_at && abDayKey.format(toStampDate(s.started_at)) === today);

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
                  {abTime.format(toStampDate(s.started_at))}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}