import { Pencil, Trash2, User, UserX, DollarSign, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TIERS = [
  { value: "executive", label: "Executive" },
  { value: "director", label: "Director" },
  { value: "senior_manager", label: "Senior Manager" },
  { value: "manager", label: "Manager" },
  { value: "supervisor_team_lead", label: "Supervisor / Team Lead" },
  { value: "frontline", label: "Frontline" },
  { value: "assistant", label: "Assistant" },
  { value: "practicum_placement", label: "Practicum Placement" },
  { value: "specialist", label: "Specialist" },
];

// changed = this position differs from the canonical original
export default function OrgNode({
  position, all, originalPositions = [],
  onEdit, onDelete,
  showSalary = true, showNames = true,
  isScenario = false,
  draggingId, onDragStart, onDragOver, onDrop,
}) {
  const children = all.filter(p => p.reports_to_id === position.id);

  const branchSalary = (function sum(pos) {
    const kids = all.filter(p => p.reports_to_id === pos.id);
    return (pos.salary || 0) + kids.reduce((s, c) => s + sum(c), 0);
  })(position);

  // Determine if changed vs original (scenario mode only)
  let isChanged = false;
  if (isScenario && originalPositions.length > 0) {
    const orig = originalPositions.find(o => o.id === (position.original_id || position.id));
    if (!orig) {
      isChanged = true; // new position added in scenario
    } else {
      isChanged = (
        orig.title !== position.title ||
        orig.person_name !== position.person_name ||
        orig.salary !== position.salary ||
        orig.reports_to_id !== position.reports_to_id
      );
    }
  }

  const isDragging = draggingId === position.id;
  const isDropTarget = draggingId && draggingId !== position.id;

  let borderClass = "border-border bg-card shadow-sm";
  if (position.is_vacant) borderClass = "border-dashed border-muted-foreground/40 bg-muted/20";
  else if (isScenario && isChanged) borderClass = "border-orange-400 bg-orange-50/50";
  else if (isScenario && !isChanged) borderClass = "border-blue-300 bg-card shadow-sm";

  return (
    <div className="flex flex-col items-center">
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
        {position.tier && <p className="text-[10px] text-muted-foreground/60 italic">{TIERS.find(t => t.value === position.tier)?.label}</p>}
        {position.department && <p className="text-xs text-muted-foreground/70">{position.department}</p>}
        {position.is_vacant && <Badge variant="outline" className="text-xs mt-1">Vacant</Badge>}
        {showSalary && position.salary > 0 && <p className="text-xs text-muted-foreground mt-0.5">${position.salary.toLocaleString()}</p>}
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

        {children.length > 0 && showSalary && (
          <p className="text-xs text-muted-foreground/60 mt-1 flex items-center justify-center gap-0.5">
            <DollarSign className="w-2.5 h-2.5" />{branchSalary.toLocaleString()}
          </p>
        )}
      </div>

      {children.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="w-px h-6 bg-border" />
          <div className="flex gap-6 items-start relative">
            {children.length > 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-border" />
            )}
            {children.map(child => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-6 bg-border" />
                <OrgNode
                  position={child} all={all} originalPositions={originalPositions}
                  onEdit={onEdit} onDelete={onDelete}
                  showSalary={showSalary} showNames={showNames}
                  isScenario={isScenario}
                  draggingId={draggingId}
                  onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}