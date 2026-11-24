import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ImagePlus, Library, Loader2, RotateCcw } from 'lucide-react';
import { imageFocalStyle } from '@/lib/campaignDisplay';
import MediaLibraryDialog from '@/components/donors/campaign/MediaLibraryDialog';

const POSITIONS = [
  { value: 'top', label: 'Top' },
  { value: 'center', label: 'Centre' },
  { value: 'bottom', label: 'Bottom' },
];

// One placement's photo: upload or pick one, describe it, choose which part
// stays in frame, preview it wide and narrow, approve it, or put a previous
// photo back.
export default function CampaignImageSlot({ slot, value, history = [], view, busy, onChange, onUpload }) {
  const fileRef = useRef(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const wide = view === 'desktop';

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold leading-tight">{slot.label}</h3>
          {slot.hint && <p className="text-xs text-muted-foreground mt-0.5">{slot.hint}</p>}
        </div>
        {value.url && (
          value.provisional ? (
            <Badge className="bg-amber-100 text-amber-800 shrink-0">Awaiting approval</Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-700 shrink-0">Approved</Badge>
          )
        )}
      </div>

      <div className="grid sm:grid-cols-[220px_1fr] gap-4">
        <div>
          <div className={`relative overflow-hidden rounded-lg bg-muted ${wide ? 'h-36 w-full' : 'h-40 w-40 mx-auto'}`}>
            {value.url ? (
              <img
                src={value.url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={imageFocalStyle(value.position)}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <ImagePlus className="w-5 h-5" />
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-1.5">
            {wide ? 'Desktop crop' : 'Mobile crop'}
          </p>
        </div>

        <div className="space-y-3">
          {!slot.noAlt && (
            <>
              <div>
                <Label>Alternative text</Label>
                <Input
                  value={value.alt || ''}
                  onChange={(e) => onChange({ alt: e.target.value })}
                  placeholder="What the photo shows, for screen readers"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Which part stays in frame</Label>
                <div className="flex gap-2 mt-1">
                  {POSITIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange({ position: option.value })}
                      className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                        (value.position || 'center') === option.value
                          ? 'border-primary bg-primary/10'
                          : 'hover:bg-muted/60'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-2" />}
              {value.url ? 'Replace' : 'Upload'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLibraryOpen(true)}>
              <Library className="w-4 h-4 mr-2" /> Library
            </Button>
            {value.url && value.provisional && (
              <Button size="sm" onClick={() => onChange({ provisional: false })}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
              </Button>
            )}
            {value.url && (
              <Button variant="ghost" size="sm" onClick={() => onChange({ url: '', alt: '', provisional: true })}>
                Remove
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) onUpload(file);
              }}
            />
          </div>

          {history.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t">
              <p className="text-xs text-muted-foreground">Previously used</p>
              <div className="flex flex-wrap gap-2">
                {history.slice(0, 6).map((entry, index) => (
                  <button
                    key={`${entry.url}-${index}`}
                    type="button"
                    onClick={() => onChange({ url: entry.url, alt: entry.alt || '', provisional: false })}
                    title="Put this photo back"
                    className="relative h-12 w-16 rounded-md overflow-hidden border hover:ring-2 hover:ring-primary"
                  >
                    <img src={entry.url} alt="" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100">
                      <RotateCcw className="w-3.5 h-3.5 text-white" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <MediaLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onPick={(url) => onChange({ url, provisional: true })}
      />
    </div>
  );
}