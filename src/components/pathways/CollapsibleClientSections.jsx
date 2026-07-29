import CollapsibleSection from './CollapsibleSection';
import { DEA_SUBSECTIONS, WD_SUBSECTIONS, groupClientsBySubSection } from '@/lib/clientClassification';

export default function CollapsibleClientSections({ clients, renderTable, alwaysShowExtras = false }) {
  const deaClients = clients.filter(c => c.service_type === 'direct_to_employment');
  const wdClients = clients.filter(c => c.service_type === 'pathways');
  const casualClients = clients.filter(c => c.service_type === 'casual');
  const rejectedClients = clients.filter(c => c.service_type === 'not_eligible');
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

      {(alwaysShowExtras || casualClients.length > 0) && (
        <CollapsibleSection title="Casual Clients" count={casualClients.length} accentColor="#6b7280" variant="main" defaultOpen={casualClients.length > 0}>
          {casualClients.length > 0
            ? renderTable(casualClients, 'casual', 'all')
            : <p className="text-sm text-slate-400 italic px-4 py-3">No casual clients.</p>}
        </CollapsibleSection>
      )}

      {(alwaysShowExtras || rejectedClients.length > 0) && (
        <CollapsibleSection title="Rejected" count={rejectedClients.length} accentColor="#b91c1c" variant="main" defaultOpen={rejectedClients.length > 0}>
          {rejectedClients.length > 0
            ? renderTable(rejectedClients, 'rejected', 'all')
            : <p className="text-sm text-slate-400 italic px-4 py-3">No rejected clients.</p>}
        </CollapsibleSection>
      )}
    </div>
  );
}