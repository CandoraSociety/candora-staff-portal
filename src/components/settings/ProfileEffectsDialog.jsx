import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STICKERS = [
  { id: 'sunglasses', label: '😎', emoji: '😎', defaultSize: 0.5, defaultY: 0.32 },
  { id: 'monocle', label: '🧐', emoji: '🧐', defaultSize: 0.45, defaultY: 0.32 },
  { id: 'moustache', label: '👨', emoji: '👨', defaultSize: 0.5, defaultY: 0.48 },
  { id: 'tophat', label: '🎩', emoji: '🎩', defaultSize: 0.55, defaultY: 0.04 },
  { id: 'cowboy', label: '🤠', emoji: '🤠', defaultSize: 0.55, defaultY: 0.04 },
  { id: 'crown', label: '👑', emoji: '👑', defaultSize: 0.5, defaultY: 0.02 },
  { id: 'partyhat', label: '🎉', emoji: '🎉', defaultSize: 0.45, defaultY: 0.02 },
  { id: 'clown', label: '🤡', emoji: '🤡', defaultSize: 0.5, defaultY: 0.32 },
  { id: 'alien', label: '👽', emoji: '👽', defaultSize: 0.5, defaultY: 0.1 },
  { id: 'devil', label: '😈', emoji: '😈', defaultSize: 0.5, defaultY: 0.05 },
  { id: 'rainbow', label: '🌈', emoji: '🌈', defaultSize: 0.6, defaultY: 0.0 },
  { id: 'fire', label: '🔥', emoji: '🔥', defaultSize: 0.4, defaultY: 0.0 },
  { id: 'sparkles', label: '✨', emoji: '✨', defaultSize: 0.35, defaultY: 0.05 },
  { id: 'heart_eyes', label: '😍', emoji: '😍', defaultSize: 0.5, defaultY: 0.25 },
  { id: 'nerd', label: '🤓', emoji: '🤓', defaultSize: 0.5, defaultY: 0.25 },
  { id: 'pirate', label: '🏴‍☠️', emoji: '🏴‍☠️', defaultSize: 0.45, defaultY: 0.08 },
];

function drawCanvas(canvas, imageSrc, placedStickers) {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      if (placedStickers.length === 0) return resolve();

      let loaded = 0;
      placedStickers.forEach((s) => {
        const stickerSize = Math.round(s.size * size);
        const x = Math.round(s.x * size - stickerSize / 2);
        const y = Math.round(s.y * size - stickerSize / 2);
        ctx.font = `${stickerSize}px serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(s.emoji, x, y);
        loaded++;
        if (loaded === placedStickers.length) resolve();
      });
    };
    img.src = imageSrc;
  });
}

export default function ProfileEffectsDialog({ open, imageSrc, onSave, onClose }) {
  const canvasRef = useRef(null);
  const [placedStickers, setPlacedStickers] = useState([]);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const CANVAS_SIZE = 400;

  useEffect(() => {
    if (open) {
      setPlacedStickers([]);
      setSelectedSticker(null);
    }
  }, [open, imageSrc]);

  useEffect(() => {
    if (!canvasRef.current || !imageSrc) return;
    drawCanvas(canvasRef.current, imageSrc, placedStickers);
  }, [imageSrc, placedStickers]);

  const handleCanvasClick = useCallback((e) => {
    if (!selectedSticker) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPlacedStickers(prev => [...prev, {
      ...selectedSticker,
      x,
      y,
      id: `${selectedSticker.id}_${Date.now()}`,
    }]);
  }, [selectedSticker]);

  const handleAddDefault = (sticker) => {
    setPlacedStickers(prev => [...prev, {
      ...sticker,
      x: 0.5,
      y: sticker.defaultY + sticker.defaultSize / 2,
      id: `${sticker.id}_${Date.now()}`,
    }]);
  };

  const handleUndo = () => {
    setPlacedStickers(prev => prev.slice(0, -1));
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Add Fun Effects 🎨</DialogTitle>
          <DialogDescription>
            Click a sticker to select it, then click on your photo to place it — or double-click a sticker to snap it to a default position.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Canvas */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div
              className={`relative rounded-full overflow-hidden border-4 ${selectedSticker ? 'border-primary cursor-crosshair' : 'border-border cursor-default'}`}
              style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, maxWidth: '100%' }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onClick={handleCanvasClick}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>
            {selectedSticker && (
              <p className="text-xs text-primary font-medium animate-pulse">
                Click on your photo to place {selectedSticker.emoji}
              </p>
            )}
          </div>

          {/* Sticker palette */}
          <div className="flex flex-col gap-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">Pick a sticker</p>
            <div className="grid grid-cols-4 gap-2">
              {STICKERS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSticker(selectedSticker?.id === s.id ? null : s)}
                  onDoubleClick={() => handleAddDefault(s)}
                  title={`Click to select, double-click to snap to default position`}
                  className={`text-3xl p-2 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 ${
                    selectedSticker?.id === s.id
                      ? 'border-primary bg-primary/10 scale-110'
                      : 'border-border bg-muted/30 hover:border-primary/50'
                  }`}
                >
                  {s.emoji}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Single click = select &amp; place on photo · Double click = snap to default position
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2">
          <Button variant="outline" size="sm" onClick={handleUndo} disabled={placedStickers.length === 0}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Undo
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