import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { computeCrtBillingCounts } from '@/lib/crtBillingCounts';
import { CalendarDays } from 'lucide-react';

const TILES = [
  { key: 'deaStarters', label: 'CEIS (DEA) Starters', col: 'DEA Start Date', tone: 'blue' },
  { key: 'wdComplete', label: 'WD Complete', col: 'Placement Outcome', tone: 'blue' },
  { key: 'wdPlacementCompletion', label: 'WD Placement (EDA Completion)', col: 'Service Outcome', tone: 'red' },
  { key: 'dea90Day', label: 'CEIS (DEA) 90 Day', col: '90 Day Outcome', tone: 'red' },
  { key: 'wd90Day', label: 'WD 90 Day', col: '90 Day Outcome', tone: 'red' },
  { key: 'serviceNavFee', label: 'Service Navigation Fee', col: 'Service Nav Support', tone: 'red' },
];

const TONE_STYLES = {
  blue: 'border-blue-200 bg-blue-50 text-blue-800',
  red: 'border-red-200 bg-red-50 text-red-800',
};

export default function CrtBillingHeader({ clients, viewedFileName }) {
  const counts = useMemo(
    () => computeCrtBillingCounts(clients, viewedFileName),
    [clients, viewedFileName]
  );

  if (!counts.hasMonth) return null;

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <CalendarDays className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">
            Billing Summary — {counts.monthLabel}
          </h3>
          <span className="text-xs text-slate-400">
            Counts for the month being viewed (from portal data)
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TILES.map((t) => (
            <div
              key={t.key}
              className={`rounded-lg border px-3 py-2.5 ${TONE_STYLES[t.tone]}`}
            >
              <p className="text-xs font-medium leading-tight opacity-80">{t.label}</p>
              <p className="text-2xl font-bold mt-1">{counts[t.key]}</p>
              <p className="text-[10px] mt-0.5 uppercase tracking-wide opacity-60">{t.col}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}