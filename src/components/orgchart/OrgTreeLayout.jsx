/**
 * Tier-aware tree layout with smart drag:
 * - Drag within same tier → reorder (no reporting change)
 * - Drag near a card in a HIGHER tier → prompt reparent confirmation
 */
import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { User, UserX, Pencil, Trash2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
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
const ROW_GAP = 80;
const TIER_LABEL_W = 120;
const PAD = 24;

const REPARENT_THRESHOLD = 40;

function tierRank(tier) {
  const i = TIER_ORDER.indexOf(tier || "__none__");
  return i === -1 ? TIER_ORDER.length - 1 : i;
}

function computeLayout(all) {
  // Group by row_number (default to tier-based if not set)
  const usedRows = [...new Set(all.map(p => p.row_number ?? p.tier ?? "__none__"))];
  usedRows.sort((a, b) => {
    // If both are numbers, sort numerically
    if (typeof a === "number" && typeof b === "number") return a - b;
    // If both are strings (tiers), use tier order
    if (typeof a === "string" && typeof b === "string") return tierRank(a) - tierRank(b);
    // Numbers come before strings
    if (typeof a === "number") return -1;
    return 1;
  });

  const rowY = {};
  usedRows.forEach((row, i) => { rowY[row] = i * (NODE_H + ROW_GAP); });

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
  let cursor = 0;
  roots.forEach(r => { assignX(r.id, cursor); cursor += (subtreeWidth[r.id] || NODE_W) + COL_GAP * 2; });

  const posMap = {};
  all.forEach(p => {
    const row = p.row_number ?? p.tier ?? "__none__";
    posMap[p.id] = { x: xPos[p.id] ?? 0, y: rowY[row] ?? 0 };
  });

  const totalWidth = Math.max(...Object.values(xPos).map(x => x + NODE_W / 2), 200);
  const totalHeight = Math.max(...Object.values(rowY).map(y => y + NODE_H + ROW_GAP), 200);
  const tierRows = usedRows.map(row => ({ tier: row, y: rowY[row], label: typeof row === "number" ? `Row ${row}` : TIER_LABELS[row] || row }));
  return { posMap, tierRows, totalWidth, totalHeight };
}

function NodeCard({ position, absX, absY, originalPositions, isScenario, showSalary, showNames,
  onEdit, onDelete, isDragging, isDropTarget, onMouseDown }) {

  let isChanged = false;
  if (isScenario && originalPositions?.length > 0) {
    const origId = position.original_id || position.id;
    const orig = originalPositions.find(o => o.id === origId)
      || originalPositions.find(o => o.title === position.title && (o.person_name || "") === (position.person_name || ""));
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
      {showSalary && position.salary > 0 && (
        <p className="text-[10px] text-muted-foreground font-medium">${Math.round(position.salary).toLocaleString()}/yr</p>
      )}
      {showSalary && (position.hourly_rate > 0 || (position.hours_per_week > 0 && position.weeks_per_year > 0)) && (() => {
        const h = position.hours_per_week;
        const w = position.weeks_per_year;
        const effectiveHourly = (h > 0 && w > 0 && position.salary > 0)
          ? (position.salary / (h * w)).toFixed(2)
          : (position.hourly_rate || 0).toFixed(2);
        return (
          <p className="text-[10px] text-muted-foreground/70">
            ${effectiveHourly}/hr{h > 0 ? ` · ${h}h/wk` : ""}{w > 0 ? ` · ${w}wks` : ""}
          </p>
        );
      })()}
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
  const [zoom, setZoom] = useState(1);
  const [drag, setDrag] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const { posMap, tierRows, totalWidth, totalHeight } = useMemo(() => computeLayout(positions), [positions]);
  const svgW = totalWidth + TIER_LABEL_W + PAD * 2;
  const svgH = totalHeight + NODE_H + PAD * 2;

  const zoomIn = () => setZoom(z => Math.min(2, Math.round((z + 0.1) * 10) / 10));
  const zoomOut = () => setZoom(z => Math.max(0.3, Math.round((z - 0.1) * 10) / 10));

  const findReparentTarget = useCallback((draggedId, mouseX, mouseY) => {
    const dragged = positions.find(p => p.id === draggedId);
    if (!dragged) return null;
    const draggedRank = tierRank(dragged.tier);

    let best = null;
    let bestDist = Infinity;

    positions.forEach(p => {
      if (p.id === draggedId) return;
      const pRank = tierRank(p.tier);
      if (pRank >= draggedRank) return;

      const cardPos = posMap[p.id];
      if (!cardPos) return;
      const cardAbsX = cardPos.x + TIER_LABEL_W + PAD;
      const cardAbsY = cardPos.y + PAD;

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
    const mouseX = (e.clientX - rect.left + containerRef.current.scrollLeft) / zoom;
    const mouseY = (e.clientY - rect.top + containerRef.current.scrollTop) / zoom;
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
  }, [posMap, zoom]);

  useEffect(() => {
    if (!drag) return;

    const onMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = (e.clientX - rect.left + containerRef.current.scrollLeft) / zoom;
      const mouseY = (e.clientY - rect.top + containerRef.current.scrollTop) / zoom;
      setDrag(d => ({ ...d, currentX: mouseX - d.offsetX, currentY: mouseY - d.offsetY }));
      const target = findReparentTarget(drag.id, mouseX, mouseY);
      setDropTargetId(target);
    };

    const onUp = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) { setDrag(null); setDropTargetId(null); return; }
      const mouseX = (e.clientX - rect.left + containerRef.current.scrollLeft) / zoom;
      const mouseY = (e.clientY - rect.top + containerRef.current.scrollTop) / zoom;

      const reparentTarget = findReparentTarget(drag.id, mouseX, mouseY);

      if (reparentTarget) {
        onReparentRequest?.(drag.id, reparentTarget);
      } else {
        const dragged = positions.find(p => p.id === drag.id);
        if (dragged) {
          const sameTier = positions.filter(p => p.tier === dragged.tier && p.id !== drag.id);
          if (sameTier.length > 0) {
            let closestId = null;
            let closestDist = Infinity;
            sameTier.forEach(p => {
              const cardPos = posMap[p.id];
              if (!cardPos) return;
              const cx = cardPos.x + TIER_LABEL_W + PAD;
              const cy = cardPos.y + PAD;
              if (Math.abs(cy - drag.currentY) < NODE_H * 2) {
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
  }, [drag, findReparentTarget, positions, posMap, onReparentRequest, onReorder, zoom]);

  // Build SVG lines
  const lines = [];
  positions.forEach(p => {
    if (!p.reports_to_id || p.reports_to_id === "") return;
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
    if (!p.dotted_line_reports_to_id || p.dotted_line_reports_to_id === "") return;
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
    <div className="relative w-full h-full" style={{ userSelect: "none", minHeight: "400px" }}>
      {/* Zoom controls — fixed top-right, high z-index to stay on top */}
      <div className="absolute top-2 right-2 z-[9999] flex items-center gap-1 bg-card border rounded-lg shadow-lg px-2 py-1.5">
        <button onClick={zoomOut} className="p-1.5 rounded hover:bg-muted transition-colors" title="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={zoomIn} className="p-1.5 rounded hover:bg-muted transition-colors" title="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        {zoom !== 1 && (
          <button onClick={() => setZoom(1)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Reset zoom">
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Scrollable container — sized to the scaled content */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ minHeight: svgH * zoom + 20 }}
      >
        {/* Scaled inner content */}
        <div style={{ width: svgW * zoom, height: svgH * zoom, position: "relative" }}>
          <div style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            width: svgW,
            height: svgH,
            position: "absolute",
            top: 0,
            left: 0,
          }}>
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
                  {dropTargetId && <p className="text-[10px] text-primary font-medium mt-0.5">→ new manager</p>}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}