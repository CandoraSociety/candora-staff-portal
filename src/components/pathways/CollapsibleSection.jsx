import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function CollapsibleSection({ title, count = 0, defaultOpen = false, accentColor, variant = 'sub', forceOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  const isMain = variant === 'main';
  // forceOpen (e.g. while a search is active) keeps the section expanded so
  // matching rows are always visible, regardless of the user's toggle state.
  const isOpen = forceOpen || open;

  const headerStyle = isMain
    ? { background: accentColor || 'hsl(231,64%,20%)' }
    : { background: accentColor ? `${accentColor}1a` : 'hsl(231,64%,20%,0.06)' };

  const titleColor = isMain
    ? '#fff'
    : accentColor || 'hsl(231,64%,20%)';

  const countBg = isMain
    ? 'rgba(255,255,255,0.2)'
    : accentColor ? `${accentColor}22` : 'rgba(43,45,232,0.12)';
  const countColor = isMain ? '#fff' : (accentColor || '#2b2de8');

  return (
    <div className="rounded-lg overflow-hidden border border-slate-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 transition-colors hover:brightness-95"
        style={headerStyle}
      >
        {isOpen
          ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: titleColor }} />
          : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: titleColor }} />}
        <span className={`font-semibold ${isMain ? 'text-base' : 'text-sm'}`} style={{ color: titleColor }}>{title}</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: countBg, color: countColor }}
        >
          {count}
        </span>
      </button>
      {isOpen && <div className="p-3 bg-white">{children}</div>}
    </div>
  );
}