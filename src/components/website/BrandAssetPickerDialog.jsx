import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Pick an image already kept in Marketing → Brand Assets, so the website uses
// the same approved photos and logos as everything else.
export default function BrandAssetPickerDialog({ open, onOpenChange, onPick }) {
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["website-brand-assets"],
    queryFn: () =>
      base44.entities.MarketingAsset.list({ sort: "-created_date", limit: 200 }).then((res) => res.items || []),
    enabled: open,
  });

  const images = assets.filter((asset) => asset.file_url && asset.is_active !== false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Brand assets</DialogTitle>
          <DialogDescription>
            Images uploaded in Marketing → Brand Assets. Picking one here uses it on the website.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading brand assets…
          </div>
        ) : images.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground italic">
            No brand assets yet — add images in Marketing → Brand Assets, then choose them here.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1">
            {images.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => onPick(asset.file_url)}
                className="rounded-lg border-2 border-border hover:border-primary overflow-hidden bg-white text-left transition-colors"
              >
                <div className="aspect-square bg-slate-50 flex items-center justify-center p-2">
                  <img src={asset.file_url} alt={asset.name} className="max-h-full max-w-full object-contain" />
                </div>
                <p className="text-xs font-medium text-foreground px-2 py-1.5 truncate">{asset.name}</p>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}