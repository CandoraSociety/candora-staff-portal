import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, CalendarDays, HeartHandshake, Info, Target } from 'lucide-react';

const SOURCES = [
  {
    key: 'fifty_fifty',
    label: '50/50 sales',
    icon: Ticket,
    description: 'Ticket sales and the house half of 50/50 draws run at events, in the cafe and online.',
  },
  {
    key: 'events',
    label: 'Fundraising events',
    icon: CalendarDays,
    description: 'Net proceeds from galas, dinners, raffles and other ticketed fundraising events.',
  },
  {
    key: 'fundraisers',
    label: 'Fundraisers',
    icon: HeartHandshake,
    description: 'Individual and team fundraisers — pledge drives, sponsored challenges and peer-to-peer pages.',
  },
];

function SourceStat({ source }) {
  const Icon = source.icon;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Icon className="w-3 h-3" /> {source.label}
        </div>
        <div className="text-2xl font-bold text-foreground mt-1">—</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">Not connected yet</div>
      </CardContent>
    </Card>
  );
}

// Fundraising income in its own right — kept apart from gifts recorded in the donor portal.
export default function FundraisingSources() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SOURCES.map((source) => (
          <SourceStat key={source.key} source={source} />
        ))}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" /> Total fundraising
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">—</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Nothing recorded yet</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fundraising sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {SOURCES.map((source) => {
              const Icon = source.icon;
              return (
                <div key={source.key} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{source.label}</p>
                      <p className="text-xs text-muted-foreground">{source.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="whitespace-nowrap">Not connected</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3">
        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Fundraising income is tracked separately from donations. Once 50/50 sales, fundraising events and fundraisers
          are set up, their proceeds will appear here — donations stay in the Donations tab.
        </p>
      </div>
    </div>
  );
}