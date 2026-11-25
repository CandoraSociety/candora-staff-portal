import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonClass =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all';

// The donation portal's two tabs. "Campaigns" opens a list of every campaign
// still accepting gifts when hovered, so a supporter can jump straight to the
// appeal they care about — the list comes from the live campaign feed, so a new
// campaign appears on its own and a finished one drops away.
export default function DonationTabBar({ tab, onChange, campaigns, activeSlug, onSelectCampaign }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground">
      <div
        className="relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button
          type="button"
          onClick={() => onChange('campaigns')}
          onFocus={() => setOpen(true)}
          className={cn(buttonClass, tab === 'campaigns' && 'bg-background text-foreground shadow')}
          aria-haspopup="true"
          aria-expanded={open}
        >
          Campaigns
          {campaigns.length > 0 && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
        </button>

        {open && campaigns.length > 0 && (
          <div className="absolute left-0 top-full z-50 pt-1">
            <div
              className="w-64 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
              onMouseLeave={() => setOpen(false)}
            >
              {campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => {
                    onSelectCampaign(campaign.slug);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <span className="truncate">{campaign.name}</span>
                  {campaign.slug === activeSlug && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange('give')}
        className={cn(buttonClass, tab === 'give' && 'bg-background text-foreground shadow')}
      >
        General Donations
      </button>
    </div>
  );
}