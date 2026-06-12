import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ── Helper: render an emoji as a high-res image via Google Noto Emoji ────────
// Converts an emoji to its Unicode codepoints for the Noto CDN URL
function emojiToCDNUrl(emoji) {
  const codePoints = [...emoji]
    .map(c => c.codePointAt(0).toString(16).padStart(4, '0'))
    .filter(c => c !== 'fe0f') // strip variation selector
    .join('_');
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${codePoints}/emoji.svg`;
}

// ── Sticker catalogue ────────────────────────────────────────────────────────
// Each item: { id, label, emoji, type: 'emoji'|'svg' }
// 'emoji' type = rendered via Noto SVG for crisp quality
// For face overlays we use dedicated transparent PNGs from open sources
const CATEGORIES = [
  {
    label: '🎩 Hats',
    items: [
      { id: 'tophat',       label: 'Top Hat',       src: 'https://em-content.zobj.net/thumbs/240/google/350/top-hat_1f3a9.png' },
      { id: 'crown',        label: 'Crown',         src: 'https://em-content.zobj.net/thumbs/240/google/350/crown_1f451.png' },
      { id: 'cowboy',       label: 'Cowboy Hat',    src: 'https://em-content.zobj.net/thumbs/240/google/350/cowboy-hat-face_1f920.png' },
      { id: 'graduation',   label: 'Grad Cap',      src: 'https://em-content.zobj.net/thumbs/240/google/350/graduation-cap_1f393.png' },
      { id: 'beret',        label: 'Beret',         src: 'https://em-content.zobj.net/thumbs/240/google/350/beret_1fa96.png' },
      { id: 'helmet',       label: 'Helmet',        src: 'https://em-content.zobj.net/thumbs/240/google/350/military-helmet_1fa96.png' },
      { id: 'tophat2',      label: 'Witch Hat',     src: 'https://em-content.zobj.net/thumbs/240/google/350/witch_1f9d9.png' },
      { id: 'santa_hat',    label: 'Santa Hat',     src: 'https://em-content.zobj.net/thumbs/240/google/350/santa-claus_1f385.png' },
      { id: 'party_hat',    label: 'Party Hat',     src: 'https://em-content.zobj.net/thumbs/240/google/350/partying-face_1f973.png' },
      { id: 'pirate',       label: 'Pirate',        src: 'https://em-content.zobj.net/thumbs/240/google/350/pirate-flag_1f3f4-200d-2620-fe0f.png' },
      { id: 'detective',    label: 'Detective',     src: 'https://em-content.zobj.net/thumbs/240/google/350/detective_1f575.png' },
      { id: 'chef',         label: 'Chef Hat',      src: 'https://em-content.zobj.net/thumbs/240/google/350/cook_1f9d1-200d-1f373.png' },
    ],
  },
  {
    label: '👓 Eyewear',
    items: [
      { id: 'sunglasses',   label: 'Sunglasses',    src: 'https://em-content.zobj.net/thumbs/240/google/350/sunglasses_1f576.png' },
      { id: 'glasses',      label: 'Glasses',       src: 'https://em-content.zobj.net/thumbs/240/google/350/glasses_1f453.png' },
      { id: 'goggles',      label: 'Goggles',       src: 'https://em-content.zobj.net/thumbs/240/google/350/goggles_1f97d.png' },
      { id: 'monocle',      label: 'Monocle',       src: 'https://em-content.zobj.net/thumbs/240/google/350/face-with-monocle_1f9d0.png' },
      { id: 'nerd_glasses', label: 'Nerd',          src: 'https://em-content.zobj.net/thumbs/240/google/350/nerd-face_1f913.png' },
      { id: 'star_glasses', label: 'Star Glasses',  src: 'https://em-content.zobj.net/thumbs/240/google/350/star-struck_1f929.png' },
    ],
  },
  {
    label: '🥸 Facial Hair',
    items: [
      { id: 'moustache',    label: 'Moustache',     src: 'https://em-content.zobj.net/thumbs/240/google/350/moustache_1f9f4.png' },
      { id: 'beard',        label: 'Full Beard',    src: 'https://em-content.zobj.net/thumbs/240/google/350/man-beard_1f9d4.png' },
      { id: 'beard_w',      label: 'Beard (F)',     src: 'https://em-content.zobj.net/thumbs/240/google/350/woman-beard_1f9d4-200d-2640-fe0f.png' },
      { id: 'santa_beard',  label: 'Santa Beard',   src: 'https://em-content.zobj.net/thumbs/240/google/350/santa-claus_1f385.png' },
      { id: 'curly_face',   label: 'Fancy Stache',  src: 'https://em-content.zobj.net/thumbs/240/google/350/face-with-open-mouth_1f62e.png' },
    ],
  },
  {
    label: '💇 Hair',
    items: [
      { id: 'curly_hair',   label: 'Curly',         src: 'https://em-content.zobj.net/thumbs/240/google/350/woman-curly-hair_1f469-200d-1f9b1.png' },
      { id: 'red_hair',     label: 'Red Hair',      src: 'https://em-content.zobj.net/thumbs/240/google/350/woman-red-hair_1f469-200d-1f9b0.png' },
      { id: 'white_hair',   label: 'White Hair',    src: 'https://em-content.zobj.net/thumbs/240/google/350/woman-white-hair_1f469-200d-1f9b3.png' },
      { id: 'afro',         label: 'Afro',          src: 'https://em-content.zobj.net/thumbs/240/google/350/woman-curly-hair_1f469-200d-1f9b1.png' },
      { id: 'bald',         label: 'Bald',          src: 'https://em-content.zobj.net/thumbs/240/google/350/person-bald_1f9d1-200d-1f9b2.png' },
      { id: 'elf',          label: 'Elf',           src: 'https://em-content.zobj.net/thumbs/240/google/350/elf_1f9dd.png' },
    ],
  },
  {
    label: '🪢 Accessories',
    items: [
      { id: 'bowtie',       label: 'Bow Tie',       src: 'https://em-content.zobj.net/thumbs/240/google/350/bow-and-arrow_1f3f9.png' },
      { id: 'necktie',      label: 'Neck Tie',      src: 'https://em-content.zobj.net/thumbs/240/google/350/necktie_1f454.png' },
      { id: 'scarf',        label: 'Scarf',         src: 'https://em-content.zobj.net/thumbs/240/google/350/scarf_1f9e3.png' },
      { id: 'handbag',      label: 'Handbag',       src: 'https://em-content.zobj.net/thumbs/240/google/350/handbag_1f45c.png' },
      { id: 'crown2',       label: 'Tiara',         src: 'https://em-content.zobj.net/thumbs/240/google/350/crown_1f451.png' },
      { id: 'medal',        label: 'Medal',         src: 'https://em-content.zobj.net/thumbs/240/google/350/sports-medal_1f3c5.png' },
    ],
  },
  {
    label: '💎 Jewelry',
    items: [
      { id: 'ring',         label: 'Ring',          src: 'https://em-content.zobj.net/thumbs/240/google/350/ring_1f48d.png' },
      { id: 'gem',          label: 'Gem',           src: 'https://em-content.zobj.net/thumbs/240/google/350/gem-stone_1f48e.png' },
      { id: 'necklace',     label: 'Necklace',      src: 'https://em-content.zobj.net/thumbs/240/google/350/beads_1f9ff.png' },
      { id: 'earrings',     label: 'Earrings',      src: 'https://em-content.zobj.net/thumbs/240/google/350/crystal-ball_1f52e.png' },
      { id: 'diamond',      label: 'Diamond',       src: 'https://em-content.zobj.net/thumbs/240/google/350/diamond-with-a-dot_1f4a0.png' },
      { id: 'heart_charm',  label: 'Heart Charm',   src: 'https://em-content.zobj.net/thumbs/240/google/350/sparkling-heart_1f496.png' },
      { id: 'id_badge',     label: 'Badge',         src: 'https://em-content.zobj.net/thumbs/240/google/350/id-button_1f194.png' },
      { id: 'chain',        label: 'Chain',         src: 'https://em-content.zobj.net/thumbs/240/google/350/link_1f517.png' },
    ],
  },
  {
    label: '💉 Piercings',
    items: [
      { id: 'nose_ring',    label: 'Nose Ring',     src: 'https://em-content.zobj.net/thumbs/240/google/350/ring_1f48d.png' },
      { id: 'ear_stud',     label: 'Ear Stud',      src: 'https://em-content.zobj.net/thumbs/240/google/350/diamond-with-a-dot_1f4a0.png' },
      { id: 'lip_ring',     label: 'Lip Ring',      src: 'https://em-content.zobj.net/thumbs/240/google/350/o-button_1f17e.png' },
      { id: 'eyebrow',      label: 'Eyebrow Bar',   src: 'https://em-content.zobj.net/thumbs/240/google/350/minus_2796.png' },
    ],
  },
  {
    label: '🖋️ Tattoos',
    items: [
      { id: 'tattoo_heart', label: 'Heart',         src: 'https://em-content.zobj.net/thumbs/240/google/350/heart-suit_2665.png' },
      { id: 'tattoo_anchor',label: 'Anchor',        src: 'https://em-content.zobj.net/thumbs/240/google/350/anchor_2693.png' },
      { id: 'tattoo_snake', label: 'Snake',         src: 'https://em-content.zobj.net/thumbs/240/google/350/snake_1f40d.png' },
      { id: 'tattoo_rose',  label: 'Rose',          src: 'https://em-content.zobj.net/thumbs/240/google/350/rose_1f339.png' },
      { id: 'tattoo_skull', label: 'Skull',         src: 'https://em-content.zobj.net/thumbs/240/google/350/skull_1f480.png' },
      { id: 'tattoo_star',  label: 'Star',          src: 'https://em-content.zobj.net/thumbs/240/google/350/star_2b50.png' },
      { id: 'tattoo_lightning', label: 'Lightning', src: 'https://em-content.zobj.net/thumbs/240/google/350/high-voltage_26a1.png' },
      { id: 'tattoo_infinity', label: 'Infinity',   src: 'https://em-content.zobj.net/thumbs/240/google/350/infinity_267e.png' },
      { id: 'tattoo_dragon',label: 'Dragon',        src: 'https://em-content.zobj.net/thumbs/240/google/350/dragon_1f409.png' },
    ],
  },
  {
    label: '✨ Effects',
    items: [
      { id: 'sparkles',     label: 'Sparkles',      src: 'https://em-content.zobj.net/thumbs/240/google/350/sparkles_2728.png' },
      { id: 'fire',         label: 'Fire',          src: 'https://em-content.zobj.net/thumbs/240/google/350/fire_1f525.png' },
      { id: 'rainbow',      label: 'Rainbow',       src: 'https://em-content.zobj.net/thumbs/240/google/350/rainbow_1f308.png' },
      { id: 'stars',        label: 'Stars',         src: 'https://em-content.zobj.net/thumbs/240/google/350/shooting-star_1f320.png' },
      { id: 'halo',         label: 'Halo',          src: 'https://em-content.zobj.net/thumbs/240/google/350/smiling-face-with-halo_1f607.png' },
      { id: 'devil_horns',  label: 'Devil',         src: 'https://em-content.zobj.net/thumbs/240/google/350/smiling-face-with-horns_1f608.png' },
      { id: 'aura',         label: 'Aura',          src: 'https://em-content.zobj.net/thumbs/240/google/350/dizzy_1f4ab.png' },
      { id: 'glitter',      label: 'Glitter',       src: 'https://em-content.zobj.net/thumbs/240/google/350/glowing-star_1f31f.png' },
      { id: 'confetti',     label: 'Confetti',      src: 'https://em-content.zobj.net/thumbs/240/google/350/confetti-ball_1f38a.png' },
      { id: 'sunburst',     label: 'Sunburst',      src: 'https://em-content.zobj.net/thumbs/240/google/350/sun-with-face_1f31e.png' },
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
        crossOrigin="anonymous"
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
                    <img src={s.src} alt={s.label} className="w-4 h-4 object-contain" crossOrigin="anonymous" />
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
                    crossOrigin="anonymous"
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