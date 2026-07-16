import { useState, useRef, useCallback } from "react";
import { DAYS, START_HOUR, END_HOUR, HOUR_HEIGHT, CATEGORIES, categoryColor, formatHour, snapToInterval, createEmptyBlock } from "@/lib/scheduleConstants";
import ScheduleBlockDialog from "@/components/ed/ScheduleBlockDialog";
import { Plus } from "lucide-react";

const totalHours = END_HOUR - START_HOUR;
const gridHeight = totalHours * HOUR_HEIGHT;

export default function ScheduleGrid({ blocks, onBlocksChange }) {
  const [dragState, setDragState] = useState(null); // { mode: 'create'|'move'|'resize', blockId, startY, origStart, origEnd, origDay }
  const [editingBlock, setEditingBlock] = useState(null);
  const gridRefs = useRef({});

  const pxToHour = useCallback((px) => snapToInterval(px / HOUR_HEIGHT + START_HOUR), []);

  const handleDayMouseDown = (e, dayOfWeek) => {
    const rect = gridRefs.current[dayOfWeek]?.getBoundingClientRect();
    if (!rect) return;
    const startY = e.clientY - rect.top;
    const startHour = pxToHour(startY);
    if (startHour >= END_HOUR) return;

    const newBlock = { ...createEmptyBlock(dayOfWeek), start_hour: startHour, end_hour: Math.min(startHour + 1, END_HOUR) };
    setDragState({ mode: "create", blockId: newBlock.id, startY, origStart: startHour, origEnd: startHour + 1, dayOfWeek });
    onBlocksChange([...blocks, newBlock]);
    e.preventDefault();
  };

  const handleBlockMouseDown = (e, blockId, mode) => {
    e.stopPropagation();
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    setDragState({
      mode,
      blockId,
      startY: e.clientY,
      origStart: block.start_hour,
      origEnd: block.end_hour,
      origDay: block.day_of_week,
    });
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragState) return;
    const deltaHours = snapToInterval((e.clientY - dragState.startY) / HOUR_HEIGHT);

    onBlocksChange(blocks.map(b => {
      if (b.id !== dragState.blockId) return b;
      if (dragState.mode === "create" || dragState.mode === "resize") {
        const newEnd = Math.min(END_HOUR, Math.max(dragState.origStart + 0.5, dragState.origEnd + deltaHours));
        return { ...b, end_hour: newEnd };
      }
      if (dragState.mode === "move") {
        const duration = dragState.origEnd - dragState.origStart;
        let newStart = Math.max(START_HOUR, Math.min(END_HOUR - duration, dragState.origStart + deltaHours));
        return { ...b, start_hour: newStart, end_hour: newStart + duration };
      }
      return b;
    }));
  }, [dragState, blocks, onBlocksChange]);

  const handleMouseUp = useCallback(() => {
    if (!dragState) return;
    if (dragState.mode === "create") {
      const block = blocks.find(b => b.id === dragState.blockId);
      if (block) setEditingBlock(block);
    }
    setDragState(null);
  }, [dragState, blocks]);

  // Attach global listeners when dragging
  if (dragState) {
    document.body.style.cursor = dragState.mode === "resize" ? "ns-resize" : "grabbing";
    document.body.style.userSelect = "none";
  } else {
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  const handleSaveBlock = (updated) => {
    onBlocksChange(blocks.map(b => b.id === updated.id ? updated : b));
    setEditingBlock(null);
  };
  const handleDeleteBlock = (toDelete) => {
    onBlocksChange(blocks.filter(b => b.id !== toDelete.id));
  };

  const hourLines = [];
  for (let h = 0; h <= totalHours; h++) hourLines.push(h);

  return (
    <>
      <div
        className="relative flex border rounded-lg overflow-hidden bg-background"
        onMouseMove={dragState ? handleMouseMove : undefined}
        onMouseUp={dragState ? handleMouseUp : undefined}
        onMouseLeave={dragState ? handleMouseUp : undefined}
      >
        {/* Time column */}
        <div className="w-14 shrink-0 border-r bg-muted/30">
          <div className="h-8 border-b" />
          {Array.from({ length: totalHours }).map((_, i) => (
            <div key={i} className="text-[10px] text-muted-foreground text-right pr-1.5 pt-0.5" style={{ height: HOUR_HEIGHT }}>
              {formatHour(START_HOUR + i)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map(day => (
          <div key={day.value} className="flex-1 min-w-0 border-r last:border-r-0 relative">
            <div className="h-8 border-b flex items-center justify-center text-xs font-semibold">
              <span className="hidden sm:inline">{day.label}</span>
              <span className="sm:hidden">{day.short}</span>
            </div>
            <div
              ref={el => { gridRefs.current[day.value] = el; }}
              className="relative"
              style={{ height: gridHeight }}
              onMouseDown={(e) => handleDayMouseDown(e, day.value)}
            >
              {hourLines.map(h => (
                <div key={h} className="absolute left-0 right-0 border-t border-border/40" style={{ top: h * HOUR_HEIGHT }} />
              ))}
              {/* Render blocks for this day */}
              {blocks.filter(b => b.day_of_week === day.value).map(block => {
                const top = (block.start_hour - START_HOUR) * HOUR_HEIGHT;
                const height = (block.end_hour - block.start_hour) * HOUR_HEIGHT;
                const color = block.color || categoryColor(block.category);
                return (
                  <div
                    key={block.id}
                    className="absolute left-0.5 right-0.5 rounded-md p-1 text-[10px] overflow-hidden cursor-grab active:cursor-grabbing border shadow-sm group"
                    style={{
                      top,
                      height: Math.max(height, 16),
                      background: color + "30",
                      borderColor: color,
                      borderLeftWidth: 3,
                    }}
                    onMouseDown={(e) => handleBlockMouseDown(e, block.id, "move")}
                    onClick={(e) => { e.stopPropagation(); if (!dragState) setEditingBlock(block); }}
                  >
                    <div className="font-semibold truncate" style={{ color: color }}>{block.title || "Untitled"}</div>
                    <div className="text-muted-foreground truncate">{formatHour(block.start_hour)}–{formatHour(block.end_hour)}</div>
                    {block.location && <div className="truncate text-muted-foreground/70">{block.location}</div>}
                    {/* Resize handle */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-60"
                      style={{ background: color }}
                      onMouseDown={(e) => handleBlockMouseDown(e, block.id, "resize")}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap gap-2 mt-3">
        {CATEGORIES.map(c => (
          <div key={c.value} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded" style={{ background: c.color + "60", border: `1px solid ${c.color}` }} />
            {c.label}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
        <Plus className="w-3 h-3" /> Click and drag on the grid to create a block. Click a block to edit. Drag to move, use the bottom edge to resize.
      </p>

      {editingBlock && (
        <ScheduleBlockDialog
          block={editingBlock}
          onSave={handleSaveBlock}
          onDelete={handleDeleteBlock}
          onClose={() => setEditingBlock(null)}
        />
      )}
    </>
  );
}