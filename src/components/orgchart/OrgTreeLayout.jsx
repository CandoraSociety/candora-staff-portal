/**
 * Tier-aware tree layout with smart drag.
 * Supports two orientations: "top-down" (default) and "left-right".
 */
import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { User, UserX, Pencil, Trash2, ZoomIn, ZoomOut, RotateCcw, ArrowDown, ArrowRight } from "lucide-react";
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
const TIER_LABEL_H = 28; // for left-right mode: horizontal label strip height
const PAD = 24;

const REPARENT_THRESHOLD = 40;

function tierRank(tier) {
  const i = TIER_ORDER.indexOf(tier || "__none__");
  return i === -1 ? TIER_ORDER.length - 1 : i;
}

// Top-down layout: tiers are rows (y axis), siblings spread on x
function computeTopDownLayout(all) {
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
  let cursor = 0;
  roots.forEach(r => { assignX(r.id, cursor); cursor += (subtreeWidth[r.id] || NODE_W) + COL_GAP * 2; });

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

// Left-right layout: tiers are columns (x axis), siblings spread on y
function computeLeftRightLayout(all) {
  const usedTiers = [...new Set(all.map(p => p.tier || "__none__"))];
  usedTiers.sort((a, b) => tierRank(a) - tierRank(b));

  // Each tier column: x offset
  const tierX = {};
  usedTiers.forEach((tier, i) => { tierX[tier] = i * (NODE_W + COL_GAP * 3); });

  const childrenOf = {};
  all.forEach(p => { childrenOf[p.id] = []; });
  all.forEach(p => {
    if (p.reports_to_id && childrenOf[p.reports_to_id]) {
      childrenOf[p.reports_to_id].push(p.id);
    }
  });
  const roots = all.filter(p => !p.reports_to_id || !all.find(x => x.id === p.reports_to_id));

  // subtreeHeight = total vertical space needed for this node's subtree
  const subtreeHeight = {};
  function calcHeight(id) {
    const kids = childrenOf[id] || [];
    if (kids.length === 0) { subtreeHeight[id] = NODE_H; return NODE_H; }
    const total = kids.reduce((s, c, i) => s + calcHeight(c) + (i > 0 ? ROW_GAP : 0), 0);
    subtreeHeight[id] = Math.max(NODE_H, total);
    return subtreeHeight[id];
  }
  roots.forEach(r => calcHeight(r.id));

  const yPos = {};
  function assignY(id, top) {
    const kids = childrenOf[id] || [];
    if (kids.length === 0) { yPos[id] = top + NODE_H / 2; return; }
    let cursor = top;
    kids.forEach(kid => {
      assignY(kid, cursor);
      cursor += (subtreeHeight[kid] || NODE_H) + ROW_GAP;
    });
    yPos[id] = (yPos[kids[0]] + yPos[kids[kids.length - 1]]) / 2;
  }
  let cursor = 0;
  roots.forEach(r => { assignY(r.id, cursor); cursor += (subtreeHeight[r.id] || NODE_H) + ROW_GAP * 2; });

  const posMap = {};
  all.forEach(p => {
    const tier = p.tier || "__none__";
    posMap[p.id] = { x: tierX[tier] ?? 0, y: yPos[p.id] ?? 0 };
  });

  const totalWidth = Math.max(...usedTiers.map(t => tierX[t] + NODE_W), 200);
  const totalHeight = Math.max(...Object.values(yPos).map(y => y + NODE_H / 2), 200);
  const tierCols = usedTiers.map(tier => ({ tier, x: tierX[tier], label: TIER_LABELS[tier] }));
  return { posMap, tierCols, totalWidth, totalHeight };
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
        top: absY - NODE_H / 2,
        width: NODE_W,
        height: NODE_H,
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
  const [zoom, setZoom] = useState(1);
  const [orientation, setOrientation] = useState("top-down"); // "top-down" | "left-right"
  const [drag, setDrag] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const isLR = orientation === "left-right";

  const layoutTD = useMemo(() => computeTopDownLayout(positions), [positions]);
  const layoutLR = useMemo(() => computeLeftRightLayout(positions), [positions]);

  const { posMap, totalWidth, totalHeight } = isLR ? layoutLR : layoutTD;
  const tierRows = !isLR ? layoutTD.tierRows : [];
  const tierCols = isLR ? layoutLR.tierCols : [];

  // Canvas size
  const canvasW = isLR
    ? totalWidth + TIER_LABEL_W + PAD * 2
    : totalWidth + TIER_LABEL_W + PAD * 2;
  const canvasH = isLR
    ? totalHeight + TIER_LABEL_H + PAD * 2
    : totalHeight + NODE_H + PAD * 2;

  // Absolute pixel position of a card's centre given posMap entry
  const cardAbsPos = useCallback((pos) => {
    if (!pos) return { cx: 0, cy: 0 };
    if (isLR) {
      return {
        cx: pos.x + TIER_LABEL_W + PAD + NODE_W / 2,
        cy: pos.y + TIER_LABEL_H + PAD,
      };
    }
    return {
      cx: pos.x + TIER_LABEL_W + PAD,
      cy: pos.y + PAD + NODE_H / 2,
    };
  }, [isLR]);

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
      if (tierRank(p.tier) >= draggedRank) return;

      const cardPos = posMap[p.id];
      if (!cardPos) return;
      const { cx, cy } = cardAbsPos(cardPos);

      const inX = mouseX >= cx - NODE_W / 2 - REPARENT_THRESHOLD && mouseX <= cx + NODE_W / 2 + REPARENT_THRESHOLD;
      const inY = mouseY >= cy - NODE_H / 2 - REPARENT_THRESHOLD && mouseY <= cy + NODE_H / 2 + REPARENT_THRESHOLD;

      if (inX && inY) {
        const dist = Math.hypot(mouseX - cx, mouseY - cy);
        if (dist < bestDist) { bestDist = dist; best = p.id; }
      }
    });

    return best;
  }, [positions, posMap, cardAbsPos]);

  const handleMouseDown = useCallback((e, id) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = (e.clientX - rect.left + containerRef.current.scrollLeft) / zoom;
    const mouseY = (e.clientY - rect.top + containerRef.current.scrollTop) / zoom;
    const card = posMap[id];
    if (!card) return;
    const { cx, cy } = cardAbsPos(card);
    setDrag({ id, currentX: cx, currentY: cy, offsetX: mouseX - cx, offsetY: mouseY - cy });
    setDropTargetId(null);
  }, [posMap, zoom, cardAbsPos]);

  useEffect(() => {
    if (!drag) return;

    const onMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = (e.clientX - rect.left + containerRef.current.scrollLeft) / zoom;
      const mouseY = (e.clientY - rect.top + containerRef.current.scrollTop) / zoom;
      setDrag(d => ({ ...d, currentX: mouseX - d.offsetX, currentY: mouseY - d.offsetY }));
      setDropTargetId(findReparentTarget(drag.id, mouseX, mouseY));
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
            let closestId = null, closestDist = Infinity;
            sameTier.forEach(p => {
              const cp = posMap[p.id];
              if (!cp) return;
              const { cx, cy } = cardAbsPos(cp);
              const axis = isLR ? Math.abs(mouseY - cy) : Math.abs(mouseX - cx);
              const cross = isLR ? Math.abs(drag.currentX - cx) : Math.abs(drag.currentY - cy);
              if (cross < (isLR ? NODE_W * 2 : NODE_H * 2) && axis < closestDist) {
                closestDist = axis; closestId = p.id;
              }
            });
            if (closestId && closestDist < (isLR ? NODE_H * 1.5 : NODE_W * 1.5)) {
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
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [drag, findReparentTarget, positions, posMap, onReparentRequest, onReorder, zoom, isLR, cardAbsPos]);

  // Build SVG connector lines
  const lines = useMemo(() => {
    const result = [];
    positions.forEach(p => {
      if (!p.reports_to_id) return;
      const parentPos = posMap[p.reports_to_id];
      const childPos = posMap[p.id];
      if (!parentPos || !childPos) return;

      if (isLR) {
        // parent right edge → child left edge
        const px = parentPos.x + TIER_LABEL_W + PAD + NODE_W;
        const py = parentPos.y + TIER_LABEL_H + PAD;
        const cx = childPos.x + TIER_LABEL_W + PAD;
        const cy = childPos.y + TIER_LABEL_H + PAD;
        const midX = px + (cx - px) / 2;
        result.push(
          <path key={`solid-${p.reports_to_id}-${p.id}`}
            d={`M ${px} ${py} L ${midX} ${py} L ${midX} ${cy} L ${cx} ${cy}`}
            fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        );
        if (p.dotted_line_reports_to_id) {
          const dp = posMap[p.dotted_line_reports_to_id];
          if (dp) {
            const dpx = dp.x + TIER_LABEL_W + PAD + NODE_W;
            const dpy = dp.y + TIER_LABEL_H + PAD;
            const dmidX = dpx + (cx - dpx) / 2;
            result.push(
              <path key={`dotted-${p.dotted_line_reports_to_id}-${p.id}`}
                d={`M ${dpx} ${dpy} L ${dmidX} ${dpy} L ${dmidX} ${cy} L ${cx} ${cy}`}
                fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.6" />
            );
          }
        }
      } else {
        // top-down: parent bottom → child top
        const px = parentPos.x + TIER_LABEL_W + PAD;
        const py = parentPos.y + NODE_H + PAD;
        const cx = childPos.x + TIER_LABEL_W + PAD;
        const cy = childPos.y + PAD;
        const midY = py + (cy - py) / 2;
        result.push(
          <path key={`solid-${p.reports_to_id}-${p.id}`}
            d={`M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`}
            fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        );
      }
    });

    if (!isLR) {
      positions.forEach(p => {
        if (!p.dotted_line_reports_to_id) return;
        const parentPos = posMap[p.dotted_line_reports_to_id];
        const childPos = posMap[p.id];
        if (!parentPos || !childPos) return;
        const px = parentPos.x + TIER_LABEL_W + PAD;
        const py = parentPos.y + NODE_H + PAD;
        const cx = childPos.x + TIER_LABEL_W + PAD;
        const cy = childPos.y + PAD;
        const midY = py + (cy - py) / 2;
        result.push(
          <path key={`dotted-${p.dotted_line_reports_to_id}-${p.id}`}
            d={`M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`}
            fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.6" />
        );
      });
    }

    return result;
  }, [positions, posMap, isLR]);

  return (
    <div className="relative" style={{ userSelect: "none" }}>
      {/* Controls — top-right */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-card border rounded-lg shadow-sm px-1 py-0.5">
        {/* Orientation toggle */}
        <button
          onClick={() => setOrientation(o => o === "top-down" ? "left-right" : "top-down")}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${isLR ? "bg-accent text-accent-foreground" : "hover:bg-muted text-muted-foreground"}`}
          title={isLR ? "Switch to top-down" : "Switch to left-right"}
        >
          {isLR ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
          {isLR ? "L→R" : "T↓B"}
        </button>
        <div className="w-px h-4 bg-border" />
        {/* Zoom */}
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

      {/* Scrollable container */}
      <div ref={containerRef} className="overflow-auto" style={{ minHeight: canvasH * zoom + 20 }}>
        <div style={{ width: canvasW * zoom, height: canvasH * zoom, position: "relative" }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: canvasW, height: canvasH, position: "absolute", top: 0, left: 0 }}>

            {/* Top-down: horizontal tier bands */}
            {!isLR && tierRows.map((row, i) => (
              <div key={row.tier} style={{ position: "absolute", top: row.y + PAD, left: 0, width: canvasW, height: NODE_H + ROW_GAP }}
                className={i % 2 === 0 ? "bg-muted/10" : ""}>
                <div style={{ position: "absolute", top: 0, left: 0, width: TIER_LABEL_W, height: NODE_H }}
                  className="flex items-center px-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">{row.label}</p>
                </div>
              </div>
            ))}

            {/* Left-right: vertical tier column bands */}
            {isLR && tierCols.map((col, i) => (
              <div key={col.tier} style={{ position: "absolute", top: 0, left: col.x + TIER_LABEL_W + PAD, width: NODE_W + COL_GAP * 3, height: canvasH }}
                className={i % 2 === 0 ? "bg-muted/10" : ""}>
                <div style={{ position: "absolute", top: PAD / 2, left: 0, width: NODE_W + COL_GAP * 3, height: TIER_LABEL_H }}
                  className="flex items-center justify-center px-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight truncate">{col.label}</p>
                </div>
              </div>
            ))}

            {/* SVG lines */}
            <svg style={{ position: "absolute", top: 0, left: 0, width: canvasW, height: canvasH, pointerEvents: "none" }}>
              {lines}
            </svg>

            {/* Cards */}
            {positions.map(p => {
              const pos = posMap[p.id];
              if (!pos) return null;
              const { cx, cy } = cardAbsPos(pos);
              const isDragging = drag?.id === p.id;
              return (
                <NodeCard
                  key={p.id}
                  position={p}
                  absX={isDragging ? drag.currentX : cx}
                  absY={isDragging ? drag.currentY : cy}
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
                  left: drag.currentX - NODE_W / 2,
                  top: drag.currentY - NODE_H / 2,
                  width: NODE_W,
                  height: NODE_H,
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