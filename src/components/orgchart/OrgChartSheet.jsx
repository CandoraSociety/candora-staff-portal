import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, User, UserX, Pencil, Trash2, GripVertical, Network, Rows3, RotateCcw, Undo2, Redo2, ChevronDown, ChevronUp } from "lucide-react";
import OrgTreeLayout from "./OrgTreeLayout";
import { Badge } from "@/components/ui/badge";
import OrgChartPositionForm, { EMPTY_POS } from "./OrgChartPositionForm";
import PayrollSummary from "./PayrollSummary";
import ScenarioChangelog from "./ScenarioChangelog";
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
    const origId = position.original_id || position.id;
    const orig = originalPositions.find(o => o.id === origId)
      || originalPositions.find(o => o.title === position.title && (o.person_name || "") === (position.person_name || ""));
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
  initialRemovedPositions, // pre-seeded removed positions (retroactive + persisted)
  onScenarioChange, // (newPositions, newRemovedPositions?) => void
  isOriginal,
  onSavePosition, // (form, editId) => void — canonical
  onDeletePosition, // (id) => void — canonical
  onUndoRestoreCanonical, // (snapshotPositions) => void — called when undo/redo on original tab
  showSalary, showNames,
  originalPositions, // canonical positions for change-highlighting
  basePositions, // base positions for delta calculation (original for scenarios)
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_POS);
  const [editId, setEditId] = useState(null);
  const [layout, setLayout] = useState("tree"); // "tree" | "tiers"
  const [payrollOpen, setPayrollOpen] = useState(true);
  const [removedOpen, setRemovedOpen] = useState(true);
  const [removedPositions, setRemovedPositions] = useState(initialRemovedPositions || []);
  useEffect(() => {
    if (initialRemovedPositions?.length > 0) {
      setRemovedPositions(initialRemovedPositions);
    }
  }, [JSON.stringify(initialRemovedPositions)]);

  // ---- Undo / Redo ----
  // Each history entry: { positions, removedPositions }
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Capture current state before a mutation
  const pushUndo = (currentPositions, currentRemoved) => {
    setUndoStack(s => [...s.slice(-29), { positions: currentPositions, removed: currentRemoved }]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setRedoStack(s => [...s, { positions: isOriginal ? positions : working, removed: removedPositions }]);
    if (isOriginal) {
      onUndoRestoreCanonical?.(prev.positions);
    } else {
      setRemovedPositions(prev.removed);
      onScenarioChange(prev.positions, prev.removed);
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(s => s.slice(0, -1));
    setUndoStack(s => [...s, { positions: isOriginal ? positions : working, removed: removedPositions }]);
    if (isOriginal) {
      onUndoRestoreCanonical?.(next.positions);
    } else {
      setRemovedPositions(next.removed);
      onScenarioChange(next.positions, next.removed);
    }
  };

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
      pushUndo(positions, removedPositions);
      onSavePosition(data, editId);
    } else {
      pushUndo(working, removedPositions);
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

  const [deleteConfirm, setDeleteConfirm] = useState(null); // position object to confirm delete

  const handleDelete = (id) => {
    const pos = working.find(p => p.id === id);
    if (pos) setDeleteConfirm(pos);
  };

  const confirmDelete = () => {
    const id = deleteConfirm.id;
    if (isOriginal) {
      pushUndo(positions, removedPositions);
      onDeletePosition(id);
    } else {
      pushUndo(working, removedPositions);
      const pos = working.find(p => p.id === id);
      const newRemoved = pos ? [...removedPositions, pos] : removedPositions;
      if (pos) setRemovedPositions(newRemoved);
      onScenarioChange(working.filter(p => p.id !== id), newRemoved);
    }
    setDeleteConfirm(null);
  };

  const handleRestore = (id) => {
    const pos = removedPositions.find(p => p.id === id);
    if (pos) {
      pushUndo(working, removedPositions);
      const newRemoved = removedPositions.filter(p => p.id !== id);
      onScenarioChange([...working, pos], newRemoved);
      setRemovedPositions(newRemoved);
    }
  };

  const [reparentConfirm, setReparentConfirm] = useState(null); // { childId, targetId }

  const handleReparentRequest = useCallback((childId, targetId) => {
    if (isOriginal) return;
    const isDescendant = (checkId, ancestorId) => {
      const pos = working.find(p => p.id === checkId);
      if (!pos) return false;
      if (pos.reports_to_id === ancestorId) return true;
      return pos.reports_to_id ? isDescendant(pos.reports_to_id, ancestorId) : false;
    };
    if (isDescendant(targetId, childId)) return;
    setReparentConfirm({ childId, targetId });
  }, [working, isOriginal]);

  const confirmReparent = () => {
    if (!reparentConfirm) return;
    const { childId, targetId } = reparentConfirm;
    pushUndo(working, removedPositions);
    const next = working.map(p => p.id === childId ? { ...p, reports_to_id: targetId } : p);
    onScenarioChange(next);
    setReparentConfirm(null);
  };

  const handleReorder = useCallback((draggedId, closestId, mouseX) => {
    if (isOriginal) return;
    // Swap the reports_to_id so the dragged node appears on the other side of closestId
    // Actually for display order we just swap their reports_to_id values (siblings share same parent)
    const dragged = working.find(p => p.id === draggedId);
    const closest = working.find(p => p.id === closestId);
    if (!dragged || !closest) return;
    // Only reorder if they share the same parent
    if (dragged.reports_to_id !== closest.reports_to_id) return;
    pushUndo(working, removedPositions);
    // Swap their reports_to_id is meaningless since they're the same — 
    // instead swap their x-sort by swapping the two positions' IDs in the array
    const di = working.findIndex(p => p.id === draggedId);
    const ci = working.findIndex(p => p.id === closestId);
    const next = [...working];
    [next[di], next[ci]] = [next[ci], next[di]];
    onScenarioChange(next);
  }, [working, isOriginal, removedPositions, onScenarioChange]);



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
        <div className="flex items-center gap-2 bg-blue-100 border border-blue-200 rounded-lg px-3 py-1.5">
          <button
            onClick={() => setPayrollOpen(o => !o)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title={payrollOpen ? "Hide financials" : "Show financials"}
          >
            {payrollOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Financials
          </button>
          {payrollOpen && <PayrollSummary positions={working} showSalary={showSalary} basePositions={basePositions} />}
        </div>
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center border rounded-md overflow-hidden">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 text-xs transition-colors disabled:opacity-40 hover:bg-muted"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </button>
            <div className="w-px h-4 bg-border" />
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 text-xs transition-colors disabled:opacity-40 hover:bg-muted"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" /> Redo
            </button>
          </div>
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

      <div className="flex-1 overflow-auto pb-6">
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
            onReparentRequest={handleReparentRequest}
            onReorder={handleReorder}
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
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Changelog — scenario sheets only */}
      {!isOriginal && (
        <ScenarioChangelog
          scenarioPositions={working}
          originalPositions={originalPositions}
          removedPositions={removedPositions}
        />
      )}

      {/* Removed positions list — scenario sheets only */}
      {!isOriginal && removedPositions.length > 0 && (
        <div className="border-t mx-4 mb-4 pt-3">
          <button
            onClick={() => setRemovedOpen(o => !o)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 hover:text-foreground transition-colors"
          >
            {removedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Removed from this scenario ({removedPositions.length})
          </button>
          {removedOpen && (
            <div className="flex flex-col gap-1">
              {removedPositions.map(p => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-medium text-red-800">{p.title}</span>
                    {p.person_name && <span className="text-red-600 text-xs">· {p.person_name}</span>}
                    {p.department && <span className="text-red-400 text-xs">· {p.department}</span>}
                    {showSalary && p.hourly_rate > 0 && <span className="text-red-400 text-xs">· ${p.hourly_rate}/hr</span>}
                    {showSalary && p.salary > 0 && !p.hourly_rate && <span className="text-red-400 text-xs">· ${p.salary.toLocaleString()}/yr</span>}
                  </div>
                  <button
                    onClick={() => handleRestore(p.id)}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-green-700 transition-colors ml-4"
                    title="Restore to scenario"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reparent confirmation dialog */}
      {reparentConfirm && (() => {
        const child = working.find(p => p.id === reparentConfirm.childId);
        const newManager = working.find(p => p.id === reparentConfirm.targetId);
        const oldManager = child?.reports_to_id ? working.find(p => p.id === child.reports_to_id) : null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
              <div>
                <h3 className="text-base font-semibold">Move Position?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold text-foreground">{child?.title}{child?.person_name ? ` (${child.person_name})` : ""}</span>
                  {" "}will now report to{" "}
                  <span className="font-semibold text-foreground">
                    {newManager ? `${newManager.title}${newManager.person_name ? ` (${newManager.person_name})` : ""}` : "no one (top level)"}
                  </span>.
                </p>
                {oldManager && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Previously reported to: {oldManager.title}{oldManager.person_name ? ` (${oldManager.person_name})` : ""}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-md border text-sm hover:bg-muted transition-colors"
                  onClick={() => setReparentConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  onClick={confirmReparent}
                >
                  Confirm Move
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (() => {
        const salary = deleteConfirm.hourly_rate && deleteConfirm.hours_per_week && deleteConfirm.weeks_per_year
          ? parseFloat(deleteConfirm.hourly_rate) * parseFloat(deleteConfirm.hours_per_week) * parseFloat(deleteConfirm.weeks_per_year)
          : (deleteConfirm.salary || 0);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
              <div>
                <h3 className="text-base font-semibold">Delete Position?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This will permanently remove <span className="font-semibold text-foreground">{deleteConfirm.title}</span>
                  {deleteConfirm.person_name ? ` (${deleteConfirm.person_name})` : ""} from the org chart.
                </p>
              </div>
              {salary > 0 && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm">
                  <p className="font-medium text-destructive">Payroll impact</p>
                  <p className="text-muted-foreground mt-0.5">
                    Removing this position will reduce annual wages by{" "}
                    <span className="font-semibold text-foreground">${Math.round(salary).toLocaleString()}/yr</span>
                    {" "}(${Math.round(salary / 12).toLocaleString()}/mo).
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">This can be undone with the Undo button immediately after.</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-md border text-sm hover:bg-muted transition-colors"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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