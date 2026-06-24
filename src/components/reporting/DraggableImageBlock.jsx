import React, { useRef, useState } from 'react';
import { GripHorizontal } from 'lucide-react';

export default function DraggableImageBlock({
  section, onUpdate, children,
  positionField = 'layout',
  widthField = 'image_width',
  positionMap = { left: 'image_left', right: 'image_right', full: 'image_full' },
  defaultWidth = 50,
  dragHandle = false,
  continuousMode = false, // For charts: allows continuous horizontal positioning
}) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [ghost, setGhost] = useState(null);
  const [dropZones, setDropZones] = useState({ left: false, full: false, right: false });

  if (!onUpdate) return <>{children}</>;

  const handleMouseDown = (e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'BUTTON') return;
    e.preventDefault();
    const container = ref.current?.closest('[data-section-content]');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const imgRect = ref.current.getBoundingClientRect();

    // Account for CSS zoom on ancestor elements (live preview uses zoom to scale)
    let zoomScale = 1;
    let el = container.parentElement;
    while (el) {
      const z = window.getComputedStyle(el).zoom;
      if (z && z !== '1' && z !== 'normal' && z !== '') {
        zoomScale = parseFloat(z);
        break;
      }
      el = el.parentElement;
    }

    // Convert rendered (zoomed) coordinates to pre-zoom layout coordinates
    const containerWidth = containerRect.width / zoomScale;
    const imgHeight = imgRect.height / zoomScale;

    const computeGhost = (clientX) => {
      const dropX = (clientX - containerRect.left) / zoomScale;
      
      if (continuousMode) {
        // Continuous mode: calculate exact percentage position
        const percentX = Math.max(0, Math.min(100, (dropX / containerWidth) * 100));
        const widthPct = section[widthField] || defaultWidth;
        const w = (widthPct / 100) * containerWidth;
        return { x: dropX - w / 2, y: 0, w, h: imgHeight, zone: 'custom', percentX };
      } else {
        // Discrete zone mode (original behavior)
        const third = containerWidth / 3;
        let zone;
        if (dropX < third) zone = 'left';
        else if (dropX > third * 2) zone = 'right';
        else zone = 'full';

        const widthPct = section[widthField] || defaultWidth;
        const margin = 6;
        const gap = 8;
        const zoneWidth = (containerWidth - margin * 2 - gap * 2) / 3;
        const w = zone === 'full'
          ? containerWidth - margin * 2
          : (zoneWidth - margin);
        const x = zone === 'left'
          ? margin
          : zone === 'right'
            ? containerWidth - w - margin
            : margin + zoneWidth + gap;
        return { x, y: margin, w, h: imgHeight, zone };
      }
    };

    setDragging(true);
    setGhost(computeGhost(e.clientX));

    const onMove = (ev) => {
      const g = computeGhost(ev.clientX);
      setGhost(g);
      if (!continuousMode) {
        setDropZones({ left: g.zone === 'left', full: g.zone === 'full', right: g.zone === 'right' });
      }
    };

    const onUp = (ev) => {
      const g = computeGhost(ev.clientX);
      if (continuousMode) {
        // Save exact percentage position
        onUpdate(section.id, { [positionField]: Math.round(g.percentX) });
      } else {
        const newPosition = positionMap[g.zone];
        if (newPosition !== section[positionField]) {
          onUpdate(section.id, { [positionField]: newPosition });
        }
      }
      setDragging(false);
      setGhost(null);
      setDropZones({ left: false, full: false, right: false });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const zoneLabel = ghost?.zone === 'left' ? 'Left' : ghost?.zone === 'right' ? 'Right' : ghost?.zone === 'custom' ? `${Math.round(ghost.percentX)}%` : 'Full Width';

  return (
    <>
      <div
        ref={ref}
        onMouseDown={dragHandle ? undefined : handleMouseDown}
        className={dragHandle ? '' : (dragging ? 'opacity-20' : 'cursor-grab hover:ring-2 hover:ring-accent/40 hover:ring-offset-1 rounded-lg transition-all')}
      >
        {dragHandle && onUpdate && (
          <div
            onMouseDown={handleMouseDown}
            className="no-print relative z-20 flex items-center justify-center gap-2 py-2 mb-2 cursor-grab active:cursor-grabbing bg-accent text-white rounded-t-lg border-2 border-accent border-b-0 text-xs font-semibold select-none hover:bg-accent/90 transition-colors shadow-sm"
            title="Click and drag here to reposition the chart"
          >
            <GripHorizontal className="w-4 h-4" />
            <span>Drag here to reposition</span>
            <GripHorizontal className="w-4 h-4" />
          </div>
        )}
        {children}
      </div>
      {dragging && ghost && (
        <>
          {/* Drop zone indicators */}
          <div className="pointer-events-none absolute inset-0 z-40 flex gap-0.5">
            <div className={`flex-1 rounded border-2 border-dashed transition-colors ${ghost.zone === 'left' ? 'border-accent bg-accent/10' : 'border-muted-foreground/30 bg-muted/20'}`} />
            <div className={`flex-1 rounded border-2 border-dashed transition-colors ${ghost.zone === 'full' ? 'border-accent bg-accent/10' : 'border-muted-foreground/30 bg-muted/20'}`} />
            <div className={`flex-1 rounded border-2 border-dashed transition-colors ${ghost.zone === 'right' ? 'border-accent bg-accent/10' : 'border-muted-foreground/30 bg-muted/20'}`} />
          </div>
          {/* Ghost preview at actual snap position */}
          <div
            className="pointer-events-none absolute z-50 border-2 border-accent bg-accent/20 rounded-lg flex items-center justify-center text-xs text-accent font-semibold"
            style={{ left: ghost.x, top: ghost.y, width: ghost.w, height: ghost.h }}
          >
            {zoneLabel}
          </div>
        </>
      )}
    </>
  );
}