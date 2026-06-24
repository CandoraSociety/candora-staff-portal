import { useState, useRef, useEffect } from 'react';

// Standard letter-width design reference: 8.5" at 96 DPI
const DESIGN_WIDTH = 816;

/**
 * Measures the cover container width and returns a scale factor
 * relative to the design width. Overlay pixel values (w, h, font_size)
 * should be multiplied by this scale so they render at the same
 * proportion regardless of the container's actual on-screen width.
 */
export function useCoverScale() {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.offsetWidth / DESIGN_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, scale];
}