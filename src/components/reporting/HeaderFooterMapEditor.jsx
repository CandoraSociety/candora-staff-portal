import React from 'react';
import { Type, Image, Hash } from 'lucide-react';

const ZONES = [
  { key: 'left', label: 'Left', x: '0%', w: '33.33%' },
  { key: 'center', label: 'Center', x: '33.33%', w: '33.33%' },
  { key: 'right', label: 'Right', x: '66.66%', w: '33.33%' },
];

const ELEMENTS = [
  { value: '', label: 'Empty', icon: null, color: 'bg-gray-100 text-gray-400 border-gray-300' },
  { value: 'text', label: 'Text', icon: Type, color: 'bg-blue-50 text-blue-600 border-blue-300' },
  { value: 'image', label: 'Image', icon: Image, color: 'bg-amber-50 text-amber-600 border-amber-300' },
  { value: 'page_number', label: 'Page #', icon: Hash, color: 'bg-emerald-50 text-emerald-600 border-emerald-300' },
];

export default function HeaderFooterMapEditor({ label, text, hasImage, font_size, layout, text_align, image_align, page_number_align, onUpdate, onFontSize, onLayout }) {
  const getZoneContent = (zone) => {
    if (text_align === zone) return 'text';
    if (image_align === zone) return 'image';
    if (page_number_align === zone) return 'page_number';
    return '';
  };

  const handleZoneClick = (zone) => {
    const current = getZoneContent(zone);
    const nextIdx = (ELEMENTS.findIndex(e => e.value === current) + 1) % ELEMENTS.length;
    const next = ELEMENTS[nextIdx].value;

    // Clear previous assignments
    const patch = {};
    if (text_align === zone) patch.text_align = '';
    if (image_align === zone) patch.image_align = '';
    if (page_number_align === zone) patch.page_number_align = '';

    // Set new assignment
    if (next === 'text') patch.text_align = zone;
    else if (next === 'image') patch.image_align = zone;
    else if (next === 'page_number') patch.page_number_align = zone;

    onUpdate(patch);
  };

  const zoneContent = ZONES.map(z => ({ ...z, content: getZoneContent(z.key) }));
  const elForZone = (content) => ELEMENTS.find(e => e.value === content) || ELEMENTS[0];

  return (
    <div className="border rounded-lg p-3 bg-gray-50/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold">{label} Map</span>
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

      {/* Zone map */}
      <div className="relative h-16 border-2 border-dashed border-gray-300 rounded-lg bg-white mb-2 overflow-hidden">
        {ZONES.map((z) => {
          const content = getZoneContent(z.key);
          const el = elForZone(content);
          const Icon = el.icon;
          return (
            <button
              key={z.key}
              onClick={() => handleZoneClick(z.key)}
              className={`absolute top-1 bottom-1 rounded-md border flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all cursor-pointer hover:ring-2 hover:ring-accent/50 ${el.color}`}
              style={{ left: z.x, width: z.w }}
              title={`Click to change — currently: ${el.label}`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span className="leading-none">{el.label}</span>
            </button>
          );
        })}
        {/* Zone dividers */}
        <div className="absolute left-1/3 top-0 bottom-0 border-l border-dashed border-gray-200" />
        <div className="absolute left-2/3 top-0 bottom-0 border-l border-dashed border-gray-200" />
      </div>

      {/* Live mini-preview */}
      <div className="border rounded bg-white p-2 flex items-center gap-2 min-h-[28px]" style={{ flexDirection: layout === 'stacked' ? 'column' : 'row' }}>
        {zoneContent.map((z) => {
          const content = z.content;
          if (!content) return <div key={z.key} className="flex-1" />;
          if (content === 'text' && text) {
            return (
              <div key={z.key} className="flex-1 flex justify-center">
                <span className="text-[10px] text-muted-foreground truncate max-w-full" style={{ fontSize: `${font_size || 12}px` }}>
                  {text.slice(0, 30)}
                </span>
              </div>
            );
          }
          if (content === 'image' && hasImage) {
            return (
              <div key={z.key} className="flex-1 flex justify-center">
                <span className="text-[10px] text-amber-600 italic">[image]</span>
              </div>
            );
          }
          if (content === 'page_number') {
            return (
              <div key={z.key} className="flex-1 flex justify-center">
                <span className="text-[10px] text-emerald-600">[12]</span>
              </div>
            );
          }
          return <div key={z.key} className="flex-1" />;
        })}
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