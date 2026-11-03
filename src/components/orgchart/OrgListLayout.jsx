import { User, UserX, Users, Building2, CornerDownRight, Pencil, Trash2, GripVertical } from "lucide-react";

const TIER_ORDER = [
  "executive", "director", "senior_manager", "manager", "supervisor_team_lead",
  "specialist", "frontline", "assistant", "practicum_placement", "skilled_volunteer",
];

const TIER_LABELS = {
  executive: "Executive", director: "Director", senior_manager: "Senior Manager",
  manager: "Manager", supervisor_team_lead: "Supervisor / Team Lead", specialist: "Specialist",
  frontline: "Frontline", assistant: "Assistant",
  practicum_placement: "Practicum Placement", skilled_volunteer: "Skilled Volunteer",
};

// Who a position reports to, and how many people report to it
function relationshipInfo(position, byId, childrenOf) {
  const manager = position.reports_to_id ? byId[position.reports_to_id] : null;
  const dotted = position.dotted_line_reports_to_id ? byId[position.dotted_line_reports_to_id] : null;
  const kids = childrenOf[position.id] || [];
  return { manager, dotted, kids };
}

function primaryDepartment(position) {
  const list = (position.departments || []).filter(Boolean);
  if (list.length > 0) return { name: list[0], extra: list.slice(1) };
  return { name: position.department || "", extra: [] };
}

function ListRow({ position, byId, childrenOf, originalPositions, showSalary, showNames, isScenario,
  onEdit, onDelete, isDragging, onDragStart, onDragOver, onDrop }) {
  const { manager, dotted, kids } = relationshipInfo(position, byId, childrenOf);
  const dept = primaryDepartment(position);

  let isChanged = false;
  if (isScenario && originalPositions?.length > 0) {
    const orig = originalPositions.find(o => o.id === (position.original_id || position.id))
      || originalPositions.find(o => o.title === position.title && (o.person_name || "") === (position.person_name || ""));
    if (!orig) isChanged = true;
    else isChanged = orig.title !== position.title || orig.person_name !== position.person_name
      || orig.salary !== position.salary || orig.reports_to_id !== position.reports_to_id
      || orig.dotted_line_reports_to_id !== position.dotted_line_reports_to_id;
  }

  let statusClass = "";
  if (position.is_inactive) statusClass = "opacity-60";
  else if (position.is_vacant) statusClass = "bg-muted/20";

  const reportNames = kids.map(k => k.person_name || k.title).filter(Boolean);

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-2.5 border-b border-border/70 last:border-b-0 transition-colors hover:bg-muted/30 ${statusClass}`}
      draggable={isScenario && !!onDragStart}
      onDragStart={isScenario && onDragStart ? (e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(position.id); } : undefined}
      onDragOver={isScenario && onDragOver ? (e) => { e.preventDefault(); onDragOver(position.id); } : undefined}
      onDrop={isScenario && onDrop ? (e) => { e.preventDefault(); onDrop(position.id); } : undefined}
    >
      {isScenario && <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 cursor-grab" />}
      {isDragging && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}

      <div className="w-8 h-8 rounded-full bg-muted/70 flex items-center justify-center shrink-0">
        {position.is_vacant
          ? <UserX className="w-4 h-4 text-muted-foreground/60" />
          : <User className="w-4 h-4 text-accent" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold leading-tight truncate">{position.title}</p>
          {showNames && position.person_name && (
            <span className="text-xs text-muted-foreground truncate">{position.person_name}</span>
          )}
          {position.is_vacant && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-muted-foreground/40 text-muted-foreground">Vacant</span>
          )}
          {position.is_inactive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-muted-foreground/40 text-muted-foreground">Inactive</span>
          )}
          {isScenario && isChanged && (
            <span className="w-2 h-2 rounded-full bg-orange-400" title="Modified" />
          )}
        </div>
        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-1 text-[11px] text-muted-foreground">
          {dept.name ? (
            <span className="flex items-center gap-1" title={[dept.name, ...dept.extra].join(", ")}>
              <Building2 className="w-3 h-3" />
              {dept.name}
              {dept.extra.length > 0 && <span className="text-muted-foreground/60">+{dept.extra.length}</span>}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground/50"><Building2 className="w-3 h-3" />No department</span>
          )}
          <span className="flex items-center gap-1">
            <CornerDownRight className="w-3 h-3" />
            Reports to:
            <span className="text-foreground/80">
              {manager ? (manager.person_name || manager.title) : "Top of chart"}
            </span>
          </span>
          {dotted && (
            <span className="flex items-center gap-1" title={`Dotted line: ${dotted.person_name || dotted.title}`}>
              <CornerDownRight className="w-3 h-3 opacity-50" />
              Dotted: <span className="text-foreground/70">{dotted.person_name || dotted.title}</span>
            </span>
          )}
          <span className="flex items-center gap-1" title={reportNames.length ? reportNames.join(", ") : undefined}>
            <Users className="w-3 h-3" />
            {kids.length === 0 ? "No direct reports" : `${kids.length} direct report${kids.length === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>

      {showSalary && (position.salary > 0 || position.hourly_rate > 0) && (
        <div className="text-right shrink-0 hidden sm:block">
          {position.salary > 0 && <p className="text-xs font-medium text-muted-foreground">${Math.round(position.salary).toLocaleString()}/yr</p>}
          {position.hourly_rate > 0 && (
            <p className="text-[11px] text-muted-foreground/70">
              ${position.hourly_rate}/hr{position.hours_per_week > 0 ? ` · ${position.hours_per_week}h/wk` : ""}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button className="w-6 h-6 rounded-full border bg-background flex items-center justify-center" title="Edit position" onClick={() => onEdit(position)}>
            <Pencil className="w-3 h-3" />
          </button>
        )}
        {onDelete && (
          <button className="w-6 h-6 rounded-full border bg-background flex items-center justify-center" title="Delete position" onClick={() => onDelete(position.id)}>
            <Trash2 className="w-3 h-3 text-destructive" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * List layout — one row per position, grouped by tier. Each row states the
 * department, who the position reports to, and how many people report to it,
 * so the hierarchy can be read without following connector lines.
 */
export default function OrgListLayout({
  positions, originalPositions = [], showSalary, showNames, isScenario,
  onEdit, onDelete, draggingId, onDragStart, onDragOver, onDrop,
}) {
  const byId = {};
  positions.forEach(p => { byId[p.id] = p; });
  const childrenOf = {};
  positions.forEach(p => {
    const pid = p.reports_to_id;
    if (!pid || !byId[pid]) return;
    (childrenOf[pid] = childrenOf[pid] || []).push(p);
  });

  const groups = TIER_ORDER
    .map(tier => ({ tier, label: TIER_LABELS[tier] || tier, rows: positions.filter(p => p.tier === tier) }))
    .filter(g => g.rows.length > 0);
  const unassigned = positions.filter(p => !p.tier || !TIER_ORDER.includes(p.tier));
  if (unassigned.length > 0) groups.push({ tier: "__none__", label: "Unassigned", rows: unassigned });

  if (positions.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No positions yet. Add one to get started.</p>;
  }

  return (
    <div className="px-4 py-4 space-y-4 max-w-5xl mx-auto">
      {groups.map(group => (
        <div key={group.tier} className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{group.label}</p>
            <span className="text-[11px] text-muted-foreground">{group.rows.length} position{group.rows.length === 1 ? "" : "s"}</span>
          </div>
          {group.rows.map(position => (
            <ListRow
              key={position.id}
              position={position}
              byId={byId}
              childrenOf={childrenOf}
              originalPositions={originalPositions}
              showSalary={showSalary}
              showNames={showNames}
              isScenario={isScenario}
              onEdit={onEdit}
              onDelete={onDelete}
              isDragging={draggingId === position.id}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </div>
      ))}
    </div>
  );
}