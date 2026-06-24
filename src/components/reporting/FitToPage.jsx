import React, { useRef, useState, useEffect } from 'react';

/**
 * When `enabled`, measures the natural height of the children and applies a
 * CSS transform scale so the content fits within `availableHeightPx`.
 * When disabled, renders children as-is (natural flow across pages).
 */
export default function FitToPage({ enabled, availableHeightPx, children }) {
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!enabled) return;
    const measure = () => {
      const el = contentRef.current;
      if (!el) return;
      const contentPx = el.offsetHeight;
      if (contentPx > availableHeightPx && contentPx > 0) {
        setScale(availableHeightPx / contentPx);
      } else {
        setScale(1);
      }
    };
    const timer = setTimeout(measure, 50);
    const ro = new ResizeObserver(measure);
    if (contentRef.current) ro.observe(contentRef.current);
    return () => { clearTimeout(timer); ro.disconnect(); };
  }, [enabled, availableHeightPx, children]);

  if (!enabled) return <>{children}</>;

  return (
    <div style={{ overflow: 'hidden', height: `${availableHeightPx}px` }}>
      <div ref={contentRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
}