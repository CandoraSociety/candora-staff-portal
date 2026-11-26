import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Pencil, Copy, CalendarPlus, Eye, EyeOff, ExternalLink } from 'lucide-react';
import ProgramStatusBadge from './ProgramStatusBadge';
import { categoryLabel } from '@/lib/websitePrograms';

// One program in the list: what it is, what its page says right now, and the four
// things staff do to it most often.
export default function ProgramCard({ program, status, seatsTaken, onEdit, onTogglePublish, onDuplicate, onGenerateSessions, busy }) {
  const capacity = Number(program.capacity) || 0;
  const remaining = capacity ? Math.max(0, capacity - Number(seatsTaken || 0)) : null;

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {program.image_url ? (
          <img src={program.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-muted shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold leading-tight truncate">{program.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {categoryLabel(program.category)} · /programs/{program.slug}
              </p>
            </div>
            <ProgramStatusBadge status={status} />
          </div>
          {program.summary && <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5">{program.summary}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{program.registration_mode === 'none' ? 'Drop-in, no button' : 'Registration form'}</span>
        {capacity > 0 ? <span>{remaining} of {capacity} seats left</span> : <span>No seat limit</span>}
        {program.schedule_summary && <span className="truncate">{program.schedule_summary}</span>}
        {program.is_published ? (
          <span className="text-emerald-700 font-medium">Live on the website</span>
        ) : (
          <span className="text-amber-700 font-medium">Not published</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
        <Button size="sm" variant="outline" onClick={onTogglePublish} disabled={busy}>
          {program.is_published ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
          {program.is_published ? 'Unpublish' : 'Publish'}
        </Button>
        <Button size="sm" variant="outline" onClick={onDuplicate} disabled={busy}>
          <Copy className="w-3.5 h-3.5 mr-1.5" /> Duplicate
        </Button>
        <Button size="sm" variant="outline" onClick={onGenerateSessions} disabled={busy}>
          <CalendarPlus className="w-3.5 h-3.5 mr-1.5" /> Sessions
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link to={`/website/registrations?program=${program.id}`}>
            <Users className="w-3.5 h-3.5 mr-1.5" /> Registrations
          </Link>
        </Button>
        {program.is_published && (
          <Button size="sm" variant="ghost" asChild>
            <a href={`https://candora360.ca/programs/${program.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View page
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}