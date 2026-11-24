import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const PICKABLE = ['photo', 'banner', 'other', 'logo'];

// Picks a picture already in the Candora media library, so approved
// photographs can be reused across placements without uploading again.
export default function MediaLibraryDialog({ open, onOpenChange, onPick }) {
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['marketing-assets'],
    queryFn: () => base44.entities.MarketingAsset.list('-created_date', 200),
    enabled: open,
  });

  const images = (assets || []).filter(
    (asset) => asset.file_url && PICKABLE.includes(asset.asset_type || 'photo')
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose from the media library</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">
            No pictures in the media library yet. Upload one in Marketing → Brand assets, or upload a
            photo directly here.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => { onPick(asset.file_url); onOpenChange(false); }}
                className="group text-left rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary"
              >
                <span className="block h-24 bg-muted">
                  <img src={asset.thumbnail_url || asset.file_url} alt="" className="h-full w-full object-cover" />
                </span>
                <span className="block px-2 py-1.5 text-xs truncate">{asset.name || 'Untitled'}</span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}