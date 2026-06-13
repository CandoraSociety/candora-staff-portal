import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import OrgNode from "./OrgNode";
import OrgChartPositionForm, { EMPTY_POS } from "./OrgChartPositionForm";
import PayrollSummary from "./PayrollSummary";
const nanoid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

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

  const working = isOriginal ? positions : (scenarioPositions || []);

  const openAdd = () => { setForm(EMPTY_POS); setEditId(null); setFormOpen(true); };
  const openEdit = (p) => { setForm({ ...p, salary: p.salary || "" }); setEditId(p.id); setFormOpen(true); };

  const handleSave = () => {
    if (!form.title.trim()) return;
    const data = { ...form, salary: parseFloat(form.salary) || 0 };
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

  const roots = working.filter(p => !p.reports_to_id || !working.find(x => x.id === p.reports_to_id));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-1 py-2 flex-wrap gap-2">
        <PayrollSummary positions={working} showSalary={showSalary} />
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add Position
        </Button>
      </div>

      {/* Drop zone for making a node root-level */}
      {!isOriginal && draggingId && (
        <div
          className="mx-2 mb-2 h-10 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center text-xs text-muted-foreground"
          onDragOver={e => e.preventDefault()}
          onDrop={handleDropToRoot}
        >
          Drop here to make top-level
        </div>
      )}

      <div
        className="flex-1 overflow-auto pb-6 pt-2"
        onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
      >
        {working.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No positions yet. Add one to get started.</p>
        )}
        <div className="flex gap-12 justify-center min-w-max px-6">
          {roots.map(r => (
            <OrgNode
              key={r.id}
              position={r}
              all={working}
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