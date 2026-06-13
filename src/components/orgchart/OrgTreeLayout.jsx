/**
 * Tier-aware tree layout.
 * Positions each node at a fixed vertical row determined by its tier.
 * Draws SVG connector lines between parent and child nodes.
 * Children of the same parent are spread horizontally; the parent sits
 * centred above them — but the parent's *row* is always its tier row,
 * not just one step above its children.
 */
import { useMemo, useRef, useState, useLayoutEffect } from "react";
import { User, UserX, Pencil, Trash2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  "__none__",
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
  __none__: "Unassigned",
};

const NODE_W = 150;
const NODE_H = 82;   // approximate card height
const COL_GAP = 12;  // horizontal gap between sibling subtrees
const ROW_GAP = 20;  // vertical gap between tier rows
const TIER_LABEL_W = 120;

// --- Layout engine ---
// Returns { positions: Map<id, {x,y}>, tierRows: [{tier, y}], totalWidth, totalHeight }
function computeLayout(all) {
  // Assign each position a tier rank
  const tierRank = (tier) => {
    const i = TIER_ORDER.indexOf(tier || "__none__");
    return i === -1 ? TIER_ORDER.length - 1 : i;
  };

  // Which tiers are actually used?
  const usedTiers = [...new Set(all.map(p => p.tier || "__none__"))];
  usedTiers.sort((a, b) => tierRank(a) - tierRank(b));

  // Y position for each tier band
  const tierY = {};
  usedTiers.forEach((tier, i) => {
    tierY[tier] = i * (NODE_H + ROW_GAP);
  });

  // Build adjacency
  const childrenOf = {};
  all.forEach(p => { childrenOf[p.id] = []; });
  all.forEach(p => {
    if (p.reports_to_id && childrenOf[p.reports_to_id]) {
      childrenOf[p.reports_to_id].push(p.id);
    }
  });
  const roots = all.filter(p => !p.reports_to_id || !childrenOf[p.reports_to_id] === undefined || !all.find(x => x.id === p.reports_to_id));

  // Compute subtree width (in columns) for each node
  // A "column" here is NODE_W + COL_GAP
  const subtreeWidth = {};
  function calcWidth(id) {
    const kids = childrenOf[id] || [];
    if (kids.length === 0) { subtreeWidth[id] = NODE_W; return NODE_W; }
    const total = kids.reduce((s, c, i) => s + calcWidth(c) + (i > 0 ? COL_GAP : 0), 0);
    subtreeWidth[id] = Math.max(NODE_W, total);
    return subtreeWidth[id];
  }
  roots.forEach(r => calcWidth(r.id));

  // Assign X positions via DFS
  const xPos = {};
  function assignX(id, left) {
    const kids = childrenOf[id] || [];
    if (kids.length === 0) {
      xPos[id] = left + NODE_W / 2;
      return;
    }
    // spread children
    let cursor = left;
    kids.forEach(kid => {
      assignX(kid, cursor);
      cursor += (subtreeWidth[kid] || NODE_W) + COL_GAP;
    });
    // parent centres over children
    const firstChild = kids[0];
    const lastChild = kids[kids.length - 1];
    xPos[id] = (xPos[firstChild] + xPos[lastChild]) / 2;
  }

  let cursor = 0;
  roots.forEach(r => {
    assignX(r.id, cursor);
    cursor += (subtreeWidth[r.id] || NODE_W) + COL_GAP * 2;
  });

  // Build final map
  const posMap = {};
  all.forEach(p => {
    const tier = p.tier || "__none__";
    posMap[p.id] = {
      x: xPos[p.id] ?? 0,
      y: tierY[tier] ?? 0,
    };
  });

  const totalWidth = Math.max(...Object.values(xPos).map(x => x + NODE_W / 2), 200);
  const totalHeight = Math.max(...Object.values(tierY).map(y => y + NODE_H + ROW_GAP), 200);

  const tierRows = usedTiers.map(tier => ({ tier, y: tierY[tier], label: TIER_LABELS[tier] }));

  return { posMap, tierRows, totalWidth, totalHeight };
}

// --- Card component (absolutely positioned) ---
function NodeCard({ position, x, y, originalPositions, isScenario, showSalary, showNames, onEdit, onDelete, draggingId, onDragStart, onDragOver, onDrop }) {
  let isChanged = false;
  if (isScenario && originalPositions?.length > 0) {
    const orig = originalPositions.find(o => o.id === (position.original_id || position.id));
    if (!orig) isChanged = true;
    else isChanged = orig.title !== position.title || orig.person_name !== position.person_name || orig.salary !== position.salary || orig.reports_to_id !== position.reports_to_id;
  }

  const isDragging = draggingId === position.id;

  let borderClass = "border-border bg-card shadow-sm";
  if (position.is_vacant) borderClass = "border-dashed border-muted-foreground/40 bg-muted/20";
  else if (isScenario && isChanged) borderClass = "border-orange-400 bg-orange-50/50";
  else if (isScenario) borderClass = "border-blue-300 bg-card shadow-sm";

  return (
    <div
      style={{ position: "absolute", left: x - NODE_W / 2, top: y, width: NODE_W }}
      className={`group border-2 rounded-xl p-2.5 text-center transition-all cursor-default select-none ${borderClass} ${isDragging ? "opacity-40" : ""}`}
      draggable={isScenario}
      onDragStart={isScenario ? (e) => { e.dataTransfer.effectAllowed = "move"; onDragStart?.(position.id); } : undefined}
      onDragOver={isScenario ? (e) => { e.preventDefault(); onDragOver?.(position.id); } : undefined}
      onDrop={isScenario ? (e) => { e.preventDefault(); onDrop?.(position.id); } : undefined}
    >
      {isScenario && <GripVertical className="w-3 h-3 text-muted-foreground/20 absolute top-1 left-1 cursor-grab" />}
      {isScenario && isChanged && <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-orange-400 border-2 border-white" />}
      <div className="flex justify-center mb-0.5">
        {position.is_vacant ? <UserX className="w-5 h-5 text-muted-foreground/50" /> : <User className="w-5 h-5 text-accent" />}
      </div>
      <p className="text-xs font-semibold leading-tight truncate">{position.title}</p>
      {showNames && position.person_name && <p className="text-[10px] text-muted-foreground truncate">{position.person_name}</p>}
      {position.department && <p className="text-[10px] text-muted-foreground/60 truncate">{position.department}</p>}
      {position.is_vacant && <Badge variant="outline" className="text-[10px] mt-0.5 px-1">Vacant</Badge>}
      {showSalary && position.salary > 0 && <p className="text-[10px] text-muted-foreground">${position.salary.toLocaleString()}</p>}
      <div className="absolute -top-2 -right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onEdit && <button className="w-5 h-5 bg-background border rounded-full flex items-center justify-center shadow-sm" onClick={() => onEdit(position)}><Pencil className="w-2.5 h-2.5" /></button>}
        {onDelete && <button className="w-5 h-5 bg-background border rounded-full flex items-center justify-center shadow-sm" onClick={() => onDelete(position.id)}><Trash2 className="w-2.5 h-2.5 text-destructive" /></button>}
      </div>
    </div>
  );
}

export default function OrgTreeLayout({ positions, originalPositions = [], isScenario, showSalary, showNames, onEdit, onDelete, draggingId, onDragStart, onDragOver, onDrop, onDropToRoot }) {
  const { posMap, tierRows, totalWidth, totalHeight } = useMemo(() => computeLayout(positions), [positions]);

  const LABEL_W = TIER_LABEL_W;
  const PAD = 24;
  const svgW = totalWidth + LABEL_W + PAD * 2;
  const svgH = totalHeight + NODE_H + PAD * 2;

  // Build SVG connector lines: parent bottom-centre → child top-centre
  const lines = [];
  positions.forEach(p => {
    if (!p.reports_to_id) return;
    const parent = posMap[p.reports_to_id];
    const child = posMap[p.id];
    if (!parent || !child) return;
    const px = parent.x + LABEL_W + PAD;
    const py = parent.y + NODE_H + PAD;
    const cx = child.x + LABEL_W + PAD;
    const cy = child.y + PAD;
    const midY = py + (cy - py) / 2;
    lines.push(
      <path
        key={`solid-${p.reports_to_id}-${p.id}`}
        d={`M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`}
        fill="none" stroke="hsl(var(--border))" strokeWidth="1.5"
      />
    );
  });

  // Dotted-line connectors
  positions.forEach(p => {
    if (!p.dotted_line_reports_to_id) return;
    const parent = posMap[p.dotted_line_reports_to_id];
    const child = posMap[p.id];
    if (!parent || !child) return;
    const px = parent.x + LABEL_W + PAD;
    const py = parent.y + NODE_H + PAD;
    const cx = child.x + LABEL_W + PAD;
    const cy = child.y + PAD;
    const midY = py + (cy - py) / 2;
    lines.push(
      <path
        key={`dotted-${p.dotted_line_reports_to_id}-${p.id}`}
        d={`M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`}
        fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.6"
      />
    );
  });

  return (
    <div
      className="relative overflow-auto"
      style={{ minHeight: svgH + 20 }}
      onDragEnd={() => { onDragStart?.(null); }}
    >
      {/* Drop zone for root promotion */}
      {isScenario && draggingId && (
        <div
          className="sticky top-0 z-20 mx-4 mb-2 h-9 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center text-xs text-muted-foreground bg-background/80"
          onDragOver={e => e.preventDefault()}
          onDrop={onDropToRoot}
        >
          Drop here to make top-level
        </div>
      )}

      <div className="relative" style={{ width: svgW, height: svgH }}>
        {/* Tier row bands */}
        {tierRows.map((row, i) => (
          <div
            key={row.tier}
            style={{ position: "absolute", top: row.y + PAD, left: 0, width: svgW, height: NODE_H + ROW_GAP }}
            className={i % 2 === 0 ? "bg-muted/10" : ""}
          >
            <div
              style={{ position: "absolute", top: 0, left: 0, width: LABEL_W, height: NODE_H }}
              className="flex items-center px-3"
            >
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">{row.label}</p>
            </div>
          </div>
        ))}

        {/* SVG connector lines */}
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: svgW, height: svgH, pointerEvents: "none" }}
        >
          {lines}
        </svg>

        {/* Nodes */}
        {positions.map(p => {
          const pos = posMap[p.id];
          if (!pos) return null;
          return (
            <NodeCard
              key={p.id}
              position={p}
              x={pos.x + LABEL_W + PAD}
              y={pos.y + PAD}
              originalPositions={originalPositions}
              isScenario={isScenario}
              showSalary={showSalary}
              showNames={showNames}
              onEdit={onEdit}
              onDelete={onDelete}
              draggingId={draggingId}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          );
        })}
      </div>
    </div>
  );
}