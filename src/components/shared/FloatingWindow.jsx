import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Minus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/**
 * FloatingWindow — a desktop-style floating window:
 * - drag by the title bar (pointer-based)
 * - resize from the right edge, bottom edge, or bottom-right corner
 * - minimize (collapse to the title bar), maximize/restore (fill the screen), close
 * - double-click the title bar to toggle maximize
 */
export default function FloatingWindow({
  open,
  onClose,
  title,
  toolbar,
  children,
  initialWidth = 900,
  initialHeight = 620,
  minWidth = 420,
  minHeight = 260,
}) {
  const [pos, setPos] = useState(null);
  const [size, setSize] = useState({ w: initialWidth, h: initialHeight });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const restoreRef = useRef(null);

  useEffect(() => {
    if (open) {
      const w = Math.min(initialWidth, window.innerWidth - 24);
      const h = Math.min(initialHeight, window.innerHeight - 24);
      setSize({ w, h });
      setPos({ x: Math.max(8, (window.innerWidth - w) / 2), y: Math.max(8, (window.innerHeight - h) / 2) });
      setMinimized(false);
      setMaximized(false);
    } else {
      setPos(null);
    }
  }, [open]);

  const startDrag = (e) => {
    if (maximized) return;
    if (e.button !== 0) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const origin = { ...pos };
    const move = (ev) => {
      setPos({
        x: clamp(origin.x + ev.clientX - startX, 0, window.innerWidth - 80),
        y: clamp(origin.y + ev.clientY - startY, 0, window.innerHeight - 40),
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const toggleMaximize = () => {
    if (maximized) {
      setMaximized(false);
      if (restoreRef.current) {
        setPos(restoreRef.current.pos);
        setSize(restoreRef.current.size);
      }
    } else {
      restoreRef.current = { pos: { ...pos }, size: { ...size } };
      setMinimized(false);
      setMaximized(true);
    }
  };

  const startResize = (dirs) => (e) => {
    if (maximized) return;
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const origin = { w: size.w, h: size.h, x: pos.x, y: pos.y };
    const move = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setSize({
        w: clamp(origin.w + (dirs.includes('e') ? dx : 0), minWidth, window.innerWidth - origin.x - 8),
        h: clamp(origin.h + (dirs.includes('s') ? dy : 0), minHeight, window.innerHeight - origin.y - 8),
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  if (!open || !pos) return null;

  const windowStyle = maximized
    ? { left: 8, top: 8, width: 'calc(100vw - 16px)', height: 'calc(100vh - 16px)' }
    : { left: pos.x, top: pos.y, width: size.w, height: minimized ? 'auto' : size.h };

  return (
    <div
      className="fixed z-[100] flex flex-col rounded-lg border border-border bg-card shadow-2xl overflow-hidden select-none"
      style={windowStyle}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-3 h-10 shrink-0 border-b border-border bg-secondary/60 cursor-move"
        onPointerDown={startDrag}
        onDoubleClick={() => !minimized && toggleMaximize()}
      >
        <div className="flex-1 truncate text-sm font-medium pointer-events-none">{title}</div>
        {toolbar && !minimized && (
          <div className="flex items-center gap-1.5 pointer-events-auto" onPointerDown={e => e.stopPropagation()}>
            {toolbar}
          </div>
        )}
        <div className="flex items-center gap-0.5" onPointerDown={e => e.stopPropagation()}>
          <button
            className="p-1.5 rounded hover:bg-accent hover:text-accent-foreground"
            onClick={() => setMinimized(m => !m)}
            title={minimized ? 'Restore window' : 'Minimize'}
          >
            {minimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </button>
          <button
            className={cn('p-1.5 rounded hover:bg-accent hover:text-accent-foreground', minimized && 'hidden')}
            onClick={toggleMaximize}
            title={maximized ? 'Restore' : 'Maximize (fill screen)'}
          >
            {maximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            className="p-1.5 rounded hover:bg-destructive hover:text-destructive-foreground"
            onClick={onClose}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!minimized && (
        <div className="flex-1 min-h-0 relative">
          {children}
          {/* Right edge resize */}
          <div className="absolute top-0 right-0 bottom-4 w-1.5 cursor-e-resize" onPointerDown={startResize(['e'])} />
          {/* Bottom edge resize */}
          <div className="absolute bottom-0 left-0 right-4 h-1.5 cursor-s-resize" onPointerDown={startResize(['s'])} />
          {/* Bottom-right corner resize */}
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" onPointerDown={startResize(['e', 's'])}>
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-muted-foreground/50" />
          </div>
        </div>
      )}
    </div>
  );
}