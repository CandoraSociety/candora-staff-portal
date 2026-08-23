import { useMemo, useRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

/**
 * Text input with a datalist-style autocomplete dropdown of previously
 * entered employer names. The user can type freely or pick a suggestion;
 * selecting a suggestion fires onSelect with the full name (still editable).
 */
export default function EmployerAutocomplete({ value, onChange, suggestions = [], placeholder }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const matches = useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (!q) return suggestions.slice(0, 8);
    return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
  }, [suggestions, value]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (name) => {
    onChange(name);
    setOpen(false);
    setHighlight(-1);
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (!open || matches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      pick(matches[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlight(-1);
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder || 'Business / employer'}
        autoComplete="off"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-auto text-sm">
          {matches.map((name, i) => (
            <button
              type="button"
              key={name}
              onMouseDown={(e) => { e.preventDefault(); pick(name); }}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full text-left px-3 py-1.5 truncate ${i === highlight ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60'}`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}