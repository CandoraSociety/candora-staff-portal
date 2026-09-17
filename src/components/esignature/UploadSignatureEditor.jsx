import React, { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Upload, Wand2, RefreshCw } from 'lucide-react';

const CHECKERBOARD = {
  backgroundColor: '#ffffff',
  backgroundImage:
    'linear-gradient(45deg,#e2e8f0 25%,transparent 25%),linear-gradient(-45deg,#e2e8f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e2e8f0 75%),linear-gradient(-45deg,transparent 75%,#e2e8f0 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
};

export default function UploadSignatureEditor({ onChange }) {
  const canvasRef = useRef(null);
  const originalRef = useRef(null);
  const [removeBg, setRemoveBg] = useState(true);
  const [tolerance, setTolerance] = useState(70);
  const [fileName, setFileName] = useState('');
  const [processedUrl, setProcessedUrl] = useState(null);

  const process = () => {
    const canvas = canvasRef.current;
    if (!canvas || !originalRef.current) return;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(originalRef.current, 0, 0);

    if (removeBg) {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = img.data;
      const w = canvas.width;
      const h = canvas.height;
      // Sample the four corners to detect the background colour
      const corners = [
        0,
        (w - 1) * 4,
        (h - 1) * w * 4,
        ((h - 1) * w + (w - 1)) * 4,
      ];
      let br = 0, bg = 0, bb = 0;
      corners.forEach((i) => { br += d[i]; bg += d[i + 1]; bb += d[i + 2]; });
      br /= 4; bg /= 4; bb /= 4;

      const tol = tolerance * 3;
      for (let i = 0; i < d.length; i += 4) {
        if (Math.abs(d[i] - br) + Math.abs(d[i + 1] - bg) + Math.abs(d[i + 2] - bb) < tol) {
          d[i + 3] = 0;
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    const url = canvas.toDataURL('image/png');
    setProcessedUrl(url);
    onChange(url);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const scale = Math.min(900 / img.width, 1);
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        originalRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        process();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <Label className="sr-only">Upload signature image</Label>
        <label className="cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <span className="inline-flex items-center gap-2 rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
            <Upload className="w-4 h-4" /> {fileName || 'Choose image'}
          </span>
        </label>

        {originalRef.current && (
          <>
            <div className="flex items-center gap-2">
              <Switch id="sig-removebg" checked={removeBg} onCheckedChange={(v) => { setRemoveBg(v); setTimeout(process, 0); }} />
              <Label htmlFor="sig-removebg" className="flex items-center gap-1">
                <Wand2 className="w-3.5 h-3.5" /> Remove background
              </Label>
            </div>
            {removeBg && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Strength</span>
                <input
                  type="range"
                  min="20"
                  max="160"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value))}
                  onMouseUp={process}
                  onTouchEnd={process}
                  className="w-20"
                />
              </div>
            )}
          </>
        )}
      </div>

      <div
        className="rounded-lg border border-border min-h-[140px] flex items-center justify-center overflow-hidden"
        style={CHECKERBOARD}
      >
        {processedUrl ? (
          <img src={processedUrl} alt="Signature preview" className="max-h-40 max-w-full object-contain" />
        ) : (
          <p className="text-sm text-muted-foreground p-6">
            Upload a photo or scan of your signature — a white or solid-colour background is removed automatically.
          </p>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {processedUrl && (
        <Button variant="ghost" size="sm" onClick={process}>
          <RefreshCw className="w-3.5 h-3.5" /> Re-process
        </Button>
      )}
    </div>
  );
}