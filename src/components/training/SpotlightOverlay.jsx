import { useId } from 'react';

export default function SpotlightOverlay({ rect }) {
  const maskId = useId().replace(/:/g, '');
  const regions = rect ? rect.regions || [rect] : [];
  return (
    <svg className="fixed inset-0 z-[98] h-full w-full pointer-events-none" aria-hidden="true">
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
          <rect width="100%" height="100%" fill="white" />
          {regions.map((region, index) => (
            <rect key={index} x={region.left - 8} y={region.top - 8} width={region.width + 16} height={region.height + 16} rx="14" fill="black" />
          ))}
        </mask>
      </defs>
      <rect width="100%" height="100%" className="fill-sidebar/75" mask={`url(#${maskId})`} />
      {regions.map((region, index) => (
        <rect key={index} x={region.left - 8} y={region.top - 8} width={region.width + 16} height={region.height + 16} rx="14" fill="none" className="stroke-primary" strokeWidth="2" />
      ))}
    </svg>
  );
}