import React from 'react';
import { Image, X } from 'lucide-react';

// One role in the logo library — shows the logo assigned to it, or an empty slot
// the user can fill from the uploaded logo assets.
export default function BrandLogoSlot({ label, hint, asset, onChoose, onClear }) {
  return (
    <div className="rounded-xl border-2 border-border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-800">{label}</p>
          {hint && <p className="text-[10px] text-slate-400 leading-tight">{hint}</p>}
        </div>
        {asset && (
          <button
            type="button"
            onClick={onClear}
            title="Clear this slot"
            className="p-1 rounded-md text-slate-400 hover:text-destructive hover:bg-destructive/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onChoose}
        className="w-full aspect-[4/3] rounded-lg bg-slate-50 border border-dashed border-slate-200 hover:border-primary flex items-center justify-center p-3 transition-colors"
      >
        {asset ? (
          <img src={asset.file_url} alt={asset.name} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-slate-400">
            <Image className="w-6 h-6" />
            <span className="text-[11px]">Choose logo</span>
          </span>
        )}
      </button>

      {asset && <p className="text-[11px] text-slate-500 truncate">{asset.name}</p>}
    </div>
  );
}