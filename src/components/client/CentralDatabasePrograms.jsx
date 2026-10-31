import { Route } from 'lucide-react';
import { PROGRAM_META, STREAM_LABELS, PROGRAM_STATUS_LABELS, fmtDate } from '@/lib/centralPreviewLabels';

// Program-participation indicators kept on a central database record — every
// Candora program this person is (or was) part of, not just Pathways.
export default function CentralDatabasePrograms({ participations = [] }) {
  if (!participations.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No program participation recorded in the central database yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {participations.map((pp, i) => {
        const meta = PROGRAM_META[pp.program] || { label: pp.program, color: '#64748b' };
        const d = pp.details;
        return (
          <div
            key={`${pp.program}-${i}`}
            className="rounded-lg border p-3 flex flex-wrap items-center gap-x-5 gap-y-1"
            style={{ backgroundColor: `${meta.color}12`, borderColor: `${meta.color}40` }}
          >
            <span className="text-sm font-semibold flex items-center gap-1.5 shrink-0" style={{ color: meta.color }}>
              <Route className="w-4 h-4" /> {meta.label}
            </span>
            {d ? (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                <span className="text-muted-foreground">Start: <span className="font-medium text-foreground">{fmtDate(d.start_date)}</span></span>
                {d.stream && <span className="text-muted-foreground">Stream: <span className="font-medium text-foreground">{STREAM_LABELS[d.stream] || d.stream}</span></span>}
                <span className="text-muted-foreground">Status: <span className="font-medium text-foreground">{PROGRAM_STATUS_LABELS[d.status] || d.status || '—'}</span></span>
                {d.end_date && (
                  <span className="text-muted-foreground">
                    {d.status === 'cancelled' ? 'Cancelled' : 'Completed'}: <span className="font-medium text-foreground">{fmtDate(d.end_date)}</span>
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs" style={{ color: meta.color }}>{pp.indicator || 'Participating'}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}