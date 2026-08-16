import CollapsibleSection from './CollapsibleSection';
import { WD_SUBSECTIONS, groupClientsBySubSection } from '@/lib/clientClassification';

// Service Navigation only applies to WD (Pathways) clients — DEA clients have no
// service navigator. This component renders a single "Service Navigation WD Clients"
// grouping with the WD sub-sections, without the DEA/Casual/Rejected noise.
export default function ServiceNavigationSections({ clients, renderTable, activeSearch = '' }) {
  const wdClients = clients.filter(c => c.service_type === 'pathways');
  const wdGroups = groupClientsBySubSection(wdClients, 'wd');
  const forceOpen = !!activeSearch && activeSearch.trim().length > 0;

  return (
    <div className="space-y-3">
      <CollapsibleSection
        title="Service Navigation WD Clients"
        count={wdClients.length}
        accentColor="#92760c"
        variant="main"
        defaultOpen={wdClients.length > 0}
        forceOpen={forceOpen}
      >
        <div className="space-y-2">
          {WD_SUBSECTIONS.map(sub => (
            <CollapsibleSection
              key={sub.key}
              title={sub.label}
              count={wdGroups[sub.key]?.length || 0}
              accentColor="#92760c"
              forceOpen={forceOpen}
            >
              {renderTable(wdGroups[sub.key] || [], 'wd', sub.key)}
            </CollapsibleSection>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}