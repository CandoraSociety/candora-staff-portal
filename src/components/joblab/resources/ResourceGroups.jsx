import ResourceCard from '@/components/joblab/resources/ResourceCard';

// Renders a section's (or industry track's) groups of links, each under its own
// heading so a long list stays scannable.
export default function ResourceGroups({ groups }) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.title}>
          <h3 className="text-sm font-semibold text-jl-fg">{group.title}</h3>
          {group.note && <p className="mt-0.5 text-xs text-jl-muted-fg">{group.note}</p>}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <ResourceCard key={`${group.title}-${item.title}`} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}