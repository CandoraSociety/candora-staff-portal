import { useState } from 'react';
import { MapPin, Banknote, Clock, ChevronDown, ExternalLink, Mail, Check, Plus } from 'lucide-react';
import { JLBadge, JLButton } from '@/components/joblab/ui';
import { EMPLOYMENT_TYPE_LABELS, formatDate } from '@/lib/joblab/constants';

export default function LocalJobCard({ job, saved, saving, onSave }) {
  const [open, setOpen] = useState(false);
  const requirements = (job.requirements || []).filter(Boolean);

  return (
    <div className="rounded-xl border border-jl-border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="jl-heading text-base font-semibold text-jl-fg">{job.title}</p>
          <p className="text-sm text-jl-muted-fg">{job.employer_name}</p>
        </div>
        <JLBadge className="bg-jl-navy/10 text-jl-navy">
          {EMPLOYMENT_TYPE_LABELS[job.employment_type] || 'Full-time'}
        </JLBadge>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-jl-muted-fg">
        {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
        {job.wage && <span className="flex items-center gap-1"><Banknote className="h-3 w-3" />{job.wage}</span>}
        {job.hours && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.hours}</span>}
        {job.closing_date && <span>Closes {formatDate(job.closing_date)}</span>}
      </div>

      {job.description && (
        <p className={`mt-2.5 text-sm leading-relaxed text-jl-fg/80 ${open ? '' : 'line-clamp-2'}`}>
          {job.description}
        </p>
      )}

      {open && (
        <div className="mt-3 space-y-3 border-t border-jl-border pt-3">
          {requirements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-jl-fg">What they're looking for</p>
              <ul className="mt-1 space-y-0.5">
                {requirements.map((item) => (
                  <li key={item} className="text-xs leading-relaxed text-jl-muted-fg">• {item}</li>
                ))}
              </ul>
            </div>
          )}
          {job.how_to_apply && (
            <div>
              <p className="text-xs font-semibold text-jl-fg">How to apply</p>
              <p className="mt-0.5 text-xs leading-relaxed text-jl-muted-fg">{job.how_to_apply}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-xs">
            {job.contact_email && (
              <a href={`mailto:${job.contact_email}`} className="flex items-center gap-1 font-semibold text-jl-primary">
                <Mail className="h-3.5 w-3.5" /> {job.contact_email}
              </a>
            )}
            {job.contact_phone && <span className="text-jl-muted-fg">{job.contact_phone}</span>}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <JLButton size="sm" variant={saved ? 'outline' : 'primary'} onClick={onSave} disabled={saved || saving}>
          {saved ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {saved ? 'Saved to tracker' : saving ? 'Saving…' : 'Save to tracker'}
        </JLButton>
        {job.apply_url && (
          <JLButton size="sm" variant="ghost" onClick={() => window.open(job.apply_url, '_blank', 'noopener')}>
            <ExternalLink className="h-3.5 w-3.5" /> Apply online
          </JLButton>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto flex items-center gap-1 text-xs font-semibold text-jl-primary"
        >
          {open ? 'Show less' : 'More details'}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}