import React, { useRef, useState, useLayoutEffect } from 'react';

/**
 * Renders a Table of Contents that scales to fill the available page space —
 * scaling up when there are few entries, down when there are many.
 */
export default function ScaledTOC({ sections, branding, getPage, containerHeight = '11in', padding = '2.5rem', maxScale = 1.6 }) {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const measure = () => {
      if (!wrapperRef.current || !contentRef.current) return;
      const available = wrapperRef.current.clientHeight;
      const needed = contentRef.current.scrollHeight;
      if (needed > 0) {
        const s = available / needed;
        setScale(Math.min(maxScale, Math.max(0.3, s)));
      } else {
        setScale(maxScale);
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
  }, [sections, containerHeight, padding, maxScale]);

  const pc = branding?.primary_color || '#1a2744';
  const sc = branding?.secondary_color || '#3b5998';
  const ac = branding?.accent_color || '#2b2de8';
  const gold = '#c8952e';

  return (
    <div style={{ height: containerHeight, padding, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Title */}
      <div className="shrink-0" style={{ marginBottom: '1.25rem' }}>
        <h3 className="font-heading font-bold" style={{ color: pc, fontSize: '1.6rem', lineHeight: 1.1 }}>
          Table of Contents
        </h3>
      </div>

      {/* Scaled entries — fills remaining space */}
      <div ref={wrapperRef} style={{ flex: 1, overflow: 'hidden' }}>
        <div
          ref={contentRef}
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${100 / scale}%` }}
          className="space-y-2.5"
        >
          {sections.map((s, i) => {
            const isAlt = i % 2 === 1;
            return (
              <div
                key={s.id}
                className="flex items-center rounded-lg"
                style={{
                  backgroundColor: isAlt ? `${pc}06` : 'transparent',
                  borderLeft: `3px solid ${i % 3 === 0 ? gold : i % 3 === 1 ? ac : pc}`,
                  padding: '0.6rem 0.85rem',
                }}
              >
                {/* Number badge */}
                <div
                  className="shrink-0 flex items-center justify-center font-bold tabular-nums"
                  style={{
                    width: '2.2em',
                    height: '2.2em',
                    borderRadius: '50%',
                    backgroundColor: pc,
                    color: '#fff',
                    fontSize: '0.8em',
                    marginRight: '0.85rem',
                  }}
                >
                  {i + 1}
                </div>
                {/* Title */}
                <span className="flex-1 font-medium" style={{ color: pc, fontSize: '0.95em' }}>
                  {s.title || 'Untitled'}
                </span>
                {/* Dotted leader */}
                <span className="flex-1 mx-3 border-b border-dotted self-center" style={{ borderColor: `${ac}40` }} />
                {/* Page number pill */}
                <span
                  className="shrink-0 font-semibold tabular-nums"
                  style={{
                    color: pc,
                    backgroundColor: `${gold}18`,
                    border: `1px solid ${gold}50`,
                    borderRadius: '0.375rem',
                    padding: '0.15em 0.6em',
                    fontSize: '0.8em',
                  }}
                >
                  {getPage(i)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}