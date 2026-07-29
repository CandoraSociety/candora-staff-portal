import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function CollapsibleSection({ title, count = 0, defaultOpen = false, accentColor, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-slate-50"
        style={accentColor ? { borderLeft: `3px solid ${accentColor}` } : {}}
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
        <span className="font-semibold text-sm" style={{ color: accentColor || 'hsl(231,64%,20%)' }}>{title}</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: accentColor ? `${accentColor}22` : 'rgba(43,45,232,0.12)', color: accentColor || '#2b2de8' }}
        >
          {count}
        </span>
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}