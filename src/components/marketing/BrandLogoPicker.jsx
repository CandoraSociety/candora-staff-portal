import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Choose one of the uploaded logo assets (or upload a new one) for a role in the
// logo library: primary, long form, or one of the alternates.
export default function BrandLogoPicker({ open, onOpenChange, title, assets, onPick, onUpload, uploading }) {
  const fileRef = useRef(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {assets.length === 0 && (
            <p className="col-span-full text-sm text-slate-500 italic py-6 text-center">
              No logo assets yet — upload one below.
            </p>
          )}
          {assets.map(asset => (
            <button
              key={asset.id}
              type="button"
              onClick={() => onPick(asset)}
              className="rounded-lg border-2 border-border hover:border-primary overflow-hidden bg-white text-left transition-colors"
            >
              <div className="aspect-square bg-slate-50 flex items-center justify-center p-2">
                <img src={asset.file_url} alt={asset.name} className="max-h-full max-w-full object-contain" />
              </div>
              <p className="text-xs font-medium text-slate-800 px-2 py-1.5 truncate">{asset.name}</p>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading…' : 'Upload new logo'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = '';
            }}
          />
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}