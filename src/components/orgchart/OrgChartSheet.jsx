import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, User, UserX, Pencil, Trash2, GripVertical, Network, Rows3 } from "lucide-react";
import OrgTreeLayout from "./OrgTreeLayout";
import { Badge } from "@/components/ui/badge";
import OrgChartPositionForm, { EMPTY_POS } from "./OrgChartPositionForm";
import PayrollSummary from "./PayrollSummary";
const nanoid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const TIER_ORDER = [
  "executive",
  "director",
  "senior_manager",
  "manager",
  "supervisor_team_lead",
  "specialist",
  "frontline",
  "assistant",
  "practicum_placement",
];

const TIER_LABELS = {
  executive: "Executive",
  director: "Director",
  senior_manager: "Senior Manager",
  manager: "Manager",
  supervisor_team_lead: "Supervisor / Team Lead",
  specialist: "Specialist",
  frontline: "Frontline",
  assistant: "Assistant",
  practicum_placement: "Practicum Placement",
};

function PositionCard({ position, originalPositions, onEdit, onDelete, showSalary, showNames, isScenario, draggingId, onDragStart, onDragOver, onDrop }) {
  let isChanged = false;
  if (isScenario && originalPositions.length > 0) {
    const orig = originalPositions.find(o => o.id === (position.original_id || position.id));
    if (!orig) isChanged = true;
    else isChanged = (
      orig.title !== position.title ||
      orig.person_name !== position.person_name ||
      orig.salary !== position.salary ||
      orig.reports_to_id !== position.reports_to_id
    );
  }

  const isDragging = draggingId === position.id;
  const isDropTarget = draggingId && draggingId !== position.id;

  let borderClass = "border-border bg-card shadow-sm";
  if (position.is_vacant) borderClass = "border-dashed border-muted-foreground/40 bg-muted/20";
  else if (isScenario && isChanged) borderClass = "border-orange-400 bg-orange-50/50";
  else if (isScenario && !isChanged) borderClass = "border-blue-300 bg-card shadow-sm";

  return (
    <div
      className={`group relative p-3 rounded-xl border-2 min-w-[140px] max-w-[180px] text-center transition-all ${borderClass} ${isDragging ? "opacity-40 scale-95" : ""} ${isDropTarget ? "hover:border-primary hover:shadow-md cursor-pointer" : ""}`}
      draggable={isScenario}
      onDragStart={isScenario ? (e) => { e.dataTransfer.effectAllowed = "move"; onDragStart?.(position.id); } : undefined}
      onDragOver={isScenario ? (e) => { e.preventDefault(); onDragOver?.(position.id); } : undefined}
      onDrop={isScenario ? (e) => { e.preventDefault(); onDrop?.(position.id); } : undefined}
    >
      {isScenario && <GripVertical className="w-3 h-3 text-muted-foreground/30 absolute top-1 left-1 cursor-grab" />}
      <div className="flex justify-center mb-1">
        {position.is_vacant ? <UserX className="w-6 h-6 text-muted-foreground/50" /> : <User className="w-6 h-6 text-accent" />}
      </div>
      <p className="text-xs font-semibold leading-tight">{position.title}</p>
      {showNames && position.person_name && <p className="text-xs text-muted-foreground">{position.person_name}</p>}
      {position.department && <p className="text-xs text-muted-foreground/70">{position.department}</p>}
      {position.is_vacant && <Badge variant="outline" className="text-xs mt-1">Vacant</Badge>}
      {showSalary && position.salary > 0 && <p className="text-xs text-muted-foreground mt-0.5">${position.salary.toLocaleString()}/yr</p>}
      {showSalary && position.hourly_rate > 0 && <p className="text-xs text-muted-foreground mt-0.5">${position.hourly_rate}/hr</p>}
      {isScenario && isChanged && <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-orange-400 border-2 border-white" title="Modified" />}
      <div className="absolute -top-2 -right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button className="w-5 h-5 bg-background border rounded-full flex items-center justify-center shadow-sm" onClick={() => onEdit(position)}>
            <Pencil className="w-2.5 h-2.5" />
          </button>
        )}
        {onDelete && (
          <button className="w-5 h-5 bg-background border rounded-full flex items-center justify-center shadow-sm" onClick={() => onDelete(position.id)}>
            <Trash2 className="w-2.5 h-2.5 text-destructive" />
          </button>
        )}
      </div>
    </div>
  );
}

// isOriginal=true => edits go to DB via onSavePosition / onDeletePosition
// isOriginal=false => edits are local state stored in scenario positions array, saved via onScenarioChange
export default function OrgChartSheet({
  positions, // canonical DB positions (always passed for original reference)
  scenarioPositions, // only set for scenario sheets
  onScenarioChange, // (newPositions) => void
  isOriginal,
  onSavePosition, // (form, editId) => void — canonical
  onDeletePosition, // (id) => void — canonical
  showSalary, showNames,
  originalPositions, // canonical positions for change-highlighting
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_POS);
  const [editId, setEditId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [layout, setLayout] = useState("tree"); // "tree" | "tiers"

  const working = isOriginal ? positions : (scenarioPositions || []);

  const openAdd = () => { setForm(EMPTY_POS); setEditId(null); setFormOpen(true); };
  const openEdit = (p) => { 
    setForm({ 
      ...p, 
      salary: p.salary || "", 
      hourly_rate: p.hourly_rate || "",
      hours_per_week: p.hours_per_week || "",
      weeks_per_year: p.weeks_per_year || "",
      has_summer_hours: p.has_summer_hours || false,
      summer_hours_per_week: p.summer_hours_per_week || "",
      summer_weeks: p.summer_weeks || ""
    }); 
    setEditId(p.id); 
    setFormOpen(true); 
  };

  const handleSave = (overrideForm) => {
    const merged = overrideForm || form;
    if (!merged.title?.trim()) return;
    const data = { 
      ...merged, 
      salary: parseFloat(merged.salary) || 0,
      hourly_rate: parseFloat(merged.hourly_rate) || 0,
      hours_per_week: parseFloat(merged.hours_per_week) || 0,
      weeks_per_year: parseFloat(merged.weeks_per_year) || 0,
      has_summer_hours: merged.has_summer_hours || false,
      summer_hours_per_week: parseFloat(merged.summer_hours_per_week) || 0,
      summer_weeks: parseFloat(merged.summer_weeks) || 0,
    };
    if (isOriginal) {
      onSavePosition(data, editId);
    } else {
      let next;
      if (editId) {
        next = working.map(p => p.id === editId ? { ...p, ...data } : p);
      } else {
        const newPos = { ...data, id: nanoid(), original_id: null };
        next = [...working, newPos];
      }
      onScenarioChange(next);
    }
    setFormOpen(false); setForm(EMPTY_POS); setEditId(null);

  };

  const handleDelete = (id) => {
    if (isOriginal) {
      onDeletePosition(id);
    } else {
      onScenarioChange(working.filter(p => p.id !== id));
    }
  };

  // Drag-to-reparent: drop dragging node onto target → dragging becomes child of target
  const handleDrop = useCallback((targetId) => {
    if (!draggingId || draggingId === targetId || isOriginal) return;
    // Check target is not a descendant of dragging (prevent cycles)
    const isDescendant = (checkId, ancestorId) => {
      const pos = working.find(p => p.id === checkId);
      if (!pos) return false;
      if (pos.reports_to_id === ancestorId) return true;
      return pos.reports_to_id ? isDescendant(pos.reports_to_id, ancestorId) : false;
    };
    if (isDescendant(targetId, draggingId)) return;
    const next = working.map(p => p.id === draggingId ? { ...p, reports_to_id: targetId } : p);
    onScenarioChange(next);
    setDraggingId(null);
    setDragOverId(null);
  }, [draggingId, working, isOriginal, onScenarioChange]);

  const handleDropToRoot = (e) => {
    e.preventDefault();
    if (!draggingId || isOriginal) return;
    const next = working.map(p => p.id === draggingId ? { ...p, reports_to_id: "" } : p);
    onScenarioChange(next);
    setDraggingId(null);
  };

  // Build tier rows — positions grouped by tier, in tier rank order
  const tieredRows = (() => {
    const grouped = {};
    working.forEach(p => {
      const tier = p.tier || "__none__";
      if (!grouped[tier]) grouped[tier] = [];
      grouped[tier].push(p);
    });
    const rows = [];
    TIER_ORDER.forEach(tier => {
      if (grouped[tier]?.length) rows.push({ tier, label: TIER_LABELS[tier], positions: grouped[tier] });
    });
    if (grouped["__none__"]?.length) rows.push({ tier: "__none__", label: "Unassigned", positions: grouped["__none__"] });
    return rows;
  })();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 flex-wrap gap-2">
        <PayrollSummary positions={working} showSalary={showSalary} />
        <div className="flex items-center gap-2">
          {/* Layout toggle */}
          <div className="flex rounded-md border overflow-hidden">
            <button
              onClick={() => setLayout("tree")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs transition-colors ${layout === "tree" ? "bg-accent text-accent-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
              title="Tree view — shows reporting hierarchy"
            >
              <Network className="w-3.5 h-3.5" /> Tree
            </button>
            <button
              onClick={() => setLayout("tiers")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs transition-colors border-l ${layout === "tiers" ? "bg-accent text-accent-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
              title="Tier view — groups by seniority level"
            >
              <Rows3 className="w-3.5 h-3.5" /> Tiers
            </button>
          </div>
          <Button size="sm" variant="outline" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" /> Add Position
          </Button>
        </div>
      </div>

      <div
        className="flex-1 overflow-auto pb-6"
        onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
      >
        {working.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No positions yet. Add one to get started.</p>
        )}

        {/* Tree layout */}
        {layout === "tree" && (
          <OrgTreeLayout
            positions={working}
            originalPositions={originalPositions}
            isScenario={!isOriginal}
            showSalary={showSalary}
            showNames={showNames}
            onEdit={openEdit}
            onDelete={handleDelete}
            draggingId={draggingId}
            onDragStart={setDraggingId}
            onDragOver={setDragOverId}
            onDrop={handleDrop}
            onDropToRoot={handleDropToRoot}
          />
        )}

        {/* Tiers layout */}
        {layout === "tiers" && (
          <div className="min-w-max">
            {tieredRows.map(({ tier, label, positions: rowPositions }, rowIdx) => (
              <div key={tier} className={`flex items-center border-b last:border-b-0 ${rowIdx % 2 === 0 ? "bg-muted/20" : "bg-background"}`}>
                <div className="w-36 shrink-0 px-3 py-4 border-r">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide leading-tight">{label}</p>
                </div>
                <div className="flex flex-wrap gap-3 px-4 py-4 items-center">
                  {rowPositions.map(p => (
                    <PositionCard
                      key={p.id}
                      position={p}
                      originalPositions={originalPositions}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      showSalary={showSalary}
                      showNames={showNames}
                      isScenario={!isOriginal}
                      draggingId={draggingId}
                      onDragStart={setDraggingId}
                      onDragOver={setDragOverId}
                      onDrop={handleDrop}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <OrgChartPositionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        editId={editId}
        positions={working}
      />
    </div>
  );
}