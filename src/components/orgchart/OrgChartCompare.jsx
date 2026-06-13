import PayrollSummary from "./PayrollSummary";
import { X, User, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TIER_ORDER = [
  "executive", "director", "senior_manager", "manager",
  "supervisor_team_lead", "specialist", "frontline", "assistant", "practicum_placement",
];
const TIER_LABELS = {
  executive: "Executive", director: "Director", senior_manager: "Senior Manager",
  manager: "Manager", supervisor_team_lead: "Supervisor / Team Lead",
  specialist: "Specialist", frontline: "Frontline", assistant: "Assistant",
  practicum_placement: "Practicum Placement",
};

function MiniCard({ position, showSalary, showNames, originalPositions, isScenario }) {
  let isChanged = false;
  let wageIncreased = false;
  let origSalary = 0;
  if (isScenario && originalPositions?.length > 0) {
    const orig = originalPositions.find(o => o.id === position.id);
    if (!orig) isChanged = true;
    else {
      origSalary = orig.salary || 0;
      isChanged = orig.title !== position.title || orig.person_name !== position.person_name || orig.salary !== position.salary;
      wageIncreased = (position.salary || 0) > (orig.salary || 0);
    }
  }
  let borderClass = "border-border bg-card";
  if (position.is_vacant) borderClass = "border-dashed border-muted-foreground/40 bg-muted/20";
  else if (isScenario && isChanged) borderClass = "border-orange-400 bg-orange-50/50";
  return (
    <div className={`relative p-2 rounded-lg border-2 min-w-[120px] max-w-[160px] text-center ${borderClass}`}>
      {isScenario && isChanged && <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-orange-400 border-2 border-white" />}
      <div className="flex justify-center mb-0.5">
        {position.is_vacant ? <UserX className="w-4 h-4 text-muted-foreground/50" /> : <User className="w-4 h-4 text-accent" />}
      </div>
      <p className="text-xs font-semibold leading-tight">{position.title}</p>
      {showNames && position.person_name && <p className="text-[10px] text-muted-foreground">{position.person_name}</p>}
      {position.is_vacant && <Badge variant="outline" className="text-[10px] mt-0.5">Vacant</Badge>}
      {showSalary && position.salary > 0 && (
        <p className={`text-[10px] mt-0.5 ${wageIncreased ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
          ${position.salary.toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default function OrgChartCompare({ sheets, onClose, showSalary, showNames, originalPositions }) {
  // Collect all tiers present across all sheets
  const allTiersPresent = new Set();
  sheets.forEach(s => s.positions.forEach(p => allTiersPresent.add(p.tier || "__none__")));
  const rows = [...TIER_ORDER.filter(t => allTiersPresent.has(t))];
  if (allTiersPresent.has("__none__")) rows.push("__none__");

  // Calculate totals for each sheet
  const sheetTotals = sheets.map(s => {
    const annual = s.positions.reduce((sum, p) => {
      if (p.hourly_rate && p.hours_per_week && p.weeks_per_year) {
        return sum + (parseFloat(p.hourly_rate) * parseFloat(p.hours_per_week) * parseFloat(p.weeks_per_year));
      }
      return sum + (p.salary || 0);
    }, 0);
    return {
      positions: s.positions.length,
      filled: s.positions.filter(p => !p.is_vacant).length,
      vacant: s.positions.filter(p => p.is_vacant).length,
      annual,
      monthly: annual / 12,
      biweekly: annual / 26,
    };
  });

  // Calculate differences (vs first sheet)
  const base = sheetTotals[0];
  const fmt = (n) => "$" + Math.round(n).toLocaleString();
  const fmtDiff = (n) => (n >= 0 ? "+" : "") + Math.round(n).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card shadow-sm">
        <h2 className="font-bold text-lg">Compare Scenarios</h2>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-muted/40 border-b">
              <th className="w-36 px-3 py-2 text-left text-xs font-semibold text-muted-foreground border-r">Tier</th>
              {sheets.map((s, i) => {
                const total = sheetTotals[i];
                const diffPositions = i > 0 ? total.positions - base.positions : 0;
                const diffAnnual = i > 0 ? total.annual - base.annual : 0;
                return (
                  <th key={i} className="px-4 py-2 text-left border-r last:border-r-0">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <PayrollSummary positions={s.positions} showSalary={showSalary} />
                    {i > 0 && (
                      <div className="mt-1 text-xs space-y-0.5">
                        <p className={diffPositions !== 0 ? "font-semibold text-red-600 italic" : "text-muted-foreground"}>
                          Δ Positions: {fmtDiff(diffPositions)}
                        </p>
                        <p className={diffAnnual !== 0 ? "font-semibold text-red-600 italic" : "text-muted-foreground"}>
                          Δ Annual: {fmtDiff(diffAnnual)}
                        </p>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((tier, rowIdx) => (
              <tr key={tier} className={`border-b ${rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                <td className="px-3 py-4 border-r align-top">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {tier === "__none__" ? "Unassigned" : TIER_LABELS[tier]}
                  </p>
                </td>
                {sheets.map((sheet, si) => {
                  const positions = sheet.positions.filter(p => (p.tier || "__none__") === tier);
                  return (
                    <td key={si} className="px-4 py-4 border-r last:border-r-0 align-top">
                      <div className="flex flex-wrap gap-2">
                        {positions.map(p => (
                          <MiniCard
                            key={p.id}
                            position={p}
                            showSalary={showSalary}
                            showNames={showNames}
                            originalPositions={originalPositions}
                            isScenario={sheet.isScenario}
                          />
                        ))}
                        {positions.length === 0 && <span className="text-xs text-muted-foreground/40 italic">—</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}