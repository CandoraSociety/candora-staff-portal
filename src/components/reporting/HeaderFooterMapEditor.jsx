import React, { useCallback } from 'react';
import { Type, Image, Hash, Plus, Minus, Trash2, GripVertical } from 'lucide-react';

const CONTENT_TYPES = [
  { value: '', label: 'Empty', icon: null, color: 'bg-gray-100 text-gray-400 border-gray-300' },
  { value: 'text', label: 'Text', icon: Type, color: 'bg-blue-50 text-blue-600 border-blue-300' },
  { value: 'image', label: 'Image', icon: Image, color: 'bg-amber-50 text-amber-600 border-amber-300' },
  { value: 'page_number', label: 'Page #', icon: Hash, color: 'bg-emerald-50 text-emerald-600 border-emerald-300' },
];

function makeId() { return 'z' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function defaultZones() {
  return [
    { id: makeId(), w: 33, content: 'text' },
    { id: makeId(), w: 34, content: '' },
    { id: makeId(), w: 33, content: 'page_number' },
  ];
}

export default function HeaderFooterMapEditor({
  label, text, imageUrl, font_size, layout, zones, onUpdate, onFontSize, onLayout
}) {
  // ── Derive zones from legacy fields if zones array is empty ──
  const zonesArr = (zones && zones.length > 0) ? zones : defaultZones();

  const totalWidth = zonesArr.reduce((s, z) => s + z.w, 0);

  const cycleContent = (zoneId) => {
    const updated = zonesArr.map(z => {
      if (z.id !== zoneId) return z;
      const idx = CONTENT_TYPES.findIndex(c => c.value === z.content);
      return { ...z, content: CONTENT_TYPES[(idx + 1) % CONTENT_TYPES.length].value };
    });
    onUpdate(updated);
  };

  const adjustWidth = (zoneId, delta) => {
    const updated = zonesArr.map(z => {
      if (z.id !== zoneId) return z;
      return { ...z, w: Math.max(5, Math.min(90, z.w + delta)) };
    });
    onUpdate(updated);
  };

  const setWidth = (zoneId, val) => {
    const w = parseInt(val) || 5;
    const updated = zonesArr.map(z => z.id === zoneId ? { ...z, w: Math.max(5, Math.min(90, w)) } : z);
    onUpdate(updated);
  };

  const removeZone = (zoneId) => {
    if (zonesArr.length <= 1) return;
    const updated = zonesArr.filter(z => z.id !== zoneId);
    onUpdate(updated);
  };

  const addZone = () => {
    const updated = [...zonesArr, { id: makeId(), w: 20, content: '' }];
    onUpdate(updated);
  };

  return (
    <div className="border rounded-lg p-3 bg-gray-50/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold">{label} Map</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Stack</span>
            <input
              type="checkbox"
              checked={layout === 'stacked'}
              onChange={e => onLayout(e.target.checked ? 'stacked' : 'inline')}
              className="rounded"
            />
          </label>
        </div>
      </div>

      {/* Zone list */}
      <div className="space-y-1.5 mb-2">
        {zonesArr.map((z) => {
          const ct = CONTENT_TYPES.find(c => c.value === z.content) || CONTENT_TYPES[0];
          const Icon = ct.icon;
          return (
            <div key={z.id} className="flex items-center gap-1.5">
              {/* Zone bar — visual width indicator */}
              <div className="flex-1 flex items-center gap-1">
                <button
                  onClick={() => cycleContent(z.id)}
                  className={`h-8 rounded-md border flex items-center justify-center gap-1 text-[10px] font-medium transition-all cursor-pointer hover:ring-2 hover:ring-accent/50 ${ct.color}`}
                  style={{ width: `${z.w}%` }}
                  title={`Click to change — currently: ${ct.label}`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  <span className="leading-none truncate">{ct.label}</span>
                </button>
                <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{z.w}%</span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => adjustWidth(z.id, -5)} className="w-5 h-5 flex items-center justify-center rounded border bg-white hover:bg-gray-100 text-[10px]" title="Shrink 5%">
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <input
                  type="number"
                  value={z.w}
                  onChange={e => setWidth(z.id, e.target.value)}
                  className="w-10 h-5 text-[10px] border rounded text-center px-0.5"
                  min="5" max="90"
                />
                <button onClick={() => adjustWidth(z.id, 5)} className="w-5 h-5 flex items-center justify-center rounded border bg-white hover:bg-gray-100 text-[10px]" title="Expand 5%">
                  <Plus className="w-2.5 h-2.5" />
                </button>
                {zonesArr.length > 1 && (
                  <button onClick={() => removeZone(z.id)} className="w-5 h-5 flex items-center justify-center rounded border bg-white hover:bg-red-50 text-red-400 hover:text-red-600" title="Remove zone">
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={addZone}
        className="w-full text-xs text-accent hover:underline py-1 flex items-center justify-center gap-1 border border-dashed rounded-md hover:border-accent transition-colors"
      >
        <Plus className="w-3 h-3" /> Add Zone
      </button>

      {/* Total warning */}
      {Math.abs(totalWidth - 100) > 2 && (
        <p className="text-[10px] text-amber-600 mt-1">Zone widths sum to {totalWidth}% (should be ~100%)</p>
      )}

      {/* Rich preview */}
      <div className="border rounded bg-white mt-2 overflow-hidden">
        <div className="text-[10px] text-muted-foreground px-2 pt-1.5 font-medium">Preview</div>
        <div className="p-3 min-h-[36px] flex items-center" style={{ flexDirection: layout === 'stacked' ? 'column' : 'row' }}>
          {zonesArr.map((z) => {
            if (layout === 'stacked') {
              return (
                <div key={z.id} className="flex justify-center py-0.5 w-full">
                  {renderZonePreview(z, text, imageUrl, font_size)}
                </div>
              );
            }
            return (
              <div key={z.id} className="flex justify-center overflow-hidden" style={{ width: `${z.w}%` }}>
                {renderZonePreview(z, text, imageUrl, font_size)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Font size */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-muted-foreground">Font:</span>
        <input
          type="number"
          value={font_size || 12}
          onChange={e => onFontSize(parseInt(e.target.value) || 12)}
          className="w-14 h-6 text-xs border rounded px-1"
          min="8"
          max="48"
        />
        <span className="text-xs text-muted-foreground">px</span>
      </div>
    </div>
  );
}

function renderZonePreview(z, text, imageUrl, fontSize) {
  if (z.content === 'text' && text) {
    return <span className="text-muted-foreground break-words max-w-full text-center" style={{ fontSize: `${fontSize || 12}px` }}>{text}</span>;
  }
  if (z.content === 'image' && imageUrl) {
    return <img src={imageUrl} alt="" className="object-contain max-h-10" style={{ maxWidth: '100%' }} />;
  }
  if (z.content === 'image' && !imageUrl) {
    return <span className="text-[10px] text-amber-600 italic">No image uploaded</span>;
  }
  if (z.content === 'page_number') {
    return <span className="text-muted-foreground" style={{ fontSize: `${fontSize || 12}px` }}>[12]</span>;
  }
  return <span className="text-[10px] text-gray-300">—</span>;
}