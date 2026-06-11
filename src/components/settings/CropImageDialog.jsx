import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { X, Check, ZoomIn } from 'lucide-react';

export default function CropImageDialog({ open, imageSrc, onCropComplete, onClose }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.5);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [croppedArea, setCroppedArea] = useState(null);

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
    console.log('Crop completed:', { croppedArea, croppedAreaPixels });
    setCroppedArea(croppedArea);
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    console.log('Starting crop:', { imageSrc, croppedArea, croppedAreaPixels, rotation });
    
    const pixelsToUse = croppedAreaPixels || croppedArea;
    
    if (!pixelsToUse) {
      console.error('No cropped area available');
      alert('Please adjust the image (drag or zoom) before saving');
      return;
    }
    
    if (!pixelsToUse.width || !pixelsToUse.height) {
      console.error('Invalid crop dimensions:', pixelsToUse);
      alert('Invalid crop area. Please try again.');
      return;
    }
    
    setIsSaving(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, pixelsToUse, rotation);
      console.log('Cropped image result:', croppedImage);
      if (croppedImage) {
        await onCropComplete(croppedImage);
        onClose();
      } else {
        throw new Error('No image returned from crop');
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      alert('Failed to crop image: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1.5);
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
            showGrid={false}
            cropShape="round"
            objectFit="horizontal-cover"
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
  console.log('getCroppedImg called with:', { imageSrc, pixelCrop, rotation });
  
  const image = await createImage(imageSrc);
  console.log('Image loaded:', { width: image.width, height: image.height, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight });
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const pixelCropScaled = {
    x: pixelCrop.x,
    y: pixelCrop.y,
    width: pixelCrop.width,
    height: pixelCrop.height,
  };

  console.log('Crop area:', pixelCropScaled);

  canvas.width = pixelCropScaled.width;
  canvas.height = pixelCropScaled.height;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  ctx.drawImage(
    image,
    -pixelCropScaled.x,
    -pixelCropScaled.y,
    image.width,
    image.height
  );

  console.log('Canvas drawn, converting to blob...');

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      console.log('Blob created:', blob);
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;
        console.log('Base64 data created, length:', base64data?.length);
        resolve(base64data);
      };
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
        reject(e);
      };
    }, 'image/jpeg', 0.95);
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