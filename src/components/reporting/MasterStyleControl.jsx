import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const FONT_FAMILIES = ['Inter', 'Georgia', 'Montserrat', 'Playfair Display', 'Nunito', 'Roboto', 'Arial'];

const DEFAULTS = {
  title: { font_family: 'Inter', font_size: 24, color: '#1a2744', bold: true, italic: false, underline: false, align: 'left' },
  content: { font_family: 'Inter', font_size: 14, color: '#333333' }
};

function parse(raw) {
  try { return raw ? JSON.parse(raw) : DEFAULTS; } catch { return DEFAULTS; }
}

export default function MasterStyleControl({ report, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const styles = parse(report?.master_section_styles);
  const title = styles.title || DEFAULTS.title;
  const content = styles.content || DEFAULTS.content;

  const set = (section, key, value) => {
    const updated = { ...styles, [section]: { ...styles[section], [key]: value } };
    onUpdate({ master_section_styles: JSON.stringify(updated) });
  };

  const reset = () => onUpdate({ master_section_styles: JSON.stringify(DEFAULTS) });

  return (
    <div className="border rounded-xl bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 rounded-t-xl"
      >
        <span className="text-sm font-semibold">Master Section Styles</span>
        <span className="text-xs text-muted-foreground">— defaults for all section headings &amp; content</span>
        <span className="ml-auto">{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t pt-3">
          {/* Title Styles */}
          <div>
            <span className="text-xs font-semibold">Section Heading Defaults</span>
            <div className="mt-1.5 p-2.5 border rounded bg-gray-50/50">
              <div className="flex flex-wrap items-center gap-1.5">
                <select
                  value={title.font_family || 'Inter'}
                  onChange={e => set('title', 'font_family', e.target.value)}
                  className="text-xs border rounded px-1.5 py-1 h-7 bg-white"
                >
                  {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <span className="w-px h-5 bg-border mx-0.5" />
                <button onClick={() => set('title', 'bold', !title.bold)}
                  className={`w-7 h-7 flex items-center justify-center rounded border text-xs ${title.bold ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                  title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                <button onClick={() => set('title', 'italic', !title.italic)}
                  className={`w-7 h-7 flex items-center justify-center rounded border text-xs ${title.italic ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                  title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                <button onClick={() => set('title', 'underline', !title.underline)}
                  className={`w-7 h-7 flex items-center justify-center rounded border text-xs ${title.underline ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                  title="Underline"><Underline className="w-3.5 h-3.5" /></button>
                <span className="w-px h-5 bg-border mx-0.5" />
                <button onClick={() => set('title', 'align', 'left')}
                  className={`w-7 h-7 flex items-center justify-center rounded border text-xs ${title.align === 'left' || !title.align ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                  title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></button>
                <button onClick={() => set('title', 'align', 'center')}
                  className={`w-7 h-7 flex items-center justify-center rounded border text-xs ${title.align === 'center' ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                  title="Align Center"><AlignCenter className="w-3.5 h-3.5" /></button>
                <button onClick={() => set('title', 'align', 'right')}
                  className={`w-7 h-7 flex items-center justify-center rounded border text-xs ${title.align === 'right' ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                  title="Align Right"><AlignRight className="w-3.5 h-3.5" /></button>
                <span className="w-px h-5 bg-border mx-0.5" />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Color</span>
                  <input type="color" value={title.color || '#1a2744'} onChange={e => set('title', 'color', e.target.value)}
                    className="w-7 h-7 rounded border cursor-pointer p-0.5" />
                </div>
                <span className="w-px h-5 bg-border mx-0.5" />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Size</span>
                  <input type="number" value={title.font_size || 24}
                    onChange={e => set('title', 'font_size', parseInt(e.target.value) || 24)}
                    className="w-14 h-6 text-xs border rounded px-1" min="8" max="72" />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Styles */}
          <div>
            <span className="text-xs font-semibold">Section Content Defaults</span>
            <p className="text-[10px] text-muted-foreground mb-1.5">These apply to body text that has no explicit formatting</p>
            <div className="p-2.5 border rounded bg-gray-50/50">
              <div className="flex flex-wrap items-center gap-1.5">
                <select
                  value={content.font_family || 'Inter'}
                  onChange={e => set('content', 'font_family', e.target.value)}
                  className="text-xs border rounded px-1.5 py-1 h-7 bg-white"
                >
                  {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <span className="w-px h-5 bg-border mx-0.5" />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Color</span>
                  <input type="color" value={content.color || '#333333'} onChange={e => set('content', 'color', e.target.value)}
                    className="w-7 h-7 rounded border cursor-pointer p-0.5" />
                </div>
                <span className="w-px h-5 bg-border mx-0.5" />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Size</span>
                  <input type="number" value={content.font_size || 14}
                    onChange={e => set('content', 'font_size', parseInt(e.target.value) || 14)}
                    className="w-14 h-6 text-xs border rounded px-1" min="8" max="48" />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reset */}
          <button onClick={reset} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
            <RotateCcw className="w-3 h-3" /> Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}