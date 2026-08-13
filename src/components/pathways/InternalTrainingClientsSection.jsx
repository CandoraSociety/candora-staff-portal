import CollapsibleSection from './CollapsibleSection';
import { WD_SUBSECTIONS, classifyClient } from '@/lib/clientClassification';

// "Internal Training Clients" list for Internal Placement Coordinators (and Managers).
// Uses the same category breakdown as the other My-Dashboard client lists
// (Active, Work Search, Follow-up, Completed, Incomplete/Cancelled, Not Started).
// Clients are split by service type so each table keeps its correct program columns.
export default function InternalTrainingClientsSection({ clients, renderTable }) {
  const groups = {};
  for (const sub of WD_SUBSECTIONS) groups[sub.key] = { dea: [], wd: [], other: [] };
  for (const c of clients) {
    const key = classifyClient(c);
    if (!groups[key]) continue;
    if (c.service_type === 'direct_to_employment') groups[key].dea.push(c);
    else if (c.service_type === 'pathways') groups[key].wd.push(c);
    else groups[key].other.push(c);
  }

  return (
    <CollapsibleSection
      title="Internal Training Clients"
      count={clients.length}
      accentColor="#7c3aed"
      variant="main"
      defaultOpen
    >
      <div className="space-y-2">
        {WD_SUBSECTIONS.map(sub => {
          const g = groups[sub.key];
          const count = g.dea.length + g.wd.length + g.other.length;
          if (count === 0) return null;
          return (
            <CollapsibleSection key={sub.key} title={sub.label} count={count} accentColor="#7c3aed">
              <div className="space-y-2">
                {g.dea.length > 0 && renderTable(g.dea, 'dea', sub.key)}
                {g.wd.length > 0 && renderTable(g.wd, 'wd', sub.key)}
                {g.other.length > 0 && renderTable(g.other, 'casual', 'all')}
              </div>
            </CollapsibleSection>
          );
        })}
        {clients.length === 0 && (
          <p className="text-sm text-slate-400 italic px-4 py-3">No internal training clients assigned to you.</p>
        )}
      </div>
    </CollapsibleSection>
  );
}