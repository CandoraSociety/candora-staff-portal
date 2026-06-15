import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Minus, Pencil, UserX } from "lucide-react";

function calcSalary(p) {
  return p.salary || 0;
}

const fmt = (n) => "$" + Math.round(n).toLocaleString();

export default function ScenarioChangelog({ scenarioPositions, originalPositions, removedPositions = [] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "added" | "removed" | "modified"

  const changes = useMemo(() => {
    const result = [];

    // Positions added (no original_id or original_id not found in originals)
    scenarioPositions.forEach(p => {
      const origId = p.original_id || p.id;
      // Match by ID first, then fall back to title+person_name (handles recreated canonical positions)
      const orig = originalPositions.find(o => o.id === origId)
        || originalPositions.find(o => o.title === p.title && (o.person_name || "") === (p.person_name || ""));
      if (!orig) {
        result.push({ type: "added", position: p });
        return;
      }
      // Modified
      const diffs = [];
      if (orig.title !== p.title) diffs.push({ field: "Title", from: orig.title, to: p.title });
      if (orig.person_name !== p.person_name) diffs.push({ field: "Person", from: orig.person_name || "—", to: p.person_name || "—" });
      if (orig.tier !== p.tier) diffs.push({ field: "Tier", from: orig.tier || "—", to: p.tier || "—" });
      if (orig.department !== p.department) diffs.push({ field: "Department", from: orig.department || "—", to: p.department || "—" });
      if (orig.reports_to_id !== p.reports_to_id) {
        const fromMgr = originalPositions.find(o => o.id === orig.reports_to_id);
        const toMgr = scenarioPositions.find(s => s.id === p.reports_to_id) || originalPositions.find(o => o.id === p.reports_to_id);
        diffs.push({ field: "Reports to", from: fromMgr?.title || "(none)", to: toMgr?.title || "(none)" });
      }
      const origSal = orig.salary || 0;
      const newSal = p.salary || 0;
      if (Math.abs(origSal - newSal) > 1) {
        diffs.push({ field: "Annual Wage", from: fmt(origSal), to: fmt(newSal), delta: newSal - origSal });
      }
      // Also flag hourly rate / hours changes even if annual salary is same (rounding can mask them)
      if ((orig.hourly_rate || 0) !== (p.hourly_rate || 0)) {
        diffs.push({ field: "Hourly Rate", from: `$${orig.hourly_rate || 0}/hr`, to: `$${p.hourly_rate || 0}/hr` });
      }
      if ((orig.hours_per_week || 0) !== (p.hours_per_week || 0)) {
        diffs.push({ field: "Hours/Week", from: `${orig.hours_per_week || 0}h`, to: `${p.hours_per_week || 0}h` });
      }
      if ((orig.weeks_per_year || 0) !== (p.weeks_per_year || 0)) {
        diffs.push({ field: "Weeks/Year", from: `${orig.weeks_per_year || 0}wks`, to: `${p.weeks_per_year || 0}wks` });
      }
      if (diffs.length > 0) result.push({ type: "modified", position: p, orig, diffs });
    });

    // Positions removed
    removedPositions.forEach(p => {
      result.push({ type: "removed", position: p });
    });

    return result;
  }, [scenarioPositions, originalPositions, removedPositions]);

  if (changes.length === 0) return (
    <div className="border-t mx-4 mb-4 pt-3">
      <p className="text-xs text-muted-foreground italic">No changes from original.</p>
    </div>
  );

  return (
    <div className="border-t mx-4 mb-4 pt-3">
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
        >
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Changes from Original ({changes.length})
        </button>
        {open && (
          <div className="flex items-center gap-1">
            {[
              { key: "all", label: "All" },
              { key: "added", label: `Added (${changes.filter(c => c.type === "added").length})` },
              { key: "removed", label: `Removed (${changes.filter(c => c.type === "removed").length})` },
              { key: "modified", label: `Modified (${changes.filter(c => c.type === "modified").length})` },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-2 py-0.5 rounded text-xs border transition-colors ${filter === f.key ? "bg-accent text-accent-foreground border-accent" : "bg-background text-muted-foreground border-border hover:bg-muted"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {changes.filter(c => filter === "all" || c.type === filter).map((c, i) => (
            <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm border ${
              c.type === "added" ? "bg-blue-50 border-blue-200" :
              c.type === "removed" ? "bg-red-50 border-red-200" :
              "bg-amber-50 border-amber-200"
            }`}>
              {c.type === "added" && <Plus className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />}
              {c.type === "removed" && <Minus className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />}
              {c.type === "modified" && <Pencil className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />}

              <div className="flex-1 min-w-0">
                <p className={`font-semibold leading-tight ${
                  c.type === "added" ? "text-blue-800" :
                  c.type === "removed" ? "text-red-800" :
                  "text-amber-800"
                }`}>
                  {c.type === "added" && "Added: "}
                  {c.type === "removed" && "Removed: "}
                  {c.position.title}
                  {c.position.person_name ? ` (${c.position.person_name})` : ""}
                  {c.position.is_vacant ? " · Vacant" : ""}
                </p>
                {c.type === "modified" && c.diffs.map((d, j) => (
                  <p key={j} className="text-xs text-amber-700 mt-0.5">
                    <span className="font-medium">{d.field}:</span>{" "}
                    <span className="line-through opacity-60">{d.from}</span>
                    {" → "}
                    <span className="font-medium">{d.to}</span>
                    {d.delta != null && (
                      <span className={`ml-1 font-semibold ${d.delta > 0 ? "text-green-700" : "text-red-700"}`}>
                        ({d.delta > 0 ? "▲ +" : "▼ "}{fmt(Math.abs(d.delta))})
                      </span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          ))}
          {changes.filter(c => filter === "all" || c.type === filter).length === 0 && (
            <p className="text-xs text-muted-foreground italic py-2">No {filter} changes.</p>
          )}
        </div>
      )}
    </div>
  );
}