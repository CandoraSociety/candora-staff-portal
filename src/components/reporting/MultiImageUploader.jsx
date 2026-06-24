import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, X, Images } from 'lucide-react';

/**
 * Editor UI for uploading and managing multiple independently-movable
 * section images. Uploaded images appear in the preview and can be
 * dragged to any position.
 */
export default function MultiImageUploader({ section, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const images = section.images || [];

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f })));
      const newImages = uploaded.map(r => ({
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url: r.file_url,
        caption: '',
        x: 50,
        y: 0,
        width: 40,
        rotation: 0,
        opacity: 100,
        filter: 'none',
        frame: true,
        shadow: true,
      }));
      onUpdate(section.id, { images: [...images, ...newImages] });
    } catch {}
    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (id) => {
    onUpdate(section.id, { images: images.filter(img => img.id !== id) });
  };

  return (
    <div className="border-t pt-3">
      <div className="flex items-center gap-2 mb-2">
        <Images className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Movable Images <span className="text-slate-400 normal-case font-normal">(drag in preview to reposition each independently)</span>
        </span>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-2">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img src={img.url} alt="" className="w-full h-16 object-cover rounded-lg border" />
              <button
                onClick={() => removeImage(img.id)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-0 left-0 right-0 bg-black/55 text-white text-[9px] text-center py-0.5 rounded-b-lg tabular-nums">
                {img.x != null ? Math.round(img.x) : 50}%, {img.y || 0}px
              </span>
            </div>
          ))}
        </div>
      )}

      <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-accent/50 hover:bg-slate-50 transition-colors">
        {uploading ? (
          <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        ) : (
          <Upload className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Upload images (multiple allowed)'}</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
    </div>
  );
}