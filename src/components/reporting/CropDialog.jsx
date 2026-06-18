import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

function getCroppedBlob(imageSrc, pixelCrop) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height
      );
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Canvas empty')); return; }
        resolve(blob);
      }, 'image/jpeg', 0.92);
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}

export default function CropDialog({ imageUrl, onSave, onClose }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(imageUrl, croppedAreaPixels);
      onSave(blob);
    } catch (e) {
      console.error('Crop failed:', e);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Crop Image</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0"><X className="w-4 h-4" /></Button>
        </div>
        <div className="relative w-full h-80 bg-slate-800">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1 / 1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="px-4 py-3 flex items-center gap-3">
          <label className="text-xs text-muted-foreground shrink-0">Zoom</label>
          <input type="range" min={1} max={3} step={0.1} value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-blue-500" />
        </div>
        <div className="px-4 py-3 border-t flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Apply Crop'}</Button>
        </div>
      </div>
    </div>
  );
}