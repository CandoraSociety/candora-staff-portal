import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import GiftCardPreview from '@/components/campaign-public/GiftCardPreview';

const newTheme = () => ({
  id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  image_url: '',
  message: '',
  is_active: true,
});

// Charitable gifting: a supporter can send their gift as a greeting card. This
// is where the card designs and their default greetings are written.
export default function CampaignGiftingPanel({ campaign, onSave }) {
  const [enabled, setEnabled] = useState(false);
  const [themes, setThemes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [preview, setPreview] = useState(0);

  useEffect(() => {
    setEnabled(!!campaign?.enable_gifting);
    setThemes(
      (campaign?.ecard_themes || [])
        .slice()
        .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
        .map((theme) => ({ ...theme }))
    );
    setPreview(0);
  }, [campaign]);

  const set = (index, key, value) =>
    setThemes((prev) => prev.map((theme, i) => (i === index ? { ...theme, [key]: value } : theme)));

  const move = (index, direction) => {
    setThemes((prev) => {
      const next = prev.slice();
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const upload = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(String(index));
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    set(index, 'image_url', file_url);
    setUploading('');
  };

  const save = async () => {
    setSaving(true);
    await onSave({
      enable_gifting: enabled,
      ecard_themes: themes
        .filter((theme) => theme.name?.trim() || theme.image_url)
        .map((theme, index) => ({
          ...theme,
          name: theme.name?.trim() || `Card ${index + 1}`,
          is_active: theme.is_active !== false,
          display_order: index,
        })),
    });
    setSaving(false);
  };

  const previewTheme = themes[preview] || themes[0];
  const previewPillar = (campaign?.pillars || []).find((pillar) => pillar.id === previewTheme?.id);
  const previewDonation = (campaign?.donation_products || []).find(
    (option) => option.is_active !== false && (option.pillar_id || '') === (previewPillar?.id || '')
  );
  const previewVariation = previewDonation?.variations?.[0];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display font-bold">Charitable gifting</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Let a supporter make their gift in someone's honour. They choose a card, write a message
              and pick when it arrives — the recipient gets a personalized card by email.
            </p>
          </div>
          <Badge className={enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}>
            {enabled ? 'On' : 'Off'}
          </Badge>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Offer gifting on this campaign's page
        </label>
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm">Christmas e-cards</h3>
            <Button variant="outline" size="sm" onClick={() => setThemes((prev) => [...prev, newTheme()])}>
              <Plus className="w-4 h-4 mr-1" /> Add a design
            </Button>
          </div>

          {themes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No card designs yet — add artwork supporters can choose from.
            </p>
          )}

          {themes.map((theme, index) => (
            <Card key={theme.id} className={preview === index ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" className="text-xs uppercase tracking-wide text-muted-foreground" onClick={() => setPreview(index)}>
                    Card {index + 1} · preview
                  </button>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => move(index, -1)} aria-label="Move up">
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => move(index, 1)} aria-label="Move down">
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setThemes((prev) => prev.filter((_, i) => i !== index))}
                      aria-label="Remove design"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-start gap-3">
                  {theme.image_url ? (
                    <img src={theme.image_url} alt="" className="h-20 w-32 rounded-lg object-cover" />
                  ) : (
                    <div className="h-20 w-32 rounded-lg bg-muted flex items-center justify-center">
                      <ImagePlus className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-[180px] space-y-2">
                    <div>
                      <Label>Design name</Label>
                      <Input value={theme.name || ''} onChange={(e) => set(index, 'name', e.target.value)} placeholder="e.g. Snowy evening" />
                    </div>
                    <Button variant="outline" size="sm" asChild disabled={uploading === String(index)}>
                      <label className="cursor-pointer">
                        {uploading === String(index) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-2" />}
                        {theme.image_url ? 'Replace artwork' : 'Add artwork'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(index, e)} />
                      </label>
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Gift wording (bottom box)</Label>
                  <Textarea
                    rows={2}
                    value={theme.message || ''}
                    onChange={(e) => set(index, 'message', e.target.value)}
                    placeholder="The gift description beneath the donor's personal message"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={theme.is_active !== false}
                    onChange={(e) => set(index, 'is_active', e.target.checked)}
                  />
                  Supporters can pick this design
                </label>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2 lg:sticky lg:top-4">
          <h3 className="font-display font-bold text-sm">What the recipient sees</h3>
          <GiftCardPreview
            campaign={campaign}
            theme={previewTheme}
            recipientName="Jordan"
            donorName="The Candora team"
            giftName={previewPillar?.gift_name || previewTheme?.name}
            description={campaign?.description || ''}
            donationName={previewDonation ? [previewDonation.name, previewVariation?.label].filter(Boolean).join(' — ') : ''}
            amount={previewVariation?.amount ?? previewDonation?.amount}
            message=""
          />
          <p className="text-xs text-muted-foreground">
            Cards are emailed with a link that opens the full card, so the artwork and message read
            properly on any phone.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save gifting settings'}</Button>
      </div>
    </div>
  );
}