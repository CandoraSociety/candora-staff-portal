import { useId, useEffect, useState } from 'react';

// The docked training sidebar stays fully visible (not dimmed by the spotlight)
// while a tour window is open, so learners can still jump between modules and
// steps mid-tour.
function useTrainingSidebarRect() {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector('[data-training-sidebar]');
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect(r.width && r.height ? { left: r.left, top: r.top, width: r.width, height: r.height } : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    const el = document.querySelector('[data-training-sidebar]');
    if (el) observer.observe(el);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  return rect;
}

export default function SpotlightOverlay({ rect }) {
  const maskId = useId().replace(/:/g, '');
  const regions = rect ? rect.regions || [rect] : [];
  const sidebar = useTrainingSidebarRect();
  return (
    <svg className="fixed inset-0 z-[98] h-full w-full pointer-events-none" aria-hidden="true">
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
          <rect width="100%" height="100%" fill="white" />
          {regions.map((region, index) => (
            <rect key={index} x={region.left - 8} y={region.top - 8} width={region.width + 16} height={region.height + 16} rx="14" fill="black" />
          ))}
          {sidebar && (
            <rect x={sidebar.left - 4} y={sidebar.top - 4} width={sidebar.width + 8} height={sidebar.height + 8} rx="16" fill="black" />
          )}
        </mask>
      </defs>
      <rect width="100%" height="100%" className="fill-sidebar/75" mask={`url(#${maskId})`} />
      {regions.map((region, index) => (
        <rect key={index} x={region.left - 8} y={region.top - 8} width={region.width + 16} height={region.height + 16} rx="14" fill="none" className="stroke-primary" strokeWidth="2" />
      ))}
    </svg>
  );
}