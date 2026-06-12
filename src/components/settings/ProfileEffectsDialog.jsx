import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ── Sticker catalogue ────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    label: '🎩 Hats',
    items: [
      { id: 'tophat',    emoji: '🎩', label: 'Top Hat' },
      { id: 'cowboy',    emoji: '🤠', label: 'Cowboy' },
      { id: 'crown',     emoji: '👑', label: 'Crown' },
      { id: 'beret',     emoji: '🪖', label: 'Helmet' },
      { id: 'wizard',    emoji: '🧙', label: 'Wizard' },
      { id: 'santa',     emoji: '🎅', label: 'Santa' },
      { id: 'party',     emoji: '🥳', label: 'Party' },
      { id: 'pirate',    emoji: '🏴‍☠️', label: 'Pirate' },
    ],
  },
  {
    label: '👓 Eyewear',
    items: [
      { id: 'sunglasses', emoji: '😎', label: 'Sunglasses' },
      { id: 'monocle',   emoji: '🧐', label: 'Monocle' },
      { id: 'nerd',      emoji: '🤓', label: 'Nerd Glasses' },
      { id: 'goggles',   emoji: '🥽', label: 'Goggles' },
    ],
  },
  {
    label: '🥸 Facial Hair',
    items: [
      { id: 'moustache', emoji: '👨', label: 'Moustache' },
      { id: 'beard',     emoji: '🧔', label: 'Beard' },
      { id: 'santa_beard', emoji: '🎅', label: 'Santa Beard' },
      { id: 'walrus',    emoji: '🦭', label: 'Walrus' },
    ],
  },
  {
    label: '💇 Hair',
    items: [
      { id: 'mohawk',    emoji: '🦹', label: 'Hero Hair' },
      { id: 'curly',     emoji: '👩‍🦱', label: 'Curly' },
      { id: 'blonde',    emoji: '👱', label: 'Blonde' },
      { id: 'clown_hair',emoji: '🤡', label: 'Clown' },
    ],
  },
  {
    label: '🪢 Accessories',
    items: [
      { id: 'bowtie',    emoji: '🎀', label: 'Bow Tie' },
      { id: 'tie',       emoji: '👔', label: 'Tie' },
      { id: 'necklace',  emoji: '📿', label: 'Necklace' },
      { id: 'ring',      emoji: '💍', label: 'Ring' },
      { id: 'medal',     emoji: '🥇', label: 'Medal' },
    ],
  },
  {
    label: '✨ Fun',
    items: [
      { id: 'sparkles',  emoji: '✨', label: 'Sparkles' },
      { id: 'fire',      emoji: '🔥', label: 'Fire' },
      { id: 'rainbow',   emoji: '🌈', label: 'Rainbow' },
      { id: 'heart',     emoji: '❤️', label: 'Heart' },
      { id: 'stars',     emoji: '⭐', label: 'Star' },
      { id: 'alien',     emoji: '👽', label: 'Alien' },
      { id: 'devil',     emoji: '😈', label: 'Devil' },
      { id: 'angel',     emoji: '😇', label: 'Angel' },
    ],
  },
];

// ── Individual draggable sticker ─────────────────────────────────────────────
function StickerOverlay({ sticker, isSelected, onSelect, onUpdate, onDelete, containerSize }) {
  const ref = useRef(null);
  const dragStart = useRef(null);
  const rotateStart = useRef(null);
  const resizeStart = useRef(null);

  const handleDragMouseDown = (e) => {
    e.stopPropagation();
    onSelect(sticker.id);
    dragStart.current = {
      mx: e.clientX, my: e.clientY,
      sx: sticker.x, sy: sticker.y,
    };
    const onMove = (mv) => {
      const dx = (mv.clientX - dragStart.current.mx) / containerSize;
      const dy = (mv.clientY - dragStart.current.my) / containerSize;
      onUpdate(sticker.id, { x: dragStart.current.sx + dx, y: dragStart.current.sy + dy });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
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
    const onEnd = () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  };

  const handleRotateMouseDown = (e) => {
    e.stopPropagation();
    const cx = sticker.x * containerSize;
    const cy = sticker.y * containerSize;
    rotateStart.current = {
      startAngle: Math.atan2(e.clientY - cy, e.clientX - cx),
      origRot: sticker.rotation || 0,
    };
    const onMove = (mv) => {
      const angle = Math.atan2(mv.clientY - cy, mv.clientX - cx);
      const delta = (angle - rotateStart.current.startAngle) * (180 / Math.PI);
      onUpdate(sticker.id, { rotation: rotateStart.current.origRot + delta });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    resizeStart.current = { mx: e.clientX, origSize: sticker.size };
    const onMove = (mv) => {
      const delta = (mv.clientX - resizeStart.current.mx) / containerSize;
      const newSize = Math.max(0.05, Math.min(0.8, resizeStart.current.origSize + delta));
      onUpdate(sticker.id, { size: newSize });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const px = sticker.x * containerSize;
  const py = sticker.y * containerSize;
  const sizePx = sticker.size * containerSize;
  const rot = sticker.rotation || 0;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: px,
        top: py,
        width: sizePx,
        height: sizePx,
        transform: `translate(-50%, -50%) rotate(${rot}deg)`,
        cursor: 'grab',
        userSelect: 'none',
        zIndex: isSelected ? 10 : 5,
        touchAction: 'none',
      }}
      onMouseDown={handleDragMouseDown}
      onTouchStart={handleTouchDrag}
      onClick={(e) => { e.stopPropagation(); onSelect(sticker.id); }}
    >
      {/* Emoji */}
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: sizePx * 0.8, lineHeight: 1 }}>
        {sticker.emoji}
      </div>

      {/* Controls — only when selected */}
      {isSelected && (
        <>
          {/* Border */}
          <div style={{ position: 'absolute', inset: 0, border: '2px dashed rgba(99,102,241,0.8)', borderRadius: 4, pointerEvents: 'none' }} />

          {/* Delete */}
          <button
            onMouseDown={(e) => { e.stopPropagation(); onDelete(sticker.id); }}
            style={{ position: 'absolute', top: -12, right: -12, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12 }}
          >✕</button>

          {/* Rotate handle */}
          <div
            onMouseDown={handleRotateMouseDown}
            style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', width: 18, height: 18, borderRadius: '50%', background: '#6366f1', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}
            title="Rotate"
          >↻</div>

          {/* Resize handle */}
          <div
            onMouseDown={handleResizeMouseDown}
            style={{ position: 'absolute', bottom: -10, right: -10, width: 18, height: 18, borderRadius: '50%', background: '#6366f1', cursor: 'se-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white' }}
            title="Resize"
          >⤡</div>
        </>
      )}
    </div>
  );
}

// ── Main dialog ──────────────────────────────────────────────────────────────
export default function ProfileEffectsDialog({ open, imageSrc, onSave, onClose }) {
  const containerRef = useRef(null);
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
    setStickers(prev => [...prev, { ...item, id, x: 0.5, y: 0.35, size: 0.25, rotation: 0 }]);
    setSelectedId(id);
  };

  const updateSticker = (id, changes) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
  };

  const deleteSticker = (id) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleContainerClick = () => setSelectedId(null);

  // Render stickers onto canvas for export
  const exportImage = useCallback(() => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      const size = 400;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);
        const scale = size / CONTAINER_SIZE;
        stickers.forEach(s => {
          const cx = s.x * size;
          const cy = s.y * size;
          const fontSize = s.size * CONTAINER_SIZE * 0.8 * scale;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(((s.rotation || 0) * Math.PI) / 180);
          ctx.font = `${fontSize}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(s.emoji, 0, 0);
          ctx.restore();
        });
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = reject;
      img.src = imageSrc;
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
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto flex flex-col gap-4 p-4">
        <DialogHeader>
          <DialogTitle>Add Fun Effects 🎨</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Preview area */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div
              ref={containerRef}
              onClick={handleContainerClick}
              style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE, position: 'relative', borderRadius: '50%', overflow: 'hidden', border: '3px solid #e2e8f0', flexShrink: 0 }}
            >
              {/* Base image */}
              {imageSrc && (
                <img
                  src={imageSrc}
                  alt="profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                />
              )}
              {/* Stickers as DOM overlays */}
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
            <p className="text-xs text-muted-foreground text-center">
              {selectedId ? 'Drag to move · ↻ to rotate · ⤡ to resize · ✕ to delete' : 'Click a sticker below to add it'}
            </p>
          </div>

          {/* Sticker picker */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCategory(i)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${activeCategory === i ? 'bg-accent text-accent-foreground border-accent' : 'border-border hover:border-accent/50'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-4 gap-2 mt-1">
              {CATEGORIES[activeCategory].items.map(item => (
                <button
                  key={item.id}
                  onClick={() => addSticker(item)}
                  title={item.label}
                  className="flex flex-col items-center gap-0.5 p-2 rounded-lg border border-border hover:border-accent/60 hover:bg-accent/5 transition-all hover:scale-105 active:scale-95"
                >
                  <span style={{ fontSize: 28 }}>{item.emoji}</span>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Sticker list / quick delete */}
            {stickers.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <p className="text-xs text-muted-foreground mb-1">Placed stickers</p>
                <div className="flex flex-wrap gap-1">
                  {stickers.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border cursor-pointer transition-colors ${selectedId === s.id ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'}`}
                    >
                      <span>{s.emoji}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSticker(s.id); }}
                        className="text-muted-foreground hover:text-destructive ml-0.5"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden canvas for export */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="flex justify-between items-center border-t pt-3">
          <Button variant="outline" size="sm" onClick={() => { setStickers([]); setSelectedId(null); }} disabled={stickers.length === 0}>
            <RotateCcw className="w-4 h-4 mr-1" /> Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                : <Check className="w-4 h-4 mr-1" />}
              {isSaving ? 'Saving...' : 'Save Photo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}