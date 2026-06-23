import React, { useRef, useState } from 'react';

export default function DraggableImageBlock({ section, onUpdate, children }) {
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
    const grabOffsetX = e.clientX - imgRect.left;
    const grabOffsetY = e.clientY - imgRect.top;

    setDragging(true);
    setGhost({
      x: imgRect.left - containerRect.left,
      y: imgRect.top - containerRect.top,
      w: imgRect.width,
      h: imgRect.height,
    });

    const onMove = (ev) => {
      const margin = 4;
      let x = ev.clientX - containerRect.left - grabOffsetX;
      let y = ev.clientY - containerRect.top - grabOffsetY;
      x = Math.max(margin, Math.min(x, containerRect.width - imgRect.width - margin));
      y = Math.max(margin, Math.min(y, containerRect.height - imgRect.height - margin));
      setGhost({ x, y, w: imgRect.width, h: imgRect.height });
    };

    const onUp = (ev) => {
      const dropX = ev.clientX - containerRect.left;
      const third = containerRect.width / 3;
      let newLayout;
      if (dropX < third) newLayout = 'image_left';
      else if (dropX > third * 2) newLayout = 'image_right';
      else newLayout = 'image_full';
      if (newLayout !== section.layout) {
        onUpdate(section.id, { layout: newLayout });
      }
      setDragging(false);
      setGhost(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <>
      <div
        ref={ref}
        onMouseDown={handleMouseDown}
        className={dragging ? 'opacity-30' : 'cursor-grab hover:ring-2 hover:ring-accent/40 hover:ring-offset-1 rounded-lg transition-all'}
      >
        {children}
      </div>
      {dragging && ghost && (
        <div
          className="pointer-events-none absolute z-50 border-2 border-dashed border-accent bg-accent/10 rounded-lg flex items-center justify-center text-xs text-accent font-medium"
          style={{ left: ghost.x, top: ghost.y, width: ghost.w, height: ghost.h }}
        >
          Drop to reposition
        </div>
      )}
    </>
  );
}