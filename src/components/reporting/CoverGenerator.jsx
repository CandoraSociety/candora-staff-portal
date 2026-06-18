import React, { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, RefreshCw, Sparkles, Trash2, Heart, Undo2, Star, Type, Check, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, GripHorizontal } from 'lucide-react';

const FIELD_MAP = {
  front: 'cover_image',
  inside_front: 'inside_front_cover_image',
  inside_back: 'inside_back_cover_image',
  back: 'back_cover_image',
};

const TEXT_FIELD_MAP = {
  front: 'front_cover_text',
  inside_front: 'inside_front_cover_text',
  inside_back: 'inside_back_cover_text',
  back: 'back_cover_text',
};

const LABEL_MAP = {
  front: 'Front Cover',
  inside_front: 'Inside Front Cover',
  inside_back: 'Inside Back Cover',
  back: 'Back Cover',
};

const STORAGE_KEY = (reportId) => `agr_cover_favourites_${reportId}`;

function loadFavourites(reportId) {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY(reportId)) || '[]'); } catch { return []; }
}
function saveFavourites(reportId, favs) {
  localStorage.setItem(STORAGE_KEY(reportId), JSON.stringify(favs));
}

const DEFAULT_STYLE = { font_size: 24, font_family: 'Inter', color: '#ffffff', bold: false, italic: false, underline: false, align: 'center', x: 50, y: 50 };

function parseStyles(raw) {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

function CoverSlot({ type, reportId, report, branding, onUpdate, favourites, onFavouritesChange }) {
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [showFavPicker, setShowFavPicker] = useState(false);
  const [favouriting, setFavouriting] = useState(false);
  const [localText, setLocalText] = useState('');
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, styleX: 0, styleY: 0 });
  const imageUrl = report?.[FIELD_MAP[type]];
  const label = LABEL_MAP[type];
  const coverTextField = TEXT_FIELD_MAP[type];
  const coverText = report?.[coverTextField] || '';
  const favs = favourites.filter(f => f.cover_type === type);
  const allStyles = parseStyles(report?.cover_text_styles);
  const style = { ...DEFAULT_STYLE, ...allStyles[type] };

  useEffect(() => { setLocalText(coverText); }, [coverText]);

  const saveStyle = async (patch) => {
    const current = parseStyles(report?.cover_text_styles);
    current[type] = { ...current[type], ...patch };
    await onUpdate({ cover_text_styles: JSON.stringify(current) });
  };

  const generateCover = async () => {
    const prev = imageUrl || null;
    setGenerating(true); setError('');
    try {
      const res = await base44.functions.invoke('generateCoverPage', {
        report_id: reportId, type,
        custom_prompt: prompt || undefined,
        reference_image_url: prev || undefined,
        front_cover_url: type !== 'front' ? report?.cover_image || undefined : undefined
      });
      if (res.data?.url) await onUpdate({ [FIELD_MAP[type]]: res.data.url });
      else setError(res.data?.error || 'No image returned');
    } catch (err) { setError(err?.response?.data?.error || err?.message || 'Generation failed'); }
    setGenerating(false);
  };

  const undoCover = () => onUpdate({ [FIELD_MAP[type]]: null });

  const uploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await onUpdate({ [FIELD_MAP[type]]: file_url });
  };

  const deleteCover = () => onUpdate({ [FIELD_MAP[type]]: '' });

  const favouriteCover = () => {
    if (!imageUrl) return;
    setFavouriting(true);
    const newFav = { id: Date.now().toString(), cover_type: type, image_url: imageUrl, label: `${label} — ${new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` };
    onFavouritesChange([newFav, ...favourites]);
    setTimeout(() => setFavouriting(false), 600);
  };

  const pickFavourite = (fav) => onUpdate({ [FIELD_MAP[type]]: fav.image_url });
  const removeFavourite = (favId) => onFavouritesChange(favourites.filter(f => f.id !== favId));

  // Dragging logic
  const onPointerDown = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      styleX: style.x, styleY: style.y,
      rect, parentW: rect.width, parentH: rect.height
    };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const { startX, startY, styleX, styleY, parentW, parentH } = dragRef.current;
      const dx = ((e.clientX - startX) / parentW) * 100;
      const dy = ((e.clientY - startY) / parentH) * 100;
      const nx = Math.max(5, Math.min(95, styleX + dx));
      const ny = Math.max(5, Math.min(95, styleY + dy));
      saveStyle({ x: Math.round(nx), y: Math.round(ny) });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [dragging]);

  const fontFamilies = ['Inter', 'Georgia', 'Montserrat', 'Playfair Display', 'Nunito', 'Roboto', 'Arial'];

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold">{label} (8.5″ × 11″)</Label>
      {imageUrl ? (
        <div>
          <div className="relative group rounded-lg overflow-hidden border bg-slate-100">
            <div className="aspect-[8.5/11] w-full">
              <img src={imageUrl} alt={label} className="w-full h-full object-cover" loading="lazy" />
              {/* Text overlay on image */}
              {coverText && (
                <div
                  className="absolute cursor-grab select-none"
                  style={{
                    left: `${style.x}%`, top: `${style.y}%`,
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '85%',
                    textAlign: style.align,
                    fontSize: `${style.font_size}px`,
                    fontFamily: style.font_family,
                    color: style.color,
                    fontWeight: style.bold ? 'bold' : 'normal',
                    fontStyle: style.italic ? 'italic' : 'normal',
                    textDecoration: style.underline ? 'underline' : 'none',
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    lineHeight: 1.3,
                    whiteSpace: 'pre-line',
                    cursor: dragging ? 'grabbing' : 'grab',
                    zIndex: 10,
                  }}
                  onPointerDown={onPointerDown}
                >
                  {coverText}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={generateCover} disabled={generating} className="gap-1">
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />{generating ? 'Regenerating...' : 'Regenerate'}
            </Button>
            <Button variant="outline" size="sm" onClick={undoCover} className="gap-1"><Undo2 className="w-3.5 h-3.5" />Undo</Button>
            <Button variant="outline" size="sm" onClick={favouriteCover} disabled={favouriting} className="gap-1 text-pink-500 hover:text-pink-600">
              <Heart className={`w-3.5 h-3.5 ${favouriting ? 'animate-pulse fill-pink-500' : ''}`} />{favouriting ? 'Saved!' : 'Favourite'}
            </Button>
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" className="gap-1" asChild><span><Upload className="w-3.5 h-3.5" />Upload</span></Button>
              <input type="file" accept="image/*" className="hidden" onChange={uploadCover} />
            </label>
            <Button variant="outline" size="sm" onClick={deleteCover} className="gap-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" />Delete</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={generateCover} disabled={generating} className="gap-2 flex-1" variant="outline"><Sparkles className="w-4 h-4" />{generating ? 'Generating...' : `AI Generate ${label}`}</Button>
          <label className="flex-1 cursor-pointer">
            <Button variant="outline" className="gap-2 w-full" asChild><span><Upload className="w-4 h-4" />Upload Image</span></Button>
            <input type="file" accept="image/*" className="hidden" onChange={uploadCover} />
          </label>
        </div>
      )}
      <div>
        <Label className="text-xs text-muted-foreground">Custom prompt (optional)</Label>
        <Textarea rows={2} value={prompt} onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateCover(); } }}
          placeholder="Additional instructions for the AI... (press Enter to regenerate)" className="mt-1 text-xs" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Text input */}
      <div>
        <Label className="text-xs text-muted-foreground flex items-center gap-1"><Type className="w-3 h-3" />Overlay Text</Label>
        <div className="flex items-start gap-1 mt-1">
          <Textarea rows={3} value={localText} onChange={e => setLocalText(e.target.value)}
            placeholder="Text to overlay on this cover (line breaks preserved)..." className="text-xs flex-1" />
          {localText !== coverText && (
            <Button size="icon" variant="outline" onClick={() => onUpdate({ [coverTextField]: localText })} className="h-8 w-8 shrink-0 text-green-600" title="Apply"><Check className="w-3.5 h-3.5" /></Button>
          )}
        </div>
      </div>

      {/* Text styling toolbar */}
      {coverText && (
        <div className="border rounded-lg p-2 space-y-2 bg-slate-50">
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><GripHorizontal className="w-3 h-3" /> Drag text on image to reposition</div>
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Family */}
            <select value={style.font_family} onChange={e => saveStyle({ font_family: e.target.value })}
              className="text-xs border rounded px-1 py-0.5 h-7 bg-white">
              {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            {/* Size */}
            <select value={style.font_size} onChange={e => saveStyle({ font_size: parseInt(e.target.value) })}
              className="text-xs border rounded px-1 py-0.5 h-7 bg-white w-16">
              {[12,14,16,18,20,24,28,32,36,42,48,56,64,72].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {/* Color */}
            <input type="color" value={style.color} onChange={e => saveStyle({ color: e.target.value })}
              className="w-7 h-7 rounded border cursor-pointer p-0.5" title="Text color" />
            {/* Bold */}
            <Button size="icon" variant={style.bold ? 'default' : 'outline'} onClick={() => saveStyle({ bold: !style.bold })}
              className="h-7 w-7" title="Bold"><Bold className="w-3.5 h-3.5" /></Button>
            {/* Italic */}
            <Button size="icon" variant={style.italic ? 'default' : 'outline'} onClick={() => saveStyle({ italic: !style.italic })}
              className="h-7 w-7" title="Italic"><Italic className="w-3.5 h-3.5" /></Button>
            {/* Underline */}
            <Button size="icon" variant={style.underline ? 'default' : 'outline'} onClick={() => saveStyle({ underline: !style.underline })}
              className="h-7 w-7" title="Underline"><Underline className="w-3.5 h-3.5" /></Button>
            <span className="w-px h-5 bg-border mx-0.5" />
            {/* Align */}
            <Button size="icon" variant={style.align === 'left' ? 'default' : 'outline'} onClick={() => saveStyle({ align: 'left' })}
              className="h-7 w-7" title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></Button>
            <Button size="icon" variant={style.align === 'center' ? 'default' : 'outline'} onClick={() => saveStyle({ align: 'center' })}
              className="h-7 w-7" title="Align Center"><AlignCenter className="w-3.5 h-3.5" /></Button>
            <Button size="icon" variant={style.align === 'right' ? 'default' : 'outline'} onClick={() => saveStyle({ align: 'right' })}
              className="h-7 w-7" title="Align Right"><AlignRight className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      )}

      {favs.length > 0 && (
        <div>
          <button onClick={() => setShowFavPicker(!showFavPicker)} className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 transition-colors">
            <Star className="w-3 h-3" />Favourites ({favs.length})
          </button>
          {showFavPicker && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {favs.map(fav => (
                <div key={fav.id} className="relative group">
                  <button onClick={() => { pickFavourite(fav); setShowFavPicker(false); }} className="w-full aspect-[8.5/11] rounded overflow-hidden border hover:ring-2 hover:ring-pink-400 transition-all">
                    <img src={fav.image_url} alt={fav.label || ''} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                  <button onClick={() => removeFavourite(fav.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  {fav.label && <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{fav.label}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CoverGenerator({ reportId, report, branding, onUpdate }) {
  const [favourites, setFavourites] = useState(() => loadFavourites(reportId));
  const handleFavouritesChange = (updated) => { setFavourites(updated); saveFavourites(reportId, updated); };
  const types = ['front', 'inside_front', 'inside_back', 'back'];

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {types.map(type => (
        <CoverSlot key={type} type={type} reportId={reportId} report={report} branding={branding}
          onUpdate={onUpdate} favourites={favourites} onFavouritesChange={handleFavouritesChange} />
      ))}
    </div>
  );
}