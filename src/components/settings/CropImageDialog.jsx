import React, { useState, useCallback } from 'react';
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
  const [croppedArea, setCroppedArea] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onRotationChange = useCallback((rotation) => {
    setRotation(rotation);
  }, []);

  const onCropCompleted = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedArea(croppedArea);
    setCroppedAreaPixels(croppedAreaPixels);
    console.log('Crop updated:', croppedArea);
  }, []);

  const handleCrop = async () => {
    setIsSaving(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedImage) {
        // Convert data URL to blob and upload as file
        const response = await fetch(croppedImage);
        const blob = await response.blob();
        const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        await onCropComplete(file_url);
        onClose();
      } else {
        alert('Could not create the cropped image. Please try again.');
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Error: ' + (error.message || 'Could not save the image'));
    } finally {
      setIsSaving(false);
    }
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setCroppedArea(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adjust Profile Picture</DialogTitle>
          <DialogDescription>
            Drag to reposition, use the slider to zoom, and rotate if needed
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleted}
            onZoomChange={onZoomChange}
            onRotationChange={onRotationChange}
            onImageLoaded={() => {
              setImageLoaded(true);
              setCrop({ x: 0, y: 0 });
              setZoom(1.5);
            }}
            showGrid={false}
            cropShape="round"
            objectFit="contain"
          />
        </div>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ZoomIn className="w-4 h-4" />
              <span>Zoom: {Math.round(zoom * 100)}%</span>
            </div>
            <Slider
              value={[zoom]}
              min={0.5}
              max={3}
              step={0.1}
              onValueChange={(value) => onZoomChange(value[0])}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rotate: {rotation}°</span>
            </div>
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={90}
              onValueChange={(value) => onRotationChange(value[0])}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={resetCrop}>
            Reset
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleCrop} disabled={isSaving}>
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
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

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  if (!pixelCrop || !imageSrc) {
    throw new Error('Missing crop area or image');
  }

  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const rotRad = (rotation * Math.PI) / 180;

  // Bounding box using image.width (rendered size) — matches what react-easy-crop uses internally
  const bBoxWidth = Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height);
  const bBoxHeight = Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height);

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  // Crop to the exact pixel area reported by react-easy-crop
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return croppedCanvas.toDataURL('image/jpeg', 0.85);
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}