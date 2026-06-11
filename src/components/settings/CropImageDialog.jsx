import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { X, Check, ZoomIn } from 'lucide-react';

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
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) {
      alert('Please adjust the image (drag or zoom) before saving');
      return;
    }
    
    setIsSaving(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedImage) {
        await onCropComplete(croppedImage);
        onClose();
      } else {
        throw new Error('No image returned from crop');
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image: ' + error.message);
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
              setZoom(1);
            }}
            showGrid={false}
            cropShape="round"
            objectFit="contain"
            cropSize={{ width: 300, height: 300 }}
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
  return new Promise(async (resolve, reject) => {
    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('No 2d context'));
        return;
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = pixelCrop.width * scaleX;
      canvas.height = pixelCrop.height * scaleY;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      ctx.drawImage(
        image,
        pixelCrop.x * scaleX,
        pixelCrop.y * scaleY,
        pixelCrop.width * scaleX,
        pixelCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
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