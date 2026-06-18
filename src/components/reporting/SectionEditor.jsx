import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Sparkles, ImageIcon, Trash2, GripVertical, Edit3, Check, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, RotateCcw } from 'lucide-react';
import ReactQuill from 'react-quill';

const FONT_FAMILIES = ['Inter', 'Georgia', 'Montserrat', 'Playfair Display', 'Nunito', 'Roboto', 'Arial'];

function parseStyles(raw) {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

const LAYOUT_LABELS = {
  text_only: 'Text Only',
  image_left: 'Image Left',
  image_right: 'Image Right',
  image_full: 'Full Image',
  two_column: 'Two Column'
};

export default function SectionEditor({ section, masterStyles, onUpdate, onDelete, onGenerateSuggestions, onGenerateVisual, suggestions }) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(section.title || '');
  const [content, setContent] = useState(section.content || '');
  const [layout, setLayout] = useState(section.layout || 'text_only');
  const [imageUrl, setImageUrl] = useState(section.image_url || '');
  const [imageCaption, setImageCaption] = useState(section.image_caption || '');
  const [isCollapsible, setIsCollapsible] = useState(section.is_collapsible || false);
  const [isExpandedDefault, setIsExpandedDefault] = useState(section.is_expanded_default !== false);
  const [hideHeader, setHideHeader] = useState(section.hide_header || false);
  const [hideFooter, setHideFooter] = useState(section.hide_footer || false);
  const [generatingVisual, setGeneratingVisual] = useState(false);
  const [visualCategory, setVisualCategory] = useState('infographic');
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [titleStyles, setTitleStyles] = useState(parseStyles(section.title_styles));

  const master = parseStyles(masterStyles);
  const masterTitle = master.title || {};
  const effectiveTitle = section.title_styles ? { ...masterTitle, ...parseStyles(section.title_styles) } : { ...masterTitle };
  const hasTitleOverride = !!section.title_styles;

  useEffect(() => {
    setTitle(section.title || '');
    setContent(section.content || '');
    setLayout(section.layout || 'text_only');
    setImageUrl(section.image_url || '');
    setImageCaption(section.image_caption || '');
    setIsCollapsible(section.is_collapsible || false);
    setIsExpandedDefault(section.is_expanded_default !== false);
    setHideHeader(section.hide_header || false);
    setHideFooter(section.hide_footer || false);
    setTitleStyles(parseStyles(section.title_styles));
  }, [section]);

  const save = () => {
    onUpdate(section.id, { title, content, layout, image_url: imageUrl, image_caption: imageCaption, is_collapsible: isCollapsible, is_expanded_default: isExpandedDefault, hide_header: hideHeader, hide_footer: hideFooter, title_styles: JSON.stringify(titleStyles) });
  };

  const updateTitleStyle = (key, value) => {
    const updated = { ...titleStyles, [key]: value };
    setTitleStyles(updated);
    onUpdate(section.id, { title_styles: JSON.stringify(updated) });
  };

  const resetTitleOverride = () => {
    setTitleStyles({ ...masterTitle });
    onUpdate(section.id, { title_styles: null });
  };

  const handleGenerateVisual = async () => {
    setGeneratingVisual(true);
    try {
      const res = await base44.functions.invoke('generateReportVisual', { section_title: title, section_content: content, category: visualCategory, report_context: '', brand_colors: '#1a2744, #c8952e' });
      const url = res.data?.url;
      if (url) { setImageUrl(url); onUpdate(section.id, { image_url: url }); }
    } catch {}
    setGeneratingVisual(false);
  };

  const handleGenerateSuggestions = async () => {
    setGeneratingSuggestions(true);
    try {
      await onGenerateSuggestions(section);
    } catch {}
    setGeneratingSuggestions(false);
  };

  return (
    <div className="border rounded-xl bg-white">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 rounded-t-xl"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical className="w-4 h-4 text-slate-300" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{title || 'Untitled Section'}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{LAYOUT_LABELS[layout]}</span>
            {hasTitleOverride ? (
              <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">custom title</span>
            ) : (
              <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">master</span>
            )}
            {content && <span className="text-xs text-muted-foreground truncate">{content.replace(/<[^>]+>/g, '').slice(0, 60)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(section.id); }} className="text-red-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t">
          <div className="grid sm:grid-cols-2 gap-3 pt-3">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-1">
                <Label className="text-xs">Section Title</Label>
                {!hasTitleOverride && masterTitle && Object.keys(masterTitle).length > 0 && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">using master style</span>
                )}
                {hasTitleOverride && (
                  <button onClick={resetTitleOverride} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1" title="Revert to master styles">
                    <RotateCcw className="w-3 h-3" /> revert to master
                  </button>
                )}
              </div>
              <Input value={title} onChange={e => setTitle(e.target.value)} onBlur={save} placeholder="e.g. Executive Message" className="mt-1" />
              {/* Title Styling Toolbar */}
              <div className="mt-2 p-2 border rounded bg-gray-50/50 space-y-1.5">
                <div className="flex flex-wrap items-center gap-1">
                  <select
                    value={titleStyles.font_family || 'Inter'}
                    onChange={e => updateTitleStyle('font_family', e.target.value)}
                    className="text-[10px] border rounded px-1 py-0.5 h-6 bg-white"
                  >
                    {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <span className="w-px h-5 bg-border mx-0.5" />
                  <button onClick={() => updateTitleStyle('bold', !effectiveTitle.bold)}
                    className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${effectiveTitle.bold ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                    title="Bold"><Bold className="w-3 h-3" /></button>
                  <button onClick={() => updateTitleStyle('italic', !effectiveTitle.italic)}
                    className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${effectiveTitle.italic ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                    title="Italic"><Italic className="w-3 h-3" /></button>
                  <button onClick={() => updateTitleStyle('underline', !effectiveTitle.underline)}
                    className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${effectiveTitle.underline ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                    title="Underline"><Underline className="w-3 h-3" /></button>
                  <span className="w-px h-5 bg-border mx-0.5" />
                  <button onClick={() => updateTitleStyle('align', 'left')}
                    className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${effectiveTitle.align === 'left' || !effectiveTitle.align ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                    title="Align Left"><AlignLeft className="w-3 h-3" /></button>
                  <button onClick={() => updateTitleStyle('align', 'center')}
                    className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${effectiveTitle.align === 'center' ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                    title="Align Center"><AlignCenter className="w-3 h-3" /></button>
                  <button onClick={() => updateTitleStyle('align', 'right')}
                    className={`w-6 h-6 flex items-center justify-center rounded border text-[10px] ${effectiveTitle.align === 'right' ? 'bg-accent text-white border-accent' : 'bg-white hover:bg-gray-100'}`}
                    title="Align Right"><AlignRight className="w-3 h-3" /></button>
                  <span className="w-px h-5 bg-border mx-0.5" />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Color</span>
                    <input
                      type="color"
                      value={effectiveTitle.color || '#000000'}
                      onChange={e => updateTitleStyle('color', e.target.value)}
                      className="w-6 h-6 rounded border cursor-pointer p-0.5"
                    />
                  </div>
                  <span className="w-px h-5 bg-border mx-0.5" />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Size</span>
                    <input
                      type="number"
                      value={effectiveTitle.font_size || 18}
                      onChange={e => updateTitleStyle('font_size', parseInt(e.target.value) || 18)}
                      className="w-12 h-6 text-xs border rounded px-1"
                      min="8" max="72"
                    />
                    <span className="text-[10px] text-muted-foreground">px</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Layout</Label>
              <Select value={layout} onValueChange={v => { setLayout(v); onUpdate(section.id, { layout: v }); }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LAYOUT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Visual Category</Label>
              <Select value={visualCategory} onValueChange={setVisualCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="infographic">Infographic</SelectItem>
                  <SelectItem value="graph">Graph / Chart</SelectItem>
                  <SelectItem value="chart">Data Chart</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                  <SelectItem value="visual_aide">Visual Aide</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="diagram">Diagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">Content</Label>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={handleGenerateSuggestions} disabled={generatingSuggestions} className="text-xs gap-1 h-7">
                  <Sparkles className="w-3 h-3" />{generatingSuggestions ? '...' : 'AI Suggestions'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleGenerateVisual} disabled={generatingVisual} className="text-xs gap-1 h-7">
                  <ImageIcon className="w-3 h-3" />{generatingVisual ? '...' : 'AI Visual'}
                </Button>
              </div>
            </div>
            <ReactQuill theme="snow" value={content} onChange={setContent} className="bg-white rounded-lg" style={{ minHeight: 160 }} />
            <div className="flex items-center gap-2 mt-1">
              <Button variant="outline" size="sm" onClick={save} className="gap-1 text-xs h-7"><Check className="w-3 h-3" />Apply Content</Button>
            </div>
          </div>

          {suggestions && suggestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-800 mb-2">AI Writing Suggestions</p>
              <ul className="text-xs text-blue-700 space-y-1">
                {suggestions.map((s, i) => <li key={i} className="flex items-start gap-1.5"><span className="font-bold">{i + 1}.</span> {s}</li>)}
              </ul>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Image URL</Label>
              <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} onBlur={() => onUpdate(section.id, { image_url: imageUrl })} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Image Caption</Label>
              <Input value={imageCaption} onChange={e => setImageCaption(e.target.value)} onBlur={() => onUpdate(section.id, { image_caption: imageCaption })} placeholder="Caption text" className="mt-1" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={isCollapsible} onChange={e => { setIsCollapsible(e.target.checked); onUpdate(section.id, { is_collapsible: e.target.checked }); }} className="rounded" />
              Collapsible
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={isExpandedDefault} onChange={e => { setIsExpandedDefault(e.target.checked); onUpdate(section.id, { is_expanded_default: e.target.checked }); }} className="rounded" />
              Expanded by default
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={hideHeader} onChange={e => { setHideHeader(e.target.checked); onUpdate(section.id, { hide_header: e.target.checked }); }} className="rounded" />
              Hide header on this page
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={hideFooter} onChange={e => { setHideFooter(e.target.checked); onUpdate(section.id, { hide_footer: e.target.checked }); }} className="rounded" />
              Hide footer on this page
            </label>
          </div>
        </div>
      )}
    </div>
  );
}