import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const nameOf = (c) => `${c.first_name || ''} ${c.last_name || ''}`.trim() || '(unnamed)';

export default function ClientPicker({ clients, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const selected = (clients || []).find((c) => c.id === value);
  const query = q.trim().toLowerCase();
  const filtered = (clients || [])
    .filter((c) => {
      if (!query) return true;
      return (
        nameOf(c).toLowerCase().includes(query) ||
        (c.compass_hsid || '').toLowerCase().includes(query)
      );
    })
    .slice(0, 60);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between h-10 px-3 rounded-md border border-slate-300 bg-white text-sm hover:border-slate-400 transition-colors"
      >
        <span className={selected ? 'text-slate-800 font-medium' : 'text-slate-400'}>
          {selected ? `${nameOf(selected)}${selected.compass_hsid ? `  ·  HSID ${selected.compass_hsid}` : ''}` : 'Select a program participant (optional)'}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-96 overflow-auto">
          <div className="sticky top-0 bg-white border-b border-slate-100 p-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or HSID…"
                className="w-full h-9 pl-8 pr-3 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); setQ(''); }}
              className="w-full flex items-center justify-center gap-1.5 h-8 text-xs font-medium text-slate-600 border border-dashed border-slate-300 rounded-md hover:bg-slate-50"
            >
              <X className="w-3.5 h-3.5" /> No client — manual entry
            </button>
          </div>
          <ul>
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => { onChange(c.id); setOpen(false); setQ(''); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${value === c.id ? 'bg-blue-50' : ''}`}
                >
                  <span className="font-medium text-slate-800">{nameOf(c)}</span>
                  {c.compass_hsid && <span className="text-slate-400 ml-2">HSID {c.compass_hsid}</span>}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-slate-400 text-center">No participants match "{q}"</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}