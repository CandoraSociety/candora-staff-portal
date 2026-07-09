import { useState, useRef, useCallback, useEffect } from 'react';

const DRAG_THRESHOLD = 5; // px — must move this far to count as drag, not click

/**
 * Makes a fixed-position element draggable via pointer events.
 * Position persists to localStorage. Distinguishes click from drag
 * so onClick still works normally on a simple click.
 *
 * @param {string} storageKey - localStorage key for position persistence
 * @param {{ bottom: number, right: number }} defaultPosition - initial position in px
 * @returns {{ pos, onPointerDown, wasDragged, isDragging }}
 */
export function useDraggableButton(storageKey, defaultPosition = { bottom: 80, right: 16 }) {
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.bottom === 'number' && typeof parsed.right === 'number') return parsed;
      }
    } catch { /* ignore */ }
    return defaultPosition;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ moved: false });

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(pos)); } catch { /* ignore */ }
  }, [pos, storageKey]);

  const onPointerDown = useCallback((e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = e.currentTarget;
    const w = el.offsetWidth || 50;
    const h = el.offsetHeight || 50;

    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...pos },
      moved: false,
      w,
      h,
    };

    const onMove = (ev) => {
      const ds = dragState.current;
      if (!ds) return;
      const dx = ev.clientX - ds.startX;
      const dy = ev.clientY - ds.startY;
      if (!ds.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        ds.moved = true;
        setIsDragging(true);
      }
      if (ds.moved) {
        const newRight = ds.startPos.right - dx;
        const newBottom = ds.startPos.bottom - dy;
        const clampedRight = Math.max(0, Math.min(window.innerWidth - ds.w, newRight));
        const clampedBottom = Math.max(0, Math.min(window.innerHeight - ds.h, newBottom));
        setPos({ right: clampedRight, bottom: clampedBottom });
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setIsDragging(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [pos]);

  /** Call in onClick — returns true if the pointer interaction was a drag (so you can skip the click action). */
  const wasDragged = useCallback(() => {
    const moved = dragState.current.moved;
    dragState.current.moved = false;
    return moved;
  }, []);

  return { pos, onPointerDown, wasDragged, isDragging };
}