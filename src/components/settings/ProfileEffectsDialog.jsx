import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ── Twemoji CDN helper — reliable transparent PNGs, no CORS issues ───────────
// Converts an emoji character to its Twemoji PNG URL
function tw(emoji) {
  const cp = [...emoji]
    .map(c => c.codePointAt(0).toString(16))
    .filter(c => c !== 'fe0f')
    .join('-');
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${cp}.png`;
}

const CATEGORIES = [
  {
    label: '🎩 Hats',
    items: [
      { id: 'tophat',      label: 'Top Hat',     src: tw('🎩') },
      { id: 'crown',       label: 'Crown',       src: tw('👑') },
      { id: 'graduation',  label: 'Grad Cap',    src: tw('🎓') },
      { id: 'beret',       label: 'Beret',       src: tw('🪖') },
      { id: 'helmet',      label: 'Hard Hat',    src: tw('⛑️') },
    ],
  },
  {
    label: '👓 Eyewear',
    items: [
      { id: 'sunglasses',  label: 'Sunglasses',  src: tw('🕶️') },
      { id: 'glasses',     label: 'Glasses',     src: tw('👓') },
      { id: 'goggles',     label: 'Goggles',     src: tw('🥽') },
    ],
  },
  {
    label: '🥸 Facial Hair',
    items: [
      { id: 'moustache',   label: 'Moustache',   src: tw('👨') },
      { id: 'beard',       label: 'Beard',       src: tw('🧔') },
    ],
  },
  {
    label: '🪢 Accessories',
    items: [
      { id: 'necktie',     label: 'Neck Tie',    src: tw('👔') },
      { id: 'scarf',       label: 'Scarf',       src: tw('🧣') },
      { id: 'gloves',      label: 'Gloves',      src: tw('🧤') },
      { id: 'handbag',     label: 'Handbag',     src: tw('👜') },
      { id: 'backpack',    label: 'Backpack',    src: tw('🎒') },
      { id: 'medal',       label: 'Medal',       src: tw('🏅') },
      { id: 'ribbon',      label: 'Ribbon',      src: tw('🎀') },
    ],
  },
  {
    label: '💎 Jewelry',
    items: [
      { id: 'ring',        label: 'Ring',        src: tw('💍') },
      { id: 'gem',         label: 'Gem',         src: tw('💎') },
      { id: 'necklace',    label: 'Beads',       src: tw('📿') },
      { id: 'heart_charm', label: 'Heart',       src: tw('💖') },
      { id: 'chain',       label: 'Chain',       src: tw('🔗') },
    ],
  },
  {
    label: '💉 Piercings',
    items: [
      { id: 'nose_ring',   label: 'Nose Ring',   src: tw('💍') },
      { id: 'ear_stud',    label: 'Ear Stud',    src: tw('🔘') },
      { id: 'gem_stud',    label: 'Gem Stud',    src: tw('💎') },
    ],
  },
  {
    label: '🖋️ Tattoos',
    items: [
      { id: 'tattoo_heart',    label: 'Heart',     src: tw('❤️') },
      { id: 'tattoo_anchor',   label: 'Anchor',    src: tw('⚓') },
      { id: 'tattoo_snake',    label: 'Snake',     src: tw('🐍') },
      { id: 'tattoo_rose',     label: 'Rose',      src: tw('🌹') },
      { id: 'tattoo_skull',    label: 'Skull',     src: tw('💀') },
      { id: 'tattoo_star',     label: 'Star',      src: tw('⭐') },
      { id: 'tattoo_lightning',label: 'Lightning', src: tw('⚡') },
      { id: 'tattoo_infinity', label: 'Infinity',  src: tw('♾️') },
      { id: 'tattoo_dragon',   label: 'Dragon',    src: tw('🐉') },
      { id: 'tattoo_butterfly',label: 'Butterfly', src: tw('🦋') },
      { id: 'tattoo_lion',     label: 'Lion',      src: tw('🦁') },
      { id: 'tattoo_wolf',     label: 'Wolf',      src: tw('🐺') },
      { id: 'tattoo_flame',    label: 'Flame',     src: tw('🔥') },
      { id: 'tattoo_moon',     label: 'Moon',      src: tw('🌙') },
      { id: 'tattoo_compass',  label: 'Compass',   src: tw('🧭') },
      { id: 'tattoo_feather',  label: 'Feather',   src: tw('🪶') },
      { id: 'tattoo_sword',    label: 'Sword',     src: tw('⚔️') },
      { id: 'tattoo_eye',      label: 'Eye',       src: tw('👁️') },
    ],
  },
];

// ── Draggable sticker overlay ────────────────────────────────────────────────
function StickerOverlay({ sticker, isSelected, onSelect, onUpdate, onDelete, containerSize }) {
  const dragStart = useRef(null);
  const rotateStart = useRef(null);
  const resizeStart = useRef(null);

  const handleDragMouseDown = (e) => {
    e.stopPropagation();
    onSelect(sticker.id);
    dragStart.current = { mx: e.clientX, my: e.clientY, sx: sticker.x, sy: sticker.y };
    const onMove = (mv) => {
      const dx = (mv.clientX - dragStart.current.mx) / containerSize;
      const dy = (mv.clientY - dragStart.current.my) / containerSize;
      onUpdate(sticker.id, { x: dragStart.current.sx + dx, y: dragStart.current.sy + dy });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTouchDrag = (e) => {
    e.stopPropagation();
    onSelect(sticker.id);
    const t = e.touches[0];
    dragStart.current = { mx: t.clientX, my: t.clientY, sx: sticker.x, sy: sticker.y };
    const onMove = (mv) => {
      const touch = mv.touches[0];
      const dx = (touch.clientX - dragStart.current.mx) / containerSize;
      const dy = (touch.clientY - dragStart.current.my) / containerSize;
      onUpdate(sticker.id, { x: dragStart.current.sx + dx, y: dragStart.current.sy + dy });
    };
    const onEnd = () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  };

  const handleRotateMouseDown = (e) => {
    e.stopPropagation();
    const cx = sticker.x * containerSize;
    const cy = sticker.y * containerSize;
    rotateStart.current = { startAngle: Math.atan2(e.clientY - cy, e.clientX - cx), origRot: sticker.rotation || 0 };
    const onMove = (mv) => {
      const angle = Math.atan2(mv.clientY - cy, mv.clientX - cx);
      const delta = (angle - rotateStart.current.startAngle) * (180 / Math.PI);
      onUpdate(sticker.id, { rotation: rotateStart.current.origRot + delta });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    resizeStart.current = { mx: e.clientX, origSize: sticker.size };
    const onMove = (mv) => {
      const delta = (mv.clientX - resizeStart.current.mx) / containerSize;
      const newSize = Math.max(0.05, Math.min(1.0, resizeStart.current.origSize + delta));
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
        src={sticker.src}
        alt={sticker.label}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none', imageRendering: 'crisp-edges' }}
        draggable={false}
      />

      {isSelected && (
        <>
          <div style={{ position: 'absolute', inset: -3, border: '2px dashed rgba(99,102,241,0.9)', borderRadius: 6, pointerEvents: 'none' }} />
          {/* Delete */}
          <button
            onMouseDown={(e) => { e.stopPropagation(); onDelete(sticker.id); }}
            style={{ position: 'absolute', top: -14, right: -14, width: 24, height: 24, borderRadius: '50%', background: '#ef4444', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 'bold', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
          >✕</button>
          {/* Rotate */}
          <div
            onMouseDown={handleRotateMouseDown}
            style={{ position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)', width: 22, height: 22, borderRadius: '50%', background: '#6366f1', border: '2px solid white', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
            title="Rotate"
          >↻</div>
          {/* Resize */}
          <div
            onMouseDown={handleResizeMouseDown}
            style={{ position: 'absolute', bottom: -12, right: -12, width: 22, height: 22, borderRadius: '50%', background: '#6366f1', border: '2px solid white', cursor: 'se-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
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
    if (open) { setStickers([]); setSelectedId(null); }
  }, [open, imageSrc]);

  const addSticker = (item) => {
    const id = `${item.id}_${Date.now()}`;
    setStickers(prev => [...prev, { ...item, id, x: 0.5, y: 0.35, size: 0.3, rotation: 0 }]);
    setSelectedId(id);
  };

  const updateSticker = (id, changes) => setStickers(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
  const deleteSticker = (id) => { setStickers(prev => prev.filter(s => s.id !== id)); if (selectedId === id) setSelectedId(null); };

  const exportImage = useCallback(() => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      const size = 400;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const scale = size / CONTAINER_SIZE;

      const baseImg = new Image();
      baseImg.crossOrigin = 'anonymous';
      baseImg.onload = async () => {
        ctx.drawImage(baseImg, 0, 0, size, size);
        // Draw each sticker
        for (const s of stickers) {
          await new Promise((res) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const cx = s.x * size;
              const cy = s.y * size;
              const sizePx = s.size * CONTAINER_SIZE * scale;
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(((s.rotation || 0) * Math.PI) / 180);
              ctx.drawImage(img, -sizePx / 2, -sizePx / 2, sizePx, sizePx);
              ctx.restore();
              res();
            };
            img.onerror = () => res(); // skip if fails
            img.src = s.src;
          });
        }
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      baseImg.onerror = reject;
      baseImg.src = imageSrc;
    });
  }, [stickers, imageSrc]);

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto flex flex-col gap-4 p-4">
        <DialogHeader>
          <DialogTitle>Add Fun Effects 🎨</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-5">
          {/* Preview */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div
              onClick={() => setSelectedId(null)}
              style={{
                width: CONTAINER_SIZE, height: CONTAINER_SIZE,
                position: 'relative', borderRadius: '50%',
                overflow: 'hidden', border: '3px solid #e2e8f0', flexShrink: 0,
              }}
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
                ? 'Drag to move · ↻ handle to rotate · ⤡ handle to resize · ✕ to remove'
                : 'Click any item below to add it to your photo'}
            </p>
            {stickers.length > 0 && (
              <div className="flex flex-wrap gap-1 max-w-[380px]">
                {stickers.map(s => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border cursor-pointer transition-colors ${selectedId === s.id ? 'border-accent bg-accent/10 text-accent-foreground' : 'border-border hover:border-accent/50'}`}
                  >
                    <img src={s.src} alt={s.label} className="w-4 h-4 object-contain" />
                    <span>{s.label}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteSticker(s.id); }} className="text-muted-foreground hover:text-destructive ml-0.5 leading-none">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Picker */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCategory(i)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${activeCategory === i ? 'bg-accent text-accent-foreground border-accent' : 'border-border hover:border-accent/50 bg-background'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-4 gap-2 mt-1 overflow-y-auto max-h-[320px] pr-1">
              {CATEGORIES[activeCategory].items.map(item => (
                <button
                  key={item.id}
                  onClick={() => addSticker(item)}
                  title={item.label}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border hover:border-accent/70 hover:bg-accent/5 transition-all hover:scale-105 active:scale-95"
                >
                  <img
                    src={item.src}
                    alt={item.label}
                    className="w-12 h-12 object-contain"
                    loading="lazy"
                  />
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
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