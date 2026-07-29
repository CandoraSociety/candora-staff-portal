import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, X } from 'lucide-react';

export default function MultiSelectFilter({ label, value = [], onChange, options = [] }) {
  const [open, setOpen] = useState(false);
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const selectedLabels = options.filter(o => selected.includes(o.value)).map(o => o.label);

  const toggle = (val) => {
    if (selected.includes(val)) onChange(selected.filter(v => v !== val));
    else onChange([...selected, val]);
  };

  const clear = (e) => { e.stopPropagation(); e.preventDefault(); onChange([]); };

  const display = selected.length === 0
    ? 'Any'
    : selected.length === 1
      ? selectedLabels[0] || '1 selected'
      : `${selected.length} selected`;

  return (
    <div>
      <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-between h-8 text-xs font-normal px-2"
          >
            <span className="truncate">{display}</span>
            <span className="flex items-center gap-1 shrink-0">
              {selected.length > 0 && (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={clear}
                  className="rounded p-0.5 hover:bg-slate-200 text-slate-400"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-0" align="start">
          <div className="max-h-60 overflow-y-auto p-1">
            {options.map(o => {
              const checked = selected.includes(o.value);
              return (
                <label
                  key={o.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer text-xs"
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggle(o.value)} />
                  <span className="leading-tight">{o.label}</span>
                </label>
              );
            })}
            {options.length === 0 && (
              <p className="text-xs text-slate-400 px-2 py-2">No options</p>
            )}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-slate-100 p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-xs h-7"
                onClick={() => onChange([])}
              >
                Clear ({selected.length})
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}