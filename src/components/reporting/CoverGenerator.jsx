import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, RefreshCw, Sparkles, Trash2, Heart, Undo2, Star, Check, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, Image, X, Crop, GripHorizontal } from 'lucide-react';
import CropDialog from './CropDialog';

const FIELD_MAP = {
  front: 'cover_image', inside_front: 'inside_front_cover_image',
  inside_back: 'inside_back_cover_image', back: 'back_cover_image',
};
const LABEL_MAP = {
  front: 'Front Cover', inside_front: 'Inside Front Cover',
  inside_back: 'Inside Back Cover', back: 'Back Cover',
};

const STORAGE_KEY = (reportId) => `agr_cover_favourites_${reportId}`;
function loadFavourites(reportId) {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY(reportId)) || '[]'); } catch { return []; }
}
function saveFavourites(reportId, favs) {
  localStorage.setItem(STORAGE_KEY(reportId), JSON.stringify(favs));
}

let _idCounter = Date.now();
function uid() { return 'el_' + (_idCounter++); }

function parseOverlays(raw) {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

// Migrate old single-text format to new overlays array
function migrateLegacy(report, type) {
  const TEXT_FIELDS = { front: 'front_cover_text', inside_front: 'inside_front_cover_text', inside_back: 'inside_back_cover_text', back: 'back_cover_text' };
  const legacyText = report?.[TEXT_FIELDS[type]];
  if (!legacyText) return [];
  const allStyles = parseOverlays(report?.cover_text_styles);
  const s = allStyles[type] || {};
  return [{
    id: uid(), type: 'text', content: legacyText,
    x: s.x || 50, y: s.y || 50, w: s.w || 320,
    font_size: s.font_size || 24, font_family: s.font_family || 'Inter',
    color: s.color || '#ffffff', bold: s.bold || false,
    italic: s.italic || false, underline: s.underline || false,
    align: s.align || 'center',
  }];
}

function CoverSlot({ type, reportId, report, branding, onUpdate, favourites, onFavouritesChange }) {
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [showFavPicker, setShowFavPicker] = useState(false);
  const [favouriting, setFavouriting] = useState(false);
  const [dragging, setDragging] = useState(null); // { elId, kind: 'move'|'resize', startX, startY, ... }
  const [selectedId, setSelectedId] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); // element to crop
  const containerRef = useRef(null);

  const imageUrl = report?.[FIELD_MAP[type]];
  const label = LABEL_MAP[type];
  const favs = favourites.filter(f => f.cover_type === type);

  // Load overlays from DB or migrate legacy
  const persistedOverlays = parseOverlays(report?.cover_overlays);
  const [localOverlays, setLocalOverlays] = useState(() => {
    if (persistedOverlays[type]?.length) return persistedOverlays[type];
    return migrateLegacy(report, type);
  });

  // Sync when report changes from outside
  useEffect(() => {
    const fresh = parseOverlays(report?.cover_overlays);
    if (fresh[type]) setLocalOverlays(fresh[type]);
  }, [report?.cover_overlays]);

  const overlayRef = useRef(localOverlays);
  overlayRef.current = localOverlays;
  const debounceRef = useRef(null);

  const persistOverlays = useCallback((overlays) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const all = parseOverlays(report?.cover_overlays);
      all[type] = overlays;
      await onUpdate({ cover_overlays: JSON.stringify(all) });
    }, 300);
  }, [report?.cover_overlays, type, onUpdate]);

  const updateOverlays = (updater) => {
    setLocalOverlays(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persistOverlays(next);
      return next;
    });
  };

  const addTextBox = () => {
    const el = { id: uid(), type: 'text', content: 'New text', x: 50, y: 50, w: 280, font_size: 20, font_family: 'Inter', color: '#ffffff', bold: false, italic: false, underline: false, align: 'center' };
    updateOverlays(prev => [...prev, el]);
    setSelectedId(el.id);
  };

  const addImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const el = { id: uid(), type: 'image', url: file_url, x: 30, y: 30, w: 160, h: 160 };
    updateOverlays(prev => [...prev, el]);
    setSelectedId(el.id);
    e.target.value = '';
  };

  const updateElement = (elId, patch) => {
    updateOverlays(prev => prev.map(el => el.id === elId ? { ...el, ...patch } : el));
  };

  const deleteElement = (elId) => {
    updateOverlays(prev => prev.filter(el => el.id !== elId));
    if (selectedId === elId) setSelectedId(null);
  };

  const selectedEl = localOverlays.find(el => el.id === selectedId);

  // ── Drag / Resize logic ──
  const startDrag = (e, elId, kind) => {
    e.preventDefault(); e.stopPropagation();
    const el = localOverlays.find(o => o.id === elId);
    if (!el) return;
    setSelectedId(elId);
    setDragging({ elId, kind, startX: e.clientX, startY: e.clientY, startElX: el.x, startElY: el.y, startW: el.w || 200, startH: el.h || 200 });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const container = containerRef.current;
      if (!container) return;
      const pw = container.clientWidth;
      const ph = container.clientHeight;
      const dx = ((e.clientX - dragging.startX) / pw) * 100;
      const dy = ((e.clientY - dragging.startY) / ph) * 100;
      setLocalOverlays(prev => prev.map(el => {
        if (el.id !== dragging.elId) return el;
        if (dragging.kind === 'resize') {
          const nw = Math.max(40, dragging.startW + dx * (pw / 100));
          const nh = Math.max(40, dragging.startH + dy * (ph / 100));
          return { ...el, w: Math.round(nw), h: Math.round(nh) };
        }
        return { ...el, x: Math.max(2, Math.min(95, dragging.startElX + dx)), y: Math.max(2, Math.min(95, dragging.startElY + dy)) };
      }));
    };
    const onUp = () => {
      setDragging(null);
      persistOverlays(overlayRef.current);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [dragging]);

  // ── Cover generation ──
  const generateCover = async () => {
    setGenerating(true); setError('');
    try {
      const res = await base44.functions.invoke('generateCoverPage', {
        report_id: reportId, type, custom_prompt: prompt || undefined,
        reference_image_url: imageUrl || undefined,
        front_cover_url: type !== 'front' ? report?.cover_image || undefined : undefined
      });
      if (res.data?.url) await onUpdate({ [FIELD_MAP[type]]: res.data.url });
      else setError(res.data?.error || 'No image returned');
    } catch (err) { setError(err?.response?.data?.error || err?.message || 'Generation failed'); }
    setGenerating(false);
  };

  const undoCover = () => onUpdate({ [FIELD_MAP[type]]: null });
  const deleteCover = () => onUpdate({ [FIELD_MAP[type]]: '' });
  const uploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await onUpdate({ [FIELD_MAP[type]]: file_url });
  };

  const favouriteCover = () => {
    if (!imageUrl) return;
    setFavouriting(true);
    const newFav = { id: Date.now().toString(), cover_type: type, image_url: imageUrl, label: `${label} — ${new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` };
    onFavouritesChange([newFav, ...favourites]);
    setTimeout(() => setFavouriting(false), 600);
  };
  const pickFavourite = (fav) => onUpdate({ [FIELD_MAP[type]]: fav.image_url });
  const removeFavourite = (favId) => onFavouritesChange(favourites.filter(f => f.id !== favId));

  const fontFamilies = ['Inter', 'Georgia', 'Montserrat', 'Playfair Display', 'Nunito', 'Roboto', 'Arial'];

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold">{label} (8.5″ × 11″)</Label>

      {imageUrl ? (
        <div>
          {/* Cover preview with overlays */}
          <div className="relative rounded-lg overflow-hidden border bg-slate-100" onClick={() => setSelectedId(null)}>
            <div ref={containerRef} className="aspect-[8.5/11] w-full relative">
              <img src={imageUrl} alt={label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />

              {localOverlays.map(el => {
                if (el.type === 'text') {
                  const isSelected = selectedId === el.id && !dragging;
                  return (
                    <div key={el.id}
                      className={`group absolute select-none ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                      style={{
                        left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)',
                        width: `${el.w || 280}px`, minHeight: el.h ? `${el.h}px` : undefined,
                        cursor: dragging?.elId === el.id ? 'grabbing' : 'grab',
                        fontSize: `${el.font_size || 20}px`, fontFamily: el.font_family || 'Inter',
                        color: el.color || '#fff', fontWeight: el.bold ? 'bold' : 'normal',
                        fontStyle: el.italic ? 'italic' : 'normal', textDecoration: el.underline ? 'underline' : 'none',
                        textAlign: el.align || 'center', textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        lineHeight: 1.3, whiteSpace: 'pre-line', wordBreak: 'break-word',
                        zIndex: isSelected ? 20 : 10,
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => { e.stopPropagation(); setSelectedId(el.id); startDrag(e, el.id, 'move'); }}
                    >
                      {el.content}
                      {/* Resize handle — visible on group hover or when selected */}
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 bg-blue-400 border-2 border-white rounded-full cursor-se-resize shadow-sm transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-90'}`}
                        onPointerDown={(e) => { e.stopPropagation(); startDrag(e, el.id, 'resize'); }}
                      />
                    </div>
                  );
                }
                if (el.type === 'image') {
                  const isSelected = selectedId === el.id && !dragging;
                  return (
                    <div key={el.id}
                      className={`group absolute ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                      style={{
                        left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)',
                        width: `${el.w || 160}px`, height: `${el.h || 160}px`,
                        cursor: dragging?.elId === el.id ? 'grabbing' : 'grab', zIndex: isSelected ? 20 : 10,
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => { e.stopPropagation(); setSelectedId(el.id); startDrag(e, el.id, 'move'); }}
                    >
                      <img src={el.url} alt="" className="w-full h-full object-cover rounded" />
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 bg-blue-400 border-2 border-white rounded-full cursor-se-resize shadow-sm transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-90'}`}
                        onPointerDown={(e) => { e.stopPropagation(); startDrag(e, el.id, 'resize'); }}
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Cover action buttons */}
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

          {/* Add overlay buttons */}
          <div className="flex gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={addTextBox} className="gap-1 text-xs"><Type className="w-3 h-3" />Add Text Box</Button>
            <label className="cursor-pointer">
              <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild><span><Image className="w-3 h-3" />Add Image</span></Button>
              <input type="file" accept="image/*" className="hidden" onChange={addImage} />
            </label>
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

      {/* Selected element toolbar */}
      {selectedEl && imageUrl && (
        <ElementToolbar el={selectedEl} onUpdate={(patch) => updateElement(selectedEl.id, patch)} onDelete={() => deleteElement(selectedEl.id)}
          onCrop={() => setCropTarget(selectedEl)} fontFamilies={fontFamilies} />
      )}

      <div>
        <Label className="text-xs text-muted-foreground">Custom prompt (optional)</Label>
        <Textarea rows={2} value={prompt} onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateCover(); } }}
          placeholder="Additional instructions for the AI... (press Enter to regenerate)" className="mt-1 text-xs" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Crop dialog */}
      {cropTarget && (
        <CropDialog imageUrl={cropTarget.url} onSave={async (blob) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
          updateElement(cropTarget.id, { url: file_url });
          setCropTarget(null);
        }} onClose={() => setCropTarget(null)} />
      )}

      {/* Favourites */}
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

function ElementToolbar({ el, onUpdate, onDelete, onCrop, fontFamilies }) {
  const [text, setText] = useState(el.content || '');
  const [applied, setApplied] = useState(true);

  useEffect(() => { setText(el.content || ''); setApplied(true); }, [el.id, el.content]);

  if (el.type === 'text') {
    const applyText = () => { onUpdate({ content: text }); setApplied(true); };
    return (
      <div className="border rounded-lg p-2 space-y-2 bg-blue-50/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Text Box</span>
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-6 w-6 p-0 text-red-400 hover:text-red-600"><X className="w-3 h-3" /></Button>
        </div>
        <div className="flex items-start gap-1">
          <Textarea rows={2} value={text} onChange={e => { setText(e.target.value); setApplied(false); }}
            className="text-xs flex-1" placeholder="Text content..." />
          {!applied && (
            <Button size="icon" variant="outline" onClick={applyText} className="h-8 w-8 shrink-0 text-green-600" title="Apply"><Check className="w-3.5 h-3.5" /></Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <select value={el.font_family || 'Inter'} onChange={e => onUpdate({ font_family: e.target.value })} className="text-xs border rounded px-1 py-0.5 h-7 bg-white">
            {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={el.font_size || 20} onChange={e => onUpdate({ font_size: parseInt(e.target.value) })} className="text-xs border rounded px-1 py-0.5 h-7 bg-white w-16">
            {[12,14,16,18,20,24,28,32,36,42,48,56,64,72].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="color" value={el.color || '#ffffff'} onChange={e => onUpdate({ color: e.target.value })} className="w-7 h-7 rounded border cursor-pointer p-0.5" />
          <Button size="icon" variant={el.bold ? 'default' : 'outline'} onClick={() => onUpdate({ bold: !el.bold })} className="h-7 w-7"><Bold className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant={el.italic ? 'default' : 'outline'} onClick={() => onUpdate({ italic: !el.italic })} className="h-7 w-7"><Italic className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant={el.underline ? 'default' : 'outline'} onClick={() => onUpdate({ underline: !el.underline })} className="h-7 w-7"><Underline className="w-3.5 h-3.5" /></Button>
          <span className="w-px h-5 bg-border mx-0.5" />
          <Button size="icon" variant={el.align === 'left' ? 'default' : 'outline'} onClick={() => onUpdate({ align: 'left' })} className="h-7 w-7"><AlignLeft className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant={el.align === 'center' ? 'default' : 'outline'} onClick={() => onUpdate({ align: 'center' })} className="h-7 w-7"><AlignCenter className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant={el.align === 'right' ? 'default' : 'outline'} onClick={() => onUpdate({ align: 'right' })} className="h-7 w-7"><AlignRight className="w-3.5 h-3.5" /></Button>
        </div>
        <p className="text-[10px] text-muted-foreground">Drag to reposition • Drag corner to resize</p>
      </div>
    );
  }

  // Image element toolbar
  return (
    <div className="border rounded-lg p-2 space-y-2 bg-blue-50/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Image</span>
        <Button variant="ghost" size="sm" onClick={onDelete} className="h-6 w-6 p-0 text-red-400 hover:text-red-600"><X className="w-3 h-3" /></Button>
      </div>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={onCrop} className="gap-1 text-xs"><Crop className="w-3 h-3" />Crop</Button>
      </div>
      <p className="text-[10px] text-muted-foreground">Drag to reposition • Drag corner to resize</p>
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