import { useState } from 'react';
import { ExternalLink, ChevronRight } from 'lucide-react';
import { RESOURCE_TABS } from '@/lib/joblab/resources';
import { JLBadge, JLCard, JLTabs } from '@/components/joblab/ui';

export default function JobLabResources() {
  const [tab, setTab] = useState(RESOURCE_TABS[0].value);
  const active = RESOURCE_TABS.find((item) => item.value === tab) || RESOURCE_TABS[0];

  return (
    <div>
      <div className="mb-5">
        <h1 className="jl-heading text-2xl font-bold text-jl-fg sm:text-3xl">Resources &amp; Training</h1>
        <p className="mt-1 text-sm text-jl-muted-fg">Everything you need to succeed in your job search</p>
      </div>

      <JLTabs className="mb-4" value={tab} onChange={setTab} tabs={RESOURCE_TABS.map(({ value, label }) => ({ value, label }))} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {active.items.map((item) => (
          <a key={item.title} href={item.url} target="_blank" rel="noopener noreferrer">
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
                {item.tag && (
                  <JLBadge className="mt-1.5 bg-jl-secondary text-jl-muted-fg">{item.tag}</JLBadge>
                )}
              </div>
            </JLCard>
          </a>
        ))}
      </div>
    </div>
  );
}