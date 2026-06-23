import React, { useRef, useState, useLayoutEffect } from 'react';

/**
 * Renders a Table of Contents that scales down to fit within a fixed-height page.
 * Measures the natural content height and applies a CSS transform: scale() when
 * the content would overflow the available space.
 */
export default function ScaledTOC({ sections, branding, getPage, containerHeight = '11in', padding = '2.5rem', titleClass = 'text-lg', entryClass = 'text-sm', gapClass = 'space-y-3', titleMargin = 'mb-10' }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const measure = () => {
      if (!containerRef.current || !contentRef.current) return;
      const available = contentRef.current.parentElement.clientHeight;
      const needed = contentRef.current.scrollHeight;
      if (needed > 0 && needed > available) {
        setScale(Math.min(1, available / needed));
      } else {
        setScale(1);
      }
    };
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, [sections, containerHeight, padding]);

  const pc = branding?.primary_color || '#1a2744';
  const sc = branding?.secondary_color || '#3b5998';
  const ac = branding?.accent_color || '#2b2de8';

  return (
    <div ref={containerRef} style={{ height: containerHeight, padding, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <h3 className={`${titleClass} font-heading font-bold uppercase tracking-wider ${titleMargin} shrink-0`} style={{ color: pc }}>
        Table of Contents
      </h3>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div
          ref={contentRef}
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${100 / scale}%` }}
          className={gapClass}
        >
          {sections.map((s, i) => (
            <div key={s.id} className={`flex items-baseline ${entryClass}`} style={{ color: sc }}>
              <span className="font-bold mr-3 shrink-0" style={{ color: pc }}>{i + 1}.</span>
              <span className="flex-1">{s.title || 'Untitled'}</span>
              <span className="flex-1 mx-2 border-b border-dotted" style={{ borderColor: `${ac}40` }} />
              <span className="shrink-0 font-medium tabular-nums" style={{ color: pc }}>{getPage(i)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}