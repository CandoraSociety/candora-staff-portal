import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Link as LinkIcon } from 'lucide-react';
import { LAYOUT_LABELS } from './presentationConstants';
import { base44 } from '@/api/base44Client';

export default function SlideProperties({ slide, onUpdate, setUploading }) {
  const fileInputRef = useRef(null);

  if (!slide) {
    return (
      <div className="w-72 flex-shrink-0 border-l border-border bg-card flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">Select a slide to edit its properties</p>
      </div>
    );
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onUpdate({ image_url: file_url });
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  return (
    <div className="w-72 flex-shrink-0 border-l border-border bg-card overflow-y-auto">
      <div className="p-4 space-y-4">
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Layout</Label>
          <select
            value={slide.layout}
            onChange={(e) => onUpdate({ layout: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {Object.entries(LAYOUT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="slide-title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</Label>
          <Input
            id="slide-title"
            value={slide.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Slide title"
            className="mt-1"
          />
        </div>

        {slide.layout !== 'title' && slide.layout !== 'section' && (
          <div>
            <Label htmlFor="slide-content" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Content <span className="text-muted-foreground normal-case font-normal">(one bullet per line)</span>
            </Label>
            <Textarea
              id="slide-content"
              value={slide.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder={'First point\nSecond point\nThird point'}
              className="mt-1 min-h-[120px] font-mono text-sm"
            />
          </div>
        )}

        {(slide.layout === 'title_image' || slide.layout === 'title_content_image') && (
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Image</Label>
            <div className="mt-1 flex gap-2">
              <Input
                value={slide.image_url || ''}
                onChange={(e) => onUpdate({ image_url: e.target.value })}
                placeholder="Image URL"
                className="text-sm"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-2 rounded-md border border-input hover:bg-muted transition-colors"
                title="Upload image"
              >
                <Upload className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            {slide.image_url && (
              <div className="mt-2 rounded-md border border-border overflow-hidden">
                <img src={slide.image_url} alt="" className="w-full h-24 object-cover" />
              </div>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="slide-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Speaker Notes</Label>
          <Textarea
            id="slide-notes"
            value={slide.notes || ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Notes for presenter (not shown on slide)"
            className="mt-1 min-h-[80px] text-sm"
          />
        </div>
      </div>
    </div>
  );
}