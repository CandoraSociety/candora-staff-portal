/**
 * Tier-aware tree layout with smart drag:
 * - Drag within same tier → reorder (no reporting change)
 * - Drag near a card in a HIGHER tier → prompt reparent confirmation
 */
import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { User, UserX, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TIER_ORDER = [
  "executive", "director", "senior_manager", "manager",
  "supervisor_team_lead", "specialist", "frontline",
  "assistant", "practicum_placement", "__none__",
];

const TIER_LABELS = {
  executive: "Executive", director: "Director", senior_manager: "Senior Manager",
  manager: "Manager", supervisor_team_lead: "Supervisor / Team Lead",
  specialist: "Specialist", frontline: "Frontline", assistant: "Assistant",
  practicum_placement: "Practicum Placement", __none__: "Unassigned",
};

const NODE_W = 150;
const NODE_H = 82;
const COL_GAP = 12;
const ROW_GAP = 20;
const TIER_LABEL_W = 120;
const PAD = 24;

// Proximity threshold (px) to trigger reparent prompt — must be well within the target card
const REPARENT_THRESHOLD = 40;

function tierRank(tier) {
  const i = TIER_ORDER.indexOf(tier || "__none__");
  return i === -1 ? TIER_ORDER.length - 1 : i;
}

function computeLayout(all) {
  const usedTiers = [...new Set(all.map(p => p.tier || "__none__"))];
  usedTiers.sort((a, b) => tierRank(a) - tierRank(b));

  const tierY = {};
  usedTiers.forEach((tier, i) => { tierY[tier] = i * (NODE_H + ROW_GAP); });

  const childrenOf = {};
  all.forEach(p => { childrenOf[p.id] = []; });
  all.forEach(p => {
    if (p.reports_to_id && childrenOf[p.reports_to_id]) {
      childrenOf[p.reports_to_id].push(p.id);
    }
  });
  const roots = all.filter(p => !p.reports_to_id || !all.find(x => x.id === p.reports_to_id));

  const subtreeWidth = {};
  function calcWidth(id) {
    const kids = childrenOf[id] || [];
    if (kids.length === 0) { subtreeWidth[id] = NODE_W; return NODE_W; }
    const total = kids.reduce((s, c, i) => s + calcWidth(c) + (i > 0 ? COL_GAP : 0), 0);
    subtreeWidth[id] = Math.max(NODE_W, total);
    return subtreeWidth[id];
  }
  roots.forEach(r => calcWidth(r.id));

  const xPos = {};
  function assignX(id, left) {
    const kids = childrenOf[id] || [];
    if (kids.length === 0) { xPos[id] = left + NODE_W / 2; return; }
    let cursor = left;
    kids.forEach(kid => {
      assignX(kid, cursor);
      cursor += (subtreeWidth[kid] || NODE_W) + COL_GAP;
    });
    xPos[id] = (xPos[kids[0]] + xPos[kids[kids.length - 1]]) / 2;
  }
  // Separate roots with subtrees (anchors) from standalone floating roots (no children, no manager)
  const anchoredRoots = roots.filter(r => (childrenOf[r.id] || []).length > 0);
  const floatingRoots = roots.filter(r => (childrenOf[r.id] || []).length === 0);

  // Lay out anchored roots first to establish the column grid
  let cursor = 0;
  anchoredRoots.forEach(r => {
    assignX(r.id, cursor);
    cursor += (subtreeWidth[r.id] || NODE_W) + COL_GAP * 2;
  });

  // Distribute floating roots evenly across the existing x-space (or just left-to-right if no anchors)
  if (floatingRoots.length > 0) {
    const allX = Object.values(xPos);
    if (allX.length === 0) {
      // No anchors: lay them out normally
      floatingRoots.forEach(r => {
        assignX(r.id, cursor);
        cursor += NODE_W + COL_GAP * 2;
      });
    } else {
      const minX = Math.min(...allX);
      const maxX = Math.max(...allX);
      const span = Math.max(maxX - minX, NODE_W);
      // Place floating roots evenly spaced within the existing x range
      floatingRoots.forEach((r, i) => {
        xPos[r.id] = floatingRoots.length === 1
          ? minX + span / 2
          : minX + (i / (floatingRoots.length - 1)) * span;
      });
    }
  }

  const posMap = {};
  all.forEach(p => {
    const tier = p.tier || "__none__";
    posMap[p.id] = { x: xPos[p.id] ?? 0, y: tierY[tier] ?? 0 };
  });

  const totalWidth = Math.max(...Object.values(xPos).map(x => x + NODE_W / 2), 200);
  const totalHeight = Math.max(...Object.values(tierY).map(y => y + NODE_H + ROW_GAP), 200);
  const tierRows = usedTiers.map(tier => ({ tier, y: tierY[tier], label: TIER_LABELS[tier] }));
  return { posMap, tierRows, totalWidth, totalHeight };
}

function NodeCard({ position, absX, absY, originalPositions, isScenario, showSalary, showNames,
  onEdit, onDelete, isDragging, isDropTarget, onMouseDown }) {

  let isChanged = false;
  if (isScenario && originalPositions?.length > 0) {
    const orig = originalPositions.find(o => o.id === (position.original_id || position.id));
    if (!orig) isChanged = true;
    else isChanged = orig.title !== position.title || orig.person_name !== position.person_name ||
      orig.salary !== position.salary || orig.reports_to_id !== position.reports_to_id;
  }

  let borderClass = "border-border bg-card shadow-sm";
  if (position.is_vacant) borderClass = "border-dashed border-muted-foreground/40 bg-muted/20";
  else if (isDropTarget) borderClass = "border-primary bg-primary/5 shadow-lg";
  else if (isScenario && isChanged) borderClass = "border-orange-400 bg-orange-50/50";
  else if (isScenario) borderClass = "border-blue-300 bg-card shadow-sm";

  return (
    <div
      style={{
        position: "absolute",
        left: absX - NODE_W / 2,
        top: absY,
        width: NODE_W,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.3 : 1,
        pointerEvents: isDragging ? "none" : "auto",
      }}
      className={`group border-2 rounded-xl p-2.5 text-center transition-colors select-none ${isScenario ? "cursor-grab" : "cursor-default"} ${borderClass}`}
      onMouseDown={isScenario ? onMouseDown : undefined}
    >
      {isScenario && isChanged && <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-orange-400 border-2 border-white" />}
      <div className="flex justify-center mb-0.5">
        {position.is_vacant ? <UserX className="w-5 h-5 text-muted-foreground/50" /> : <User className="w-5 h-5 text-accent" />}
      </div>
      <p className="text-xs font-semibold leading-tight truncate">{position.title}</p>
      {showNames && position.person_name && <p className="text-[10px] text-muted-foreground truncate">{position.person_name}</p>}
      {position.department && <p className="text-[10px] text-muted-foreground/60 truncate">{position.department}</p>}
      {position.is_vacant && <Badge variant="outline" className="text-[10px] mt-0.5 px-1">Vacant</Badge>}
      {showSalary && position.salary > 0 && <p className="text-[10px] text-muted-foreground">${position.salary.toLocaleString()}/yr</p>}
      {showSalary && position.hourly_rate > 0 && <p className="text-[10px] text-muted-foreground">${position.hourly_rate}/hr</p>}
      <div className="absolute -top-2 -right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onEdit && <button className="w-5 h-5 bg-background border rounded-full flex items-center justify-center shadow-sm" onMouseDown={e => e.stopPropagation()} onClick={() => onEdit(position)}><Pencil className="w-2.5 h-2.5" /></button>}
        {onDelete && <button className="w-5 h-5 bg-background border rounded-full flex items-center justify-center shadow-sm" onMouseDown={e => e.stopPropagation()} onClick={() => onDelete(position.id)}><Trash2 className="w-2.5 h-2.5 text-destructive" /></button>}
      </div>
    </div>
  );
}

export default function OrgTreeLayout({
  positions, originalPositions = [], isScenario, showSalary, showNames,
  onEdit, onDelete, onReparentRequest, onReorder,
}) {
  const containerRef = useRef(null);
  const [drag, setDrag] = useState(null);
  // drag = { id, startX, startY, currentX, currentY, offsetX, offsetY }
  const [dropTargetId, setDropTargetId] = useState(null);

  const { posMap, tierRows, totalWidth, totalHeight } = useMemo(() => computeLayout(positions), [positions]);
  const svgW = totalWidth + TIER_LABEL_W + PAD * 2;
  const svgH = totalHeight + NODE_H + PAD * 2;

  // Absolute pixel coords of a position's card centre
  const absCardCentre = useCallback((id) => {
    const p = posMap[id];
    if (!p) return null;
    return { x: p.x + TIER_LABEL_W + PAD, y: p.y + PAD + NODE_H / 2 };
  }, [posMap]);

  // During drag: find the highest-tier card (superior) the dragged card is hovering within REPARENT_THRESHOLD
  const findReparentTarget = useCallback((draggedId, mouseX, mouseY) => {
    const dragged = positions.find(p => p.id === draggedId);
    if (!dragged) return null;
    const draggedRank = tierRank(dragged.tier);

    let best = null;
    let bestDist = Infinity;

    positions.forEach(p => {
      if (p.id === draggedId) return;
      const pRank = tierRank(p.tier);
      if (pRank >= draggedRank) return; // must be a superior tier

      const cardPos = posMap[p.id];
      if (!cardPos) return;
      const cardAbsX = cardPos.x + TIER_LABEL_W + PAD;
      const cardAbsY = cardPos.y + PAD;

      // Check if mouse is within card bounds + threshold
      const inX = mouseX >= cardAbsX - NODE_W / 2 - REPARENT_THRESHOLD &&
                  mouseX <= cardAbsX + NODE_W / 2 + REPARENT_THRESHOLD;
      const inY = mouseY >= cardAbsY - REPARENT_THRESHOLD &&
                  mouseY <= cardAbsY + NODE_H + REPARENT_THRESHOLD;

      if (inX && inY) {
        const dist = Math.hypot(mouseX - cardAbsX, mouseY - (cardAbsY + NODE_H / 2));
        if (dist < bestDist) { bestDist = dist; best = p.id; }
      }
    });

    return best;
  }, [positions, posMap]);

  const handleMouseDown = useCallback((e, id) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left + containerRef.current.scrollLeft;
    const mouseY = e.clientY - rect.top + containerRef.current.scrollTop;
    const card = posMap[id];
    if (!card) return;
    const cardAbsX = card.x + TIER_LABEL_W + PAD;
    const cardAbsY = card.y + PAD;
    setDrag({
      id,
      currentX: cardAbsX,
      currentY: cardAbsY,
      offsetX: mouseX - cardAbsX,
      offsetY: mouseY - cardAbsY,
    });
    setDropTargetId(null);
  }, [posMap]);

  useEffect(() => {
    if (!drag) return;

    const onMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left + containerRef.current.scrollLeft;
      const mouseY = e.clientY - rect.top + containerRef.current.scrollTop;
      setDrag(d => ({ ...d, currentX: mouseX - d.offsetX, currentY: mouseY - d.offsetY }));
      const target = findReparentTarget(drag.id, mouseX, mouseY);
      setDropTargetId(target);
    };

    const onUp = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) { setDrag(null); setDropTargetId(null); return; }
      const mouseX = e.clientX - rect.left + containerRef.current.scrollLeft;
      const mouseY = e.clientY - rect.top + containerRef.current.scrollTop;

      const reparentTarget = findReparentTarget(drag.id, mouseX, mouseY);

      if (reparentTarget) {
        // Prompt reparent
        onReparentRequest?.(drag.id, reparentTarget);
      } else {
        // Same-tier reorder: find closest same-tier card horizontally
        const dragged = positions.find(p => p.id === drag.id);
        if (dragged) {
          const sameTier = positions.filter(p => p.tier === dragged.tier && p.id !== drag.id);
          // Find if we're between two same-tier cards → reorder
          if (sameTier.length > 0) {
            // find the closest by x
            let closestId = null;
            let closestDist = Infinity;
            sameTier.forEach(p => {
              const cardPos = posMap[p.id];
              if (!cardPos) return;
              const cx = cardPos.x + TIER_LABEL_W + PAD;
              const cy = cardPos.y + PAD;
              // only consider same-row cards (similar y)
              if (Math.abs(cy - (drag.currentY)) < NODE_H * 2) {
                const dist = Math.abs(mouseX - cx);
                if (dist < closestDist) { closestDist = dist; closestId = p.id; }
              }
            });
            if (closestId && closestDist < NODE_W * 1.5) {
              onReorder?.(drag.id, closestId, mouseX);
            }
          }
        }
      }

      setDrag(null);
      setDropTargetId(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, findReparentTarget, positions, posMap, onReparentRequest, onReorder]);

  // Build SVG lines
  const lines = [];
  positions.forEach(p => {
    if (!p.reports_to_id) return;
    const parent = posMap[p.reports_to_id];
    const child = posMap[p.id];
    if (!parent || !child) return;
    const px = parent.x + TIER_LABEL_W + PAD;
    const py = parent.y + NODE_H + PAD;
    const cx = child.x + TIER_LABEL_W + PAD;
    const cy = child.y + PAD;
    const midY = py + (cy - py) / 2;
    lines.push(
      <path key={`solid-${p.reports_to_id}-${p.id}`}
        d={`M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`}
        fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
    );
  });
  positions.forEach(p => {
    if (!p.dotted_line_reports_to_id) return;
    const parent = posMap[p.dotted_line_reports_to_id];
    const child = posMap[p.id];
    if (!parent || !child) return;
    const px = parent.x + TIER_LABEL_W + PAD;
    const py = parent.y + NODE_H + PAD;
    const cx = child.x + TIER_LABEL_W + PAD;
    const cy = child.y + PAD;
    const midY = py + (cy - py) / 2;
    lines.push(
      <path key={`dotted-${p.dotted_line_reports_to_id}-${p.id}`}
        d={`M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`}
        fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.6" />
    );
  });

  return (
    <div ref={containerRef} className="relative overflow-auto" style={{ minHeight: svgH + 20, userSelect: "none" }}>
      <div className="relative" style={{ width: svgW, height: svgH }}>
        {/* Tier row bands */}
        {tierRows.map((row, i) => (
          <div key={row.tier} style={{ position: "absolute", top: row.y + PAD, left: 0, width: svgW, height: NODE_H + ROW_GAP }}
            className={i % 2 === 0 ? "bg-muted/10" : ""}>
            <div style={{ position: "absolute", top: 0, left: 0, width: TIER_LABEL_W, height: NODE_H }}
              className="flex items-center px-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">{row.label}</p>
            </div>
          </div>
        ))}

        {/* SVG lines */}
        <svg style={{ position: "absolute", top: 0, left: 0, width: svgW, height: svgH, pointerEvents: "none" }}>
          {lines}
        </svg>

        {/* Cards */}
        {positions.map(p => {
          const pos = posMap[p.id];
          if (!pos) return null;
          const absX = pos.x + TIER_LABEL_W + PAD;
          const absY = pos.y + PAD;
          const isDragging = drag?.id === p.id;
          return (
            <NodeCard
              key={p.id}
              position={p}
              absX={isDragging ? drag.currentX + NODE_W / 2 : absX}
              absY={isDragging ? drag.currentY : absY}
              originalPositions={originalPositions}
              isScenario={isScenario}
              showSalary={showSalary}
              showNames={showNames}
              onEdit={onEdit}
              onDelete={onDelete}
              isDragging={isDragging}
              isDropTarget={dropTargetId === p.id}
              onMouseDown={(e) => handleMouseDown(e, p.id)}
            />
          );
        })}

        {/* Ghost card while dragging */}
        {drag && (() => {
          const p = positions.find(x => x.id === drag.id);
          if (!p) return null;
          return (
            <div style={{
              position: "absolute",
              left: drag.currentX,
              top: drag.currentY,
              width: NODE_W,
              zIndex: 100,
              pointerEvents: "none",
              opacity: 0.85,
            }}
              className={`border-2 rounded-xl p-2.5 text-center shadow-2xl bg-card ${dropTargetId ? "border-primary" : "border-accent"}`}
            >
              <p className="text-xs font-semibold leading-tight truncate">{p.title}</p>
              {p.person_name && <p className="text-[10px] text-muted-foreground truncate">{p.person_name}</p>}
              {dropTargetId && (
                <p className="text-[10px] text-primary font-medium mt-0.5">→ new manager</p>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}