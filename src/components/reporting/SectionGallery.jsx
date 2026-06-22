import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, X, Images } from 'lucide-react';
import CollageBuilder from './CollageBuilder';
import CollageRenderer from './CollageRenderer';

export default function SectionGallery({ section, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const gallery = section.gallery_images || [];
  const collagePhotos = section.collage_photos || [];
  const collageLayout = section.collage_layout || 'grid';

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f })));
      const newImages = uploaded.map(r => ({ url: r.file_url, caption: '' }));
      onUpdate(section.id, { gallery_images: [...gallery, ...newImages] });
    } catch {}
    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (idx) => {
    const next = gallery.filter((_, i) => i !== idx);
    onUpdate(section.id, { gallery_images: next });
  };

  const removeCollage = () => {
    onUpdate(section.id, { collage_photos: [], collage_layout: 'grid' });
  };

  return (
    <div className="border-t pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Photo Gallery</span>
        {gallery.length >= 2 && (
          <Button variant="outline" size="sm" onClick={() => setShowBuilder(true)} className="text-xs gap-1 h-7">
            <Images className="w-3.5 h-3.5" /> {collagePhotos.length > 0 ? 'Edit Collage' : 'Create Collage'}
          </Button>
        )}
      </div>

      {/* Collage preview */}
      {collagePhotos.length >= 2 && (
        <div className="relative mb-3 group">
          <CollageRenderer photos={collagePhotos} layout={collageLayout} />
          <button onClick={removeCollage} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove collage">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Gallery thumbnails */}
      {gallery.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-2">
          {gallery.map((img, i) => (
            <div key={i} className="relative group">
              <img src={img.url} alt="" className="w-full h-16 object-cover rounded-lg border" />
              <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-accent/50 hover:bg-slate-50 transition-colors">
        {uploading ? (
          <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        ) : (
          <Upload className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Upload photos to gallery (multiple allowed)'}</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>

      {showBuilder && (
        <CollageBuilder
          galleryImages={gallery}
          selectedPhotos={collagePhotos}
          layout={collageLayout}
          onSave={(data) => { onUpdate(section.id, data); setShowBuilder(false); }}
          onClose={() => setShowBuilder(false)}
        />
      )}
    </div>
  );
}