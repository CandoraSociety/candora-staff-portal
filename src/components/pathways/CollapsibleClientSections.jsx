import CollapsibleSection from './CollapsibleSection';
import { DEA_SUBSECTIONS, WD_SUBSECTIONS, groupClientsBySubSection } from '@/lib/clientClassification';

export default function CollapsibleClientSections({ clients, renderTable }) {
  const deaClients = clients.filter(c => c.service_type === 'direct_to_employment');
  const wdClients = clients.filter(c => c.service_type === 'pathways');
  const deaGroups = groupClientsBySubSection(deaClients, 'dea');
  const wdGroups = groupClientsBySubSection(wdClients, 'wd');

  return (
    <div className="space-y-3">
      <CollapsibleSection title="DEA" count={deaClients.length} accentColor="#232964" variant="main" defaultOpen={deaClients.length > 0}>
        <div className="space-y-2">
          {DEA_SUBSECTIONS.map(sub => (
            <CollapsibleSection key={sub.key} title={sub.label} count={deaGroups[sub.key]?.length || 0} accentColor="#232964">
              {renderTable(deaGroups[sub.key] || [], 'dea', sub.key)}
            </CollapsibleSection>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="WD" count={wdClients.length} accentColor="#92760c" variant="main" defaultOpen={wdClients.length > 0}>
        <div className="space-y-2">
          {WD_SUBSECTIONS.map(sub => (
            <CollapsibleSection key={sub.key} title={sub.label} count={wdGroups[sub.key]?.length || 0} accentColor="#92760c">
              {renderTable(wdGroups[sub.key] || [], 'wd', sub.key)}
            </CollapsibleSection>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}