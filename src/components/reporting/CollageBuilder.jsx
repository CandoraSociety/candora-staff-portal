import React, { useState } from 'react';
import { X, Check, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CollageRenderer from './CollageRenderer';

const LAYOUTS = [
  { key: 'grid', label: 'Grid', desc: 'Even grid' },
  { key: 'mosaic', label: 'Mosaic', desc: '1 large + small' },
  { key: 'strip', label: 'Strip', desc: 'Horizontal row' },
  { key: 'featured', label: 'Featured', desc: 'Large + thumbs' },
];

export default function CollageBuilder({ galleryImages, selectedPhotos, layout, onSave, onClose }) {
  const [selected, setSelected] = useState(selectedPhotos || []);
  const [activeLayout, setActiveLayout] = useState(layout || 'grid');

  const togglePhoto = (url) => {
    setSelected(prev => prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]);
  };

  const canSave = selected.length >= 2;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Images className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-sm">Create Photo Collage</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Step 1: Select photos */}
          <div>
            <p className="text-xs font-semibold mb-2">1. Select photos <span className="text-muted-foreground font-normal">({selected.length} selected)</span></p>
            {galleryImages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 bg-slate-50 rounded-lg">Upload photos to the gallery first.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {galleryImages.map((img, i) => {
                  const isSelected = selected.includes(img.url);
                  return (
                    <button key={i} onClick={() => togglePhoto(img.url)} className={`relative rounded-lg overflow-hidden border-2 transition ${isSelected ? 'border-accent ring-2 ring-accent/30' : 'border-transparent hover:border-slate-300'}`}>
                      <img src={img.url} alt="" className="w-full h-20 object-cover" />
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-accent text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Choose layout */}
          <div>
            <p className="text-xs font-semibold mb-2">2. Choose layout</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LAYOUTS.map(l => (
                <button key={l.key} onClick={() => setActiveLayout(l.key)} disabled={selected.length < 2} className={`p-3 rounded-lg border-2 text-center transition ${activeLayout === l.key ? 'border-accent bg-accent/5' : 'border-slate-200 hover:border-slate-300'} ${selected.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <p className="text-sm font-medium">{l.label}</p>
                  <p className="text-[10px] text-muted-foreground">{l.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Preview */}
          {selected.length >= 2 && (
            <div>
              <p className="text-xs font-semibold mb-2">3. Preview</p>
              <div className="border rounded-lg p-3 bg-slate-50">
                <CollageRenderer photos={selected} layout={activeLayout} />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t sticky bottom-0 bg-white">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onSave({ collage_photos: selected, collage_layout: activeLayout })} disabled={!canSave} className="gap-1.5">
            <Check className="w-4 h-4" /> Create Collage
          </Button>
        </div>
      </div>
    </div>
  );
}