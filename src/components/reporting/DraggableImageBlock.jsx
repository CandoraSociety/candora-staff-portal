import React, { useRef, useState } from 'react';

export default function DraggableImageBlock({
  section, onUpdate, children,
  positionField = 'layout',
  widthField = 'image_width',
  positionMap = { left: 'image_left', right: 'image_right', full: 'image_full' },
  defaultWidth = 50,
}) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [ghost, setGhost] = useState(null);

  if (!onUpdate) return <>{children}</>;

  const handleMouseDown = (e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'BUTTON') return;
    e.preventDefault();
    const container = ref.current?.closest('[data-section-content]');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const imgRect = ref.current.getBoundingClientRect();

    const computeGhost = (clientX) => {
      const dropX = clientX - containerRect.left;
      const third = containerRect.width / 3;
      let zone;
      if (dropX < third) zone = 'left';
      else if (dropX > third * 2) zone = 'right';
      else zone = 'full';

      const widthPct = section[widthField] || defaultWidth;
      const margin = 4;
      const w = zone === 'full'
        ? containerRect.width - margin * 2
        : (containerRect.width * widthPct / 100);
      const x = zone === 'right'
        ? containerRect.width - w - margin
        : margin;
      return { x, y: margin, w, h: imgRect.height, zone };
    };

    setDragging(true);
    setGhost(computeGhost(e.clientX));

    const onMove = (ev) => {
      setGhost(computeGhost(ev.clientX));
    };

    const onUp = (ev) => {
      const g = computeGhost(ev.clientX);
      const newPosition = positionMap[g.zone];
      if (newPosition !== section[positionField]) {
        onUpdate(section.id, { [positionField]: newPosition });
      }
      setDragging(false);
      setGhost(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const zoneLabel = ghost?.zone === 'left' ? 'Left' : ghost?.zone === 'right' ? 'Right' : 'Full Width';

  return (
    <>
      <div
        ref={ref}
        onMouseDown={handleMouseDown}
        className={dragging ? 'opacity-20' : 'cursor-grab hover:ring-2 hover:ring-accent/40 hover:ring-offset-1 rounded-lg transition-all'}
      >
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