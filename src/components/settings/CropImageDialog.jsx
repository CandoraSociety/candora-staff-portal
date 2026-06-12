import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { X, Check, ZoomIn } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CropImageDialog({ open, imageSrc, onCropComplete, onClose }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
    }
  }, [open, imageSrc]);

  const onCropCompleted = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setIsSaving(true);
    try {
      const dataUrl = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await onCropComplete(file_url);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Error: ' + (error.message || 'Could not save the image'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adjust Profile Picture</DialogTitle>
          <DialogDescription>Drag to reposition and use the slider to zoom</DialogDescription>
        </DialogHeader>

        <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ height: 500 }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              minZoom={0.3}
              maxZoom={3}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropCompleted}
              restrictPosition={false}
            />
          )}
        </div>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ZoomIn className="w-4 h-4" />
              <span>Zoom: {Math.round(zoom * 100)}%</span>
            </div>
            <Slider
              value={[zoom]}
              min={0.3}
              max={3}
              step={0.05}
              onValueChange={(value) => setZoom(value[0])}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Rotate: {rotation}°</div>
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={90}
              onValueChange={(value) => setRotation(value[0])}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0); }}>
            Reset
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleCrop} disabled={isSaving || !croppedAreaPixels}>
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

function createImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);

  // react-easy-crop's onCropComplete already gives us pixel coordinates
  // relative to the *natural* image size when using a data URL with no scaling tricks.
  // We just need to handle rotation of the full image first, then crop from that.

  const rotRad = (rotation * Math.PI) / 180;

  // Step 1: draw the full image rotated onto a temp canvas
  const bBoxW = Math.round(
    Math.abs(Math.cos(rotRad) * image.naturalWidth) + Math.abs(Math.sin(rotRad) * image.naturalHeight)
  );
  const bBoxH = Math.round(
    Math.abs(Math.sin(rotRad) * image.naturalWidth) + Math.abs(Math.cos(rotRad) * image.naturalHeight)
  );

  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = bBoxW;
  rotCanvas.height = bBoxH;
  const rotCtx = rotCanvas.getContext('2d');
  rotCtx.translate(bBoxW / 2, bBoxH / 2);
  rotCtx.rotate(rotRad);
  rotCtx.translate(-image.naturalWidth / 2, -image.naturalHeight / 2);
  rotCtx.drawImage(image, 0, 0);

  // Step 2: extract crop area from the rotated canvas, output at max 400x400
  const outputSize = Math.min(Math.round(pixelCrop.width), 400);
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = outputSize;
  cropCanvas.height = outputSize;
  const cropCtx = cropCanvas.getContext('2d');
  cropCtx.drawImage(
    rotCanvas,
    Math.round(pixelCrop.x),
    Math.round(pixelCrop.y),
    Math.round(pixelCrop.width),
    Math.round(pixelCrop.height),
    0, 0,
    outputSize,
    outputSize
  );

  return cropCanvas.toDataURL('image/jpeg', 0.9);
}