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
  const gold = branding?.accent_color || '#c8952e';

  return (
    <div style={{ height: containerHeight, padding, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Decorative top accent bar */}
      <div className="shrink-0" style={{ height: 4, background: `linear-gradient(90deg, ${pc} 0%, ${ac} 50%, transparent 100%)`, borderRadius: 2, marginBottom: '2rem' }} />

      {/* Title block */}
      <div className="shrink-0" style={{ marginBottom: '1.5rem' }}>
        <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
          <div style={{ width: 32, height: 3, backgroundColor: gold, borderRadius: 2 }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: ac }}>Index</span>
        </div>
        <h3 className="font-heading font-bold" style={{ color: pc, fontSize: '1.75rem', lineHeight: 1.1, marginBottom: '0.25rem' }}>
          Table of Contents
        </h3>
        <p className="text-xs italic" style={{ color: sc, opacity: 0.7 }}>
          {sections.length} {sections.length === 1 ? 'section' : 'sections'}
        </p>
      </div>

      {/* Scaled entries — fills remaining space */}
      <div ref={wrapperRef} style={{ flex: 1, overflow: 'hidden' }}>
        <div
          ref={contentRef}
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${100 / scale}%` }}
          className="space-y-2"
        >
          {sections.map((s, i) => (
            <div key={s.id} className="flex items-baseline" style={{ color: sc }}>
              <span
                className="font-bold shrink-0 text-right tabular-nums"
                style={{ color: pc, width: '2.5em', marginRight: '0.75rem' }}
              >
                {i + 1}.
              </span>
              <span className="flex-1 font-medium" style={{ color: pc }}>{s.title || 'Untitled'}</span>
              <span className="flex-1 mx-3 border-b border-dotted self-end" style={{ borderColor: `${ac}50`, marginBottom: '0.2em' }} />
              <span className="shrink-0 font-medium tabular-nums" style={{ color: pc, width: '2em', textAlign: 'right' }}>{getPage(i)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative bottom accent */}
      <div className="shrink-0" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${pc}30, transparent)` }} />
        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: gold }} />
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${pc}30, transparent)` }} />
      </div>
    </div>
  );
}