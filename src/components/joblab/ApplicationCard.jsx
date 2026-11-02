import { useState } from 'react';
import { ExternalLink, Pencil, Trash2, ChevronDown, AlertCircle, Check } from 'lucide-react';
import { JLBadge, JLButton } from '@/components/joblab/ui';
import { STATUS_LABELS, STATUS_STYLES, formatDate, isPast } from '@/lib/joblab/constants';

// One tracker row: a saved listing (status 'saved') or a live application.
export default function ApplicationCard({ application, onEdit, onDelete, onMarkApplied, showApply }) {
  const [expanded, setExpanded] = useState(false);
  const late = isPast(application.deadline);

  const hasDetails =
    application.application_instructions || application.job_description ||
    application.notes || application.follow_up_date;

  return (
    <div className="bg-jl-card border border-jl-border rounded-xl shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="jl-heading text-base font-semibold text-jl-fg">{application.position}</h3>
            {application.status !== 'saved' && (
              <JLBadge className={STATUS_STYLES[application.status] || 'bg-jl-secondary text-jl-muted-fg'}>
                {STATUS_LABELS[application.status] || application.status}
              </JLBadge>
            )}
            {application.deadline && (
              <JLBadge className={late ? 'bg-red-50 text-red-600' : 'bg-jl-accent/15 text-jl-accent'}>
                {late && <AlertCircle className="h-3 w-3" />}
                {late ? 'Deadline passed' : `Apply by ${formatDate(application.deadline)}`}
              </JLBadge>
            )}
          </div>
          <p className="mt-1 text-sm text-jl-fg">{application.company}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-jl-muted-fg">
            {application.location && <span>{application.location}</span>}
            {application.date_applied && <span>Applied: {formatDate(application.date_applied)}</span>}
            {application.salary_range && <span>{application.salary_range}</span>}
          </div>
          {application.how_to_apply && (
            <p className="mt-1 text-xs text-jl-muted-fg">
              How to apply: {application.how_to_apply.replace(/_/g, ' ')}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {showApply && onMarkApplied && (
            <JLButton size="sm" variant="outline" onClick={() => onMarkApplied(application)} className="mr-1">
              <Check className="h-3.5 w-3.5" /> Mark Applied
            </JLButton>
          )}
          {application.job_url && (
            <a
              href={application.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 text-jl-muted-fg hover:bg-jl-secondary"
              aria-label="Open job posting"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={() => onEdit(application)}
            className="rounded-lg p-2 text-jl-muted-fg hover:bg-jl-secondary"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(application)}
            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {hasDetails && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-jl-primary"
          >
            {expanded ? 'Show less' : 'Show more'}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {expanded && (
            <div className="mt-2 space-y-2">
              {application.application_instructions && (
                <div className="rounded-lg bg-jl-accent/5 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-jl-accent">How to apply</p>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-jl-fg">{application.application_instructions}</p>
                </div>
              )}
              {application.job_description && (
                <div className="rounded-lg bg-jl-secondary p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-jl-muted-fg">Job description</p>
                  <p className="mt-1 line-clamp-6 whitespace-pre-wrap text-xs text-jl-fg">{application.job_description}</p>
                </div>
              )}
              {application.notes && (
                <div className="rounded-lg bg-white p-3 ring-1 ring-jl-border">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-jl-muted-fg">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-jl-fg">{application.notes}</p>
                </div>
              )}
              {application.follow_up_date && (
                <p className="text-xs text-jl-muted-fg">Follow up on {formatDate(application.follow_up_date)}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}