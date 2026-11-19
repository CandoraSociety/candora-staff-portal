import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePlus, Loader2, Sparkles } from 'lucide-react';

const STYLES = [
  { value: 'warm documentary photograph', label: 'Warm documentary photo' },
  { value: 'bright editorial photograph', label: 'Bright editorial photo' },
  { value: 'soft painted illustration', label: 'Soft illustration' },
  { value: 'candid community photograph', label: 'Candid community photo' },
];

// Generates the campaign page's hero photo from a description the staff member
// types, and saves the chosen image to the campaign.
export default function HeroImageAiDialog({ campaign, onSave }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState(STYLES[0].value);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const changeOpen = (value) => {
    setOpen(value);
    if (value) {
      setDescription((prev) => prev || campaign?.description || campaign?.tagline || '');
      setUrl('');
      setError('');
    }
  };

  const generate = async () => {
    if (!description.trim()) return;
    setBusy(true);
    setError('');
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `${style} for a non-profit fundraising campaign page. Subject: ${description.trim()}. Wide landscape composition that works as a website hero image, natural light, hopeful and human, authentic Canadian community setting. No text, no lettering, no logos.`,
      });
      setUrl(result.url);
    } catch (e) {
      setError(e.message || 'The photo could not be generated. Try again.');
    }
    setBusy(false);
  };

  const use = async () => {
    setSaving(true);
    await onSave({ hero_image_url: url });
    setSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="w-4 h-4 mr-2" /> Generate hero photo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Generate a hero photo</DialogTitle>
          <DialogDescription>
            Describe the scene you want at the top of the campaign page. You can keep adjusting and generating again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Describe the photo</Label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A family unpacking winter coats in a bright community room, volunteers sorting donations behind them"
            />
          </div>

          <div>
            <Label>Look</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {url && (
            <img src={url} alt="Generated hero" className="w-full rounded-lg border object-cover max-h-64" />
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={generate} disabled={busy || !description.trim()}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-2" />}
            {busy ? 'Generating…' : url ? 'Generate again' : 'Generate'}
          </Button>
          <Button onClick={use} disabled={!url || saving}>
            {saving ? 'Saving…' : 'Use this photo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}