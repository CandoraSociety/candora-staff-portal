import OrgNode from "./OrgNode";
import PayrollSummary from "./PayrollSummary";
import { X } from "lucide-react";

export default function OrgChartCompare({ sheets, onClose, showSalary, showNames, originalPositions }) {
  // sheets: [{ name, positions }]
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card shadow-sm">
        <h2 className="font-bold text-lg">Compare Scenarios</h2>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden divide-x">
        {sheets.map((sheet, i) => {
          const roots = sheet.positions.filter(p => !p.reports_to_id || !sheet.positions.find(x => x.id === p.reports_to_id));
          return (
            <div key={i} className="flex-1 flex flex-col overflow-hidden min-w-0">
              <div className="px-4 py-2 bg-muted/40 border-b">
                <p className="font-semibold text-sm truncate">{sheet.name}</p>
                <PayrollSummary positions={sheet.positions} showSalary={showSalary} />
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div className="flex gap-10 justify-center min-w-max">
                  {roots.map(r => (
                    <OrgNode
                      key={r.id}
                      position={r}
                      all={sheet.positions}
                      originalPositions={originalPositions}
                      showSalary={showSalary}
                      showNames={showNames}
                      isScenario={sheet.isScenario}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}