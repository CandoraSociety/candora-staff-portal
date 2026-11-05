import React from 'react';
import { GraduationCap, CalendarDays, User, ClipboardCheck, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  FOOD_PLACEMENT_TYPES, PLACEMENT_CHECKPOINTS, PLACEMENT_STATUS_STYLES,
  checkpointsDone, formatPlacementDate,
} from '@/lib/internalPlacements';

export default function PlacementCard({ placement, onOpen }) {
  const done = checkpointsDone(placement);
  const type = FOOD_PLACEMENT_TYPES[placement.placement_type]?.short || placement.placement_type;

  return (
    <button
      type="button"
      onClick={() => onOpen(placement)}
      className="w-full text-left rounded-xl border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="font-semibold truncate">{placement.client_name || 'Unnamed participant'}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{type}</div>
        </div>
        <Badge variant="outline" className={`capitalize flex-shrink-0 ${PLACEMENT_STATUS_STYLES[placement.status] || ''}`}>
          {placement.status}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3 h-3" /> {formatPlacementDate(placement.start_date)}
        </span>
        <span className="flex items-center gap-1 truncate">
          <User className="w-3 h-3" /> {placement.assigned_worker_name || 'No worker set'}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          <ClipboardCheck className="w-3 h-3" /> {done} of {PLACEMENT_CHECKPOINTS.length} checkpoints
        </span>
        {placement.evaluation_completed && (
          <span className="flex items-center gap-1 text-green-600">
            <Star className="w-3 h-3" /> Evaluated
          </span>
        )}
      </div>

      <div className="mt-2 flex gap-1">
        {PLACEMENT_CHECKPOINTS.map((c) => (
          <span
            key={c.key}
            title={c.label}
            className={`h-1 flex-1 rounded-full ${placement[c.doneKey] ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>
    </button>
  );
}