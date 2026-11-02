import { ChevronRight, ExternalLink } from 'lucide-react';
import { JLBadge, JLCard } from '@/components/joblab/ui';

// One external link on the Learn tab. Every card opens in a new tab.
export default function ResourceCard({ item }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block h-full">
      <JLCard className="flex h-full items-start gap-3 p-4 transition-shadow hover:shadow-md">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-jl-primary/10">
          <ExternalLink className="h-4 w-4 text-jl-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-jl-fg">{item.title}</p>
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jl-muted-fg" />
          </div>
          <p className="mt-0.5 text-xs text-jl-muted-fg">{item.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {item.entryLevel && (
              <JLBadge className="bg-jl-gold/25 text-jl-navy">Entry level</JLBadge>
            )}
            {item.tag && (
              <JLBadge className="bg-jl-secondary text-jl-muted-fg">{item.tag}</JLBadge>
            )}
          </div>
        </div>
      </JLCard>
    </a>
  );
}