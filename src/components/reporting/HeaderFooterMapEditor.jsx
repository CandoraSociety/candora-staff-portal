import React, { useState } from 'react';
import { Type, Image, Hash, Plus, Minus, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const CONTENT_TYPES = [
  { value: '', label: 'Empty', icon: null, color: 'bg-gray-100 text-gray-400 border-gray-300' },
  { value: 'text', label: 'Text', icon: Type, color: 'bg-blue-50 text-blue-600 border-blue-300' },
  { value: 'image', label: 'Image', icon: Image, color: 'bg-amber-50 text-amber-600 border-amber-300' },
  { value: 'page_number', label: 'Page #', icon: Hash, color: 'bg-emerald-50 text-emerald-600 border-emerald-300' },
];

const FONT_FAMILIES = ['Inter', 'Georgia', 'Montserrat', 'Playfair Display', 'Nunito', 'Roboto', 'Arial'];

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
  const zonesArr = (zones && zones.length > 0) ? zones : defaultZones();
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const totalWidth = zonesArr.reduce((s, z) => s + z.w, 0);
  const selectedZone = zonesArr.find(z => z.id === selectedZoneId);

  const updateZone = (zoneId, patch) => {
    onUpdate(zonesArr.map(z => z.id === zoneId ? { ...z, ...patch } : z));
  };

  const cycleContent = (zoneId) => {
    const updated = zonesArr.map(z => {
      if (z.id !== zoneId) return z;
      const idx = CONTENT_TYPES.findIndex(c => c.value === z.content);
      const next = CONTENT_TYPES[(idx + 1) % CONTENT_TYPES.length];
      // Reset styling when switching to text
      if (next.value === 'text' && z.content !== 'text') {
        return { ...z, content: next.value, font_family: 'Inter', bold: false, italic: false, underline: false, align: 'left', color: '#000000' };
      }
      return { ...z, content: next.value };
    });
    onUpdate(updated);
    if (updated.find(z => z.id === zoneId)?.content !== 'text') setSelectedZoneId(null);
  };

  const adjustWidth = (zoneId, delta) => {
    onUpdate(zonesArr.map(z => z.id === zoneId ? { ...z, w: Math.max(5, Math.min(90, z.w + delta)) } : z));
  };

  const setWidth = (zoneId, val) => {
    const w = parseInt(val) || 5;
    onUpdate(zonesArr.map(z => z.id === zoneId ? { ...z, w: Math.max(5, Math.min(90, w)) } : z));
  };

  const removeZone = (zoneId) => {
    if (zonesArr.length <= 1) return;
    onUpdate(zonesArr.filter(z => z.id !== zoneId));
    if (selectedZoneId === zoneId) setSelectedZoneId(null);
  };

  const addZone = () => onUpdate([...zonesArr, { id: makeId(), w: 20, content: '' }]);

  const toggleStyle = (zoneId, key) => updateZone(zoneId, { [key]: !selectedZone?.[key] });

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
          const isSelected = z.id === selectedZoneId;
          return (
            <div key={z.id} className="flex items-center gap-1.5">
              <div className="flex-1 flex items-center gap-1">
                <button
                  onClick={() => {
                    if (isSelected) { cycleContent(z.id); } else { setSelectedZoneId(z.id); }
                  }}
                  className={`h-8 rounded-md border flex items-center justify-center gap-1 text-[10px] font-medium transition-all cursor-pointer hover:ring-2 hover:ring-accent/50 ${isSelected ? 'ring-2 ring-accent' : ''} ${ct.color}`}
                  style={{ width: `${z.w}%` }}
                  title={isSelected ? 'Click again to change type' : 'Click to select — then customize styling'}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  <span className="leading-none truncate">{ct.label}</span>
                </button>
                <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{z.w}%</span>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => adjustWidth(z.id, -5)} className="w-5 h-5 flex items-center justify-center rounded border bg-white hover:bg-gray-100 text-[10px]" title="Shrink 5%"><Minus className="w-2.5 h-2.5" /></button>
                <input type="number" value={z.w} onChange={e => setWidth(z.id, e.target.value)} className="w-10 h-5 text-[10px] border rounded text-center px-0.5" min="5" max="90" />
                <button onClick={() => adjustWidth(z.id, 5)} className="w-5 h-5 flex items-center justify-center rounded border bg-white hover:bg-gray-100 text-[10px]" title="Expand 5%"><Plus className="w-2.5 h-2.5" /></button>
                {zonesArr.length > 1 && (
                  <button onClick={() => removeZone(z.id)} className="w-5 h-5 flex items-center justify-center rounded border bg-white hover:bg-red-50 text-red-400 hover:text-red-600" title="Remove zone"><Trash2 className="w-2.5 h-2.5" /></button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={addZone} className="w-full text-xs text-accent hover:underline py-1 flex items-center justify-center gap-1 border border-dashed rounded-md hover:border-accent transition-colors">
        <Plus className="w-3 h-3" /> Add Zone
      </button>

      {Math.abs(totalWidth - 100) > 2 && (
        <p className="text-[10px] text-amber-600 mt-1">Zone widths sum to {totalWidth}% (should be ~100%)</p>
      )}

      {/* Text styling toolbar — shown when a text zone is selected */}
      {selectedZone && selectedZone.content === 'text' && (
        <div className="mt-2 p-2 border rounded bg-white space-y-1.5">
          <div className="flex flex-wrap items-center gap-1">
            <select
              value={selectedZone.font_family || 'Inter'}
              onChange={e => updateZone(selectedZone.id, { font_family: e.target.value })}
              className="text-[10px] border rounded px-1 py-0.5 h-6 bg-white"
            >
              {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <span className="w-px h-5 bg-border mx-0.5" />
            <button onClick={() => toggleStyle(selectedZone.id, 'bold')}
              className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${selectedZone.bold ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
              title="Bold"><Bold className="w-3 h-3" /></button>
            <button onClick={() => toggleStyle(selectedZone.id, 'italic')}
              className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${selectedZone.italic ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
              title="Italic"><Italic className="w-3 h-3" /></button>
            <button onClick={() => toggleStyle(selectedZone.id, 'underline')}
              className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${selectedZone.underline ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
              title="Underline"><Underline className="w-3 h-3" /></button>
            <span className="w-px h-5 bg-border mx-0.5" />
            <button onClick={() => updateZone(selectedZone.id, { align: 'left' })}
              className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${selectedZone.align === 'left' || !selectedZone.align ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
              title="Align Left"><AlignLeft className="w-3 h-3" /></button>
            <button onClick={() => updateZone(selectedZone.id, { align: 'center' })}
              className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${selectedZone.align === 'center' ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
              title="Align Center"><AlignCenter className="w-3 h-3" /></button>
            <button onClick={() => updateZone(selectedZone.id, { align: 'right' })}
              className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${selectedZone.align === 'right' ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
              title="Align Right"><AlignRight className="w-3 h-3" /></button>
            <span className="w-px h-5 bg-border mx-0.5" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">Color</span>
              <input
                type="color"
                value={selectedZone.color || '#000000'}
                onChange={e => updateZone(selectedZone.id, { color: e.target.value })}
                className="w-6 h-6 rounded border cursor-pointer p-0.5"
              />
            </div>
          </div>
        </div>
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
              <div key={z.id} className="flex overflow-hidden" style={{ width: `${z.w}%`, justifyContent: z.align === 'right' ? 'flex-end' : z.align === 'center' ? 'center' : 'flex-start' }}>
                {renderZonePreview(z, text, imageUrl, font_size)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Global font size */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-muted-foreground">Font:</span>
        <input type="number" value={font_size || 12} onChange={e => onFontSize(parseInt(e.target.value) || 12)} className="w-14 h-6 text-xs border rounded px-1" min="8" max="48" />
        <span className="text-xs text-muted-foreground">px</span>
      </div>
    </div>
  );
}

function renderZonePreview(z, text, imageUrl, fontSize) {
  const style = {
    fontSize: `${fontSize || 12}px`,
    fontFamily: z.font_family || 'Inter',
    fontWeight: z.bold ? 'bold' : 'normal',
    fontStyle: z.italic ? 'italic' : 'normal',
    textDecoration: z.underline ? 'underline' : 'none',
    color: z.color || 'inherit',
    textAlign: z.align || 'left',
    lineHeight: 1.3,
  };

  if (z.content === 'text' && text) {
    return <span className="break-words max-w-full" style={style}>{text}</span>;
  }
  if (z.content === 'image' && imageUrl) {
    return <img src={imageUrl} alt="" className="object-contain" style={{ maxHeight: `${fontSize ? fontSize * 2.5 : 30}px`, maxWidth: '100%' }} />;
  }
  if (z.content === 'image' && !imageUrl) {
    return <span className="text-[10px] text-amber-600 italic">No image</span>;
  }
  if (z.content === 'page_number') {
    return <span className="text-muted-foreground" style={{ fontSize: `${fontSize || 12}px` }}>[12]</span>;
  }
  return <span className="text-[10px] text-gray-300">—</span>;
}