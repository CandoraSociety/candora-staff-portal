import { useEffect, useRef, useState } from 'react';

const constrain = (x, y, rect) => ({
  left: Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)),
  top: Math.max(8, Math.min(y, window.innerHeight - rect.height - 8)),
});

export default function useTrainingWindowDrag(open, resetKey) {
  const ref = useRef(null);
  const origin = useRef(null);
  const [position, setPosition] = useState(null);
  useEffect(() => { setPosition(null); origin.current = null; }, [open, resetKey]);
  useEffect(() => {
    if (!open || !position || !ref.current) return;
    const keepVisible = () => setPosition(previous => {
      if (!previous || !ref.current) return previous;
      const next = constrain(previous.left, previous.top, ref.current.getBoundingClientRect());
      return next.left === previous.left && next.top === previous.top ? previous : next;
    });
    const observer = new ResizeObserver(keepVisible);
    observer.observe(ref.current);
    window.addEventListener('resize', keepVisible);
    return () => { observer.disconnect(); window.removeEventListener('resize', keepVisible); };
  }, [open, !!position]);
  const finish = () => { origin.current = null; };
  const handleProps = {
    title: 'Drag to move this training window',
    onPointerDown: event => {
      if (event.button !== 0 || event.target.closest('button, a, input, select, textarea')) return;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      origin.current = { x: event.clientX, y: event.clientY, rect };
    },
    onPointerMove: event => {
      const start = origin.current;
      if (start) setPosition(constrain(start.rect.left + event.clientX - start.x, start.rect.top + event.clientY - start.y, ref.current.getBoundingClientRect()));
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onLostPointerCapture: finish,
  };
  return { ref, handleProps, style: position ? { ...position, right: 'auto', bottom: 'auto', transform: 'none' } : {} };
}