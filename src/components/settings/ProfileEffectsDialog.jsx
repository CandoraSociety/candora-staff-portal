import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { CATEGORIES } from './stickerCatalogue';

// Convert an SVG string to a data URL
function svgToDataUrl(svgStr) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
}

// ── Individual draggable sticker ─────────────────────────────────────────────
function StickerOverlay({ sticker, isSelected, onSelect, onUpdate, onDelete, containerSize }) {
  const handleDragMouseDown = (e) => {
    e.stopPropagation();
    onSelect(sticker.id);
    const startMx = e.clientX, startMy = e.clientY;
    const startSx = sticker.x, startSy = sticker.y;
    const onMove = (mv) => {
      onUpdate(sticker.id, {
        x: startSx + (mv.clientX - startMx) / containerSize,
        y: startSy + (mv.clientY - startMy) / containerSize,
      });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTouchDrag = (e) => {
    e.stopPropagation();
    onSelect(sticker.id);
    const t = e.touches[0];
    const startMx = t.clientX, startMy = t.clientY;
    const startSx = sticker.x, startSy = sticker.y;
    const onMove = (mv) => {
      const touch = mv.touches[0];
      onUpdate(sticker.id, {
        x: startSx + (touch.clientX - startMx) / containerSize,
        y: startSy + (touch.clientY - startMy) / containerSize,
      });
    };
    const onEnd = () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  };

  const handleRotateMouseDown = (e) => {
    e.stopPropagation();
    const cx = sticker.x * containerSize;
    const cy = sticker.y * containerSize;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    const origRot = sticker.rotation || 0;
    const onMove = (mv) => {
      const angle = Math.atan2(mv.clientY - cy, mv.clientX - cx);
      onUpdate(sticker.id, { rotation: origRot + (angle - startAngle) * (180 / Math.PI) });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    const startMx = e.clientX;
    const origSize = sticker.size;
    const onMove = (mv) => {
      const newSize = Math.max(0.05, Math.min(0.9, origSize + (mv.clientX - startMx) / containerSize));
      onUpdate(sticker.id, { size: newSize });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const px = sticker.x * containerSize;
  const py = sticker.y * containerSize;
  const sizePx = sticker.size * containerSize;
  const rot = sticker.rotation || 0;

  return (
    <div
      style={{
        position: 'absolute', left: px, top: py,
        width: sizePx, height: sizePx,
        transform: `translate(-50%, -50%) rotate(${rot}deg)`,
        cursor: 'grab', userSelect: 'none',
        zIndex: isSelected ? 10 : 5, touchAction: 'none',
      }}
      onMouseDown={handleDragMouseDown}
      onTouchStart={handleTouchDrag}
      onClick={(e) => { e.stopPropagation(); onSelect(sticker.id); }}
    >
      <img
        src={svgToDataUrl(sticker.svg)}
        alt={sticker.label}
        style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
        draggable={false}
      />

      {isSelected && (
        <>
          <div style={{ position: 'absolute', inset: -3, border: '2px dashed #6366f1', borderRadius: 4, pointerEvents: 'none' }} />
          {/* Delete */}
          <button
            onMouseDown={(e) => { e.stopPropagation(); onDelete(sticker.id); }}
            style={{ position: 'absolute', top: -12, right: -12, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 'bold' }}
          >×</button>
          {/* Rotate */}
          <div
            onMouseDown={handleRotateMouseDown}
            style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', width: 18, height: 18, borderRadius: '50%', background: '#6366f1', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white' }}
            title="Rotate"
          >↻</div>
          {/* Resize */}
          <div
            onMouseDown={handleResizeMouseDown}
            style={{ position: 'absolute', bottom: -10, right: -10, width: 18, height: 18, borderRadius: '50%', background: '#6366f1', cursor: 'se-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white' }}
            title="Resize"
          >⤡</div>
        </>
      )}
    </div>
  );
}

// ── Main dialog ──────────────────────────────────────────────────────────────
export default function ProfileEffectsDialog({ open, imageSrc, onSave, onClose }) {
  const canvasRef = useRef(null);
  const [stickers, setStickers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const CONTAINER_SIZE = 380;

  useEffect(() => {
    if (open) { setStickers([]); setSelectedId(null); setActiveCategory(0); }
  }, [open, imageSrc]);

  const addSticker = (item) => {
    const id = `${item.id}_${Date.now()}`;
    setStickers(prev => [...prev, {
      ...item,
      id,
      x: item.defaultX ?? 0.5,
      y: item.defaultY ?? 0.35,
      size: item.defaultSize ?? 0.28,
      rotation: 0,
    }]);
    setSelectedId(id);
  };

  const updateSticker = (id, changes) => setStickers(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
  const deleteSticker = (id) => { setStickers(prev => prev.filter(s => s.id !== id)); if (selectedId === id) setSelectedId(null); };

  // Export: draw base image + each sticker onto a canvas
  const exportImage = useCallback(() => new Promise((resolve, reject) => {
    const canvas = canvasRef.current;
    const SIZE = 400;
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.onload = () => {
      ctx.drawImage(baseImg, 0, 0, SIZE, SIZE);
      if (stickers.length === 0) return resolve(canvas.toDataURL('image/jpeg', 0.9));

      let remaining = stickers.length;
      stickers.forEach(s => {
        const img = new Image();
        img.onload = () => {
          const scale = SIZE / CONTAINER_SIZE;
          const cx = s.x * SIZE;
          const cy = s.y * SIZE;
          const sizePx = s.size * CONTAINER_SIZE * scale;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(((s.rotation || 0) * Math.PI) / 180);
          ctx.drawImage(img, -sizePx / 2, -sizePx / 2, sizePx, sizePx);
          ctx.restore();
          remaining--;
          if (remaining === 0) resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = () => { remaining--; if (remaining === 0) resolve(canvas.toDataURL('image/jpeg', 0.9)); };
        img.src = svgToDataUrl(s.svg);
      });
    };
    baseImg.onerror = reject;
    baseImg.src = imageSrc;
  }), [stickers, imageSrc]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataUrl = await exportImage();
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'profile-effect.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await onSave(file_url);
    } catch (err) {
      alert('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const cat = CATEGORIES[activeCategory];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto flex flex-col gap-3 p-4">
        <DialogHeader>
          <DialogTitle>Profile Effects Studio 🎨</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Preview */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div
              onClick={() => setSelectedId(null)}
              style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE, position: 'relative', borderRadius: '50%', overflow: 'hidden', border: '3px solid hsl(var(--border))', flexShrink: 0, cursor: 'default' }}
            >
              {imageSrc && (
                <img src={imageSrc} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
              )}
              {stickers.map(s => (
                <StickerOverlay
                  key={s.id}
                  sticker={s}
                  isSelected={selectedId === s.id}
                  onSelect={setSelectedId}
                  onUpdate={updateSticker}
                  onDelete={deleteSticker}
                  containerSize={CONTAINER_SIZE}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-[380px]">
              {selectedId
                ? 'Drag to move · ↻ to rotate · ⤡ to resize · × to delete'
                : 'Click any item below to add it to your photo'}
            </p>
          </div>

          {/* Picker */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(i)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors whitespace-nowrap ${activeCategory === i ? 'bg-accent text-accent-foreground border-accent' : 'border-border hover:border-accent/50 bg-background'}`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-4 gap-2 mt-1">
              {cat.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => addSticker(item)}
                  title={item.label}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:border-accent/60 hover:bg-accent/5 transition-all hover:scale-105 active:scale-95 bg-background"
                >
                  <img
                    src={svgToDataUrl(item.svg)}
                    alt={item.label}
                    style={{ width: 44, height: 44, objectFit: 'contain' }}
                    draggable={false}
                  />
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center leading-tight">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Placed stickers list */}
            {stickers.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Placed ({stickers.length})</p>
                <div className="flex flex-wrap gap-1">
                  {stickers.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border cursor-pointer transition-colors ${selectedId === s.id ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'}`}
                    >
                      <img src={svgToDataUrl(s.svg)} alt={s.label} style={{ width: 16, height: 16 }} />
                      <span>{s.label}</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteSticker(s.id); }} className="text-muted-foreground hover:text-destructive ml-0.5">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="flex justify-between items-center border-t pt-3">
          <Button variant="outline" size="sm" onClick={() => { setStickers([]); setSelectedId(null); }} disabled={stickers.length === 0}>
            <RotateCcw className="w-4 h-4 mr-1" /> Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}><X className="w-4 h-4 mr-1" /> Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" /> : <Check className="w-4 h-4 mr-1" />}
              {isSaving ? 'Saving...' : 'Save Photo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}