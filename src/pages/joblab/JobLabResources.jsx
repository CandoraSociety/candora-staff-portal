import { useState } from 'react';
import { RESOURCE_SECTIONS } from '@/lib/joblab/resources';
import { JLBadge, JLCard, JLTabs } from '@/components/joblab/ui';
import ResourceGroups from '@/components/joblab/resources/ResourceGroups';
import IndustryPicker from '@/components/joblab/resources/IndustryPicker';

export default function JobLabResources() {
  const [tab, setTab] = useState(RESOURCE_SECTIONS[0].value);
  const [industry, setIndustry] = useState(RESOURCE_SECTIONS[1].industries[0].value);

  const active = RESOURCE_SECTIONS.find((item) => item.value === tab) || RESOURCE_SECTIONS[0];
  const track = active.industries?.find((item) => item.value === industry) || active.industries?.[0];

  return (
    <div>
      <div className="mb-5">
        <h1 className="jl-heading text-2xl font-bold text-jl-fg sm:text-3xl">Resources &amp; Training</h1>
        <p className="mt-1 text-sm text-jl-muted-fg">
          Free courses, certificates and guides — including by industry. Nothing here costs money to use, and
          where a certificate has a fee, the card says so.
        </p>
      </div>

      <JLTabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={RESOURCE_SECTIONS.map(({ value, label }) => ({ value, label }))}
      />

      <p className="mb-4 text-xs text-jl-muted-fg">{active.blurb}</p>

      {track ? (
        <div className="space-y-5">
          <IndustryPicker
            tracks={active.industries}
            value={track.value}
            onChange={setIndustry}
          />

          <JLCard className="p-4">
            <h2 className="jl-heading text-base font-semibold text-jl-fg">{track.label}</h2>
            <p className="mt-1 text-xs text-jl-muted-fg">{track.blurb}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-jl-muted-fg">
                Entry-level roles
              </span>
              {track.entryRoles.map((role) => (
                <JLBadge key={role} className="bg-jl-secondary text-jl-fg">
                  {role}
                </JLBadge>
              ))}
            </div>
          </JLCard>

          <ResourceGroups groups={track.groups} />
        </div>
      ) : (
        <ResourceGroups groups={active.groups} />
      )}
    </div>
  );
}