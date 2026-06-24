import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Check, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Boundary-based crop dialog (Canva-style).
 * Drag the corner/edge handles to resize the crop rectangle,
 * or drag inside the rectangle to reposition.
 * When `aspect` is provided, the crop ratio is locked.
 */
export default function CropImageDialog({ open, imageSrc, onCropComplete, onClose, aspect = null, cropShape = 'rect' }) {
  const [image, setImage] = useState(null);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 100, h: 100 }); // percentages 0–100
  const [isSaving, setIsSaving] = useState(false);
  const [drag, setDrag] = useState(null);
  const imgWrapRef = useRef(null);

  useEffect(() => {
    if (!open || !imageSrc) { setImage(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      initCrop(img.naturalWidth, img.naturalHeight);
    };
    img.src = imageSrc;
  }, [open, imageSrc]);

  const initCrop = (w, h) => {
    if (aspect) {
      const imgAR = w / h;
      if (imgAR > aspect) {
        const cw = (aspect / imgAR) * 100;
        setCrop({ x: (100 - cw) / 2, y: 0, w: cw, h: 100 });
      } else {
        const ch = (imgAR / aspect) * 100;
        setCrop({ x: 0, y: (100 - ch) / 2, w: 100, h: ch });
      }
    } else {
      setCrop({ x: 0, y: 0, w: 100, h: 100 });
    }
  };

  const onPointerDown = (e, type) => {
    e.preventDefault(); e.stopPropagation();
    if (e.currentTarget.setPointerCapture && e.pointerId != null) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    }
    setDrag({ type, startX: e.clientX, startY: e.clientY, startCrop: { ...crop } });
  };

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      const wrap = imgWrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dxPct = ((e.clientX - drag.startX) / rect.width) * 100;
      const dyPct = ((e.clientY - drag.startY) / rect.height) * 100;
      const sc = drag.startCrop;

      if (drag.type === 'move') {
        setCrop({
          x: Math.max(0, Math.min(100 - sc.w, sc.x + dxPct)),
          y: Math.max(0, Math.min(100 - sc.h, sc.y + dyPct)),
          w: sc.w, h: sc.h,
        });
        return;
      }

      // Free resize with any handle — width and height adjust independently
      let { x, y, w, h } = sc;
      if (drag.type.includes('w')) { const nx = sc.x + dxPct; w = sc.w + (sc.x - nx); x = nx; }
      if (drag.type.includes('e')) { w = sc.w + dxPct; }
      if (drag.type.includes('n')) { const ny = sc.y + dyPct; h = sc.h + (sc.y - ny); y = ny; }
      if (drag.type.includes('s')) { h = sc.h + dyPct; }
      if (w < 5) { if (drag.type.includes('w')) x = sc.x + sc.w - 5; w = 5; }
      if (h < 5) { if (drag.type.includes('n')) y = sc.y + sc.h - 5; h = 5; }
      if (x < 0) { w += x; x = 0; }
      if (y < 0) { h += y; y = 0; }
      if (x + w > 100) w = 100 - x;
      if (y + h > 100) h = 100 - y;
      setCrop({ x, y, w, h });
    };
    const onUp = (e) => {
      if (e?.target?.releasePointerCapture && e.pointerId != null) {
        try { e.target.releasePointerCapture(e.pointerId); } catch {}
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [drag, aspect]);

  const handleCrop = async () => {
    if (!image) return;
    setIsSaving(true);
    try {
      const sx = (crop.x / 100) * imgNatural.w;
      const sy = (crop.y / 100) * imgNatural.h;
      const sw = (crop.w / 100) * imgNatural.w;
      const sh = (crop.h / 100) * imgNatural.h;
      const maxDim = 1200;
      const scale = Math.min(1, maxDim / Math.max(sw, sh));
      const outW = Math.round(sw * scale);
      const outH = Math.round(sh * scale);
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outW, outH);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await onCropComplete(file_url);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Error: ' + (error.message || 'Could not save the image'));
    } finally {
      setIsSaving(false);
    }
  };

  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  const handlePos = {
    nw: { left: 0, top: 0, cursor: 'nwse-resize' },
    n: { left: '50%', top: 0, cursor: 'ns-resize', transform: 'translateX(-50%)' },
    ne: { right: 0, top: 0, cursor: 'nesw-resize' },
    e: { right: 0, top: '50%', cursor: 'ew-resize', transform: 'translateY(-50%)' },
    se: { right: 0, bottom: 0, cursor: 'nwse-resize' },
    s: { left: '50%', bottom: 0, cursor: 'ns-resize', transform: 'translateX(-50%)' },
    sw: { left: 0, bottom: 0, cursor: 'nesw-resize' },
    w: { left: 0, top: '50%', cursor: 'ew-resize', transform: 'translateY(-50%)' },
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription>Drag the handles to adjust the crop area, or drag inside to reposition</DialogDescription>
        </DialogHeader>

        <div className="relative w-full bg-black rounded-lg overflow-hidden flex items-center justify-center" style={{ height: 400 }}>
          {!image && <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {image && (
            <div ref={imgWrapRef} className="relative inline-block">
              <img src={imageSrc} alt="Crop" className="block max-w-full max-h-[400px] object-contain select-none pointer-events-none" />
              <div
                className="absolute border-2 border-white cursor-move touch-none"
                style={{
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: `${crop.w}%`,
                  height: `${crop.h}%`,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                }}
                onPointerDown={(e) => onPointerDown(e, 'move')}
              >
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/3 left-0 right-0 border-t border-white/30" />
                  <div className="absolute top-2/3 left-0 right-0 border-t border-white/30" />
                  <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/30" />
                  <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/30" />
                </div>
                {handles.map(h => (
                  <div
                    key={h}
                    onPointerDown={(e) => onPointerDown(e, h)}
                    className="absolute w-4 h-4 bg-white border-2 border-gray-500 rounded-sm shadow-md z-10 touch-none"
                    style={{ ...handlePos[h], margin: '-8px' }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => initCrop(imgNatural.w, imgNatural.h)} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button onClick={handleCrop} disabled={isSaving || !image}>
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Crop and Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}