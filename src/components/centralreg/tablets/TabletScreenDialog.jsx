import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SCREEN_BACKGROUNDS, screenBackground } from '@/lib/kioskScreens';
import { useOrgSettings } from '@/lib/useOrgSettings';

// What one tablet shows when nothing is on it: its own message, its own
// background. Saving can push the same look to every classroom tablet at once.
export default function TabletScreenDialog({ open, onOpenChange, station, onSaved }) {
  const { primaryColor, secondaryColor } = useOrgSettings();
  const brand = { primary_color: primaryColor, secondary_color: secondaryColor };

  const [message, setMessage] = useState('');
  const [background, setBackground] = useState('candora');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [applyAll, setApplyAll] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMessage(station?.idle_message || '');
    setBackground(station?.idle_background || 'candora');
    setBackgroundUrl(station?.idle_background_url || '');
    setApplyAll(false);
    setError('');
  }, [open, station]);

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setBackgroundUrl(file_url);
    } catch (err) {
      setError(err.message || 'That photo could not be uploaded.');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!station) return;
    setSaving(true);
    setError('');
    const data = {
      idle_message: message.trim(),
      idle_background: background,
      idle_background_url: backgroundUrl,
    };
    try {
      if (applyAll) {
        await base44.entities.KioskStation.updateMany({ program: 'classroom' }, { $set: data });
      } else {
        await base44.entities.KioskStation.update(station.id, data);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'That could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (!station) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Welcome screen — {station.name}</DialogTitle>
          <DialogDescription>
            What this tablet shows when nothing is on it. Changes reach the tablet within a few seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="idle-message">Message on the screen</Label>
            <Textarea
              id="idle-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              placeholder="Leave blank for the standard room message."
            />
            <p className="text-xs text-muted-foreground">Shown under the welcome headline.</p>
          </div>

          <div className="space-y-2">
            <Label>Background</Label>
            <div className="grid grid-cols-2 gap-2">
              {SCREEN_BACKGROUNDS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setBackground(preset.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-2 text-left transition-colors',
                    background === preset.id && !backgroundUrl
                      ? 'border-primary ring-1 ring-primary'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  <span
                    className="h-9 w-9 shrink-0 rounded-md border border-border/60"
                    style={{ background: screenBackground(preset.id, brand).css }}
                  />
                  <span className="text-xs font-medium leading-tight">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Photo</Label>
            {backgroundUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={backgroundUrl}
                  alt="Tablet background"
                  className="h-16 w-24 rounded-md border object-cover"
                />
                <Button variant="ghost" size="sm" onClick={() => setBackgroundUrl('')}>
                  <Trash2 className="h-4 w-4" /> Remove photo
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  id="background-photo"
                  type="file"
                  accept="image/*"
                  className="cursor-pointer"
                  onChange={uploadPhoto}
                  disabled={uploading}
                />
                {uploading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Optional — a photo replaces the colour background. Pictures are stored publicly since the tablet
              shows them in the room.
            </p>
          </div>

          <label className="flex items-start gap-2.5 rounded-lg border bg-muted/40 p-3">
            <Checkbox checked={applyAll} onCheckedChange={(value) => setApplyAll(value === true)} className="mt-0.5" />
            <span className="text-sm">
              <span className="font-medium">Apply to all classroom tablets</span>
              <span className="block text-xs text-muted-foreground">
                Every classroom tablet shows this message and background.
              </span>
            </span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || uploading}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}