import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Copy, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { publicCampaignUrl } from '@/lib/donorConstants';

const newPillar = () => ({
  id: `pillar-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  tagline: '',
  description: '',
  image_url: '',
  goal_amount: '',
  is_active: true,
});

// The causes inside a campaign. Each pillar is promoted, given to and reported
// on its own while the campaign stays one appeal with one total.
export default function CampaignPillarsPanel({ campaign, onSave }) {
  const [enabled, setEnabled] = useState(false);
  const [pillars, setPillars] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    setEnabled(!!campaign?.enable_pillars);
    setPillars(
      (campaign?.pillars || [])
        .slice()
        .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
        .map((pillar) => ({ ...pillar, goal_amount: pillar.goal_amount ?? '' }))
    );
  }, [campaign]);

  const set = (index, key, value) =>
    setPillars((prev) => prev.map((pillar, i) => (i === index ? { ...pillar, [key]: value } : pillar)));

  const move = (index, direction) => {
    setPillars((prev) => {
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
      enable_pillars: enabled,
      pillars: pillars
        .filter((pillar) => pillar.name?.trim())
        .map((pillar, index) => ({
          ...pillar,
          name: pillar.name.trim(),
          goal_amount: Number(pillar.goal_amount) || 0,
          is_active: pillar.is_active !== false,
          display_order: index,
        })),
    });
    setSaving(false);
  };

  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display font-bold">Fundraising pillars</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Split this campaign into causes supporters can give to individually. Each one gets its own
              page section, share link and progress, while every gift still counts toward the campaign.
            </p>
          </div>
          <Badge className={enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}>
            {enabled ? 'On' : 'Off'}
          </Badge>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Run this campaign with pillars
        </label>
      </div>

      {pillars.map((pillar, index) => (
        <Card key={pillar.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Pillar {index + 1}
              </span>
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
                  onClick={() => setPillars((prev) => prev.filter((_, i) => i !== index))}
                  aria-label="Remove pillar"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-[1fr_140px] gap-3">
              <div>
                <Label>Pillar name</Label>
                <Input
                  value={pillar.name || ''}
                  onChange={(e) => set(index, 'name', e.target.value)}
                  placeholder="e.g. Joy — Kids Gift Shop"
                />
              </div>
              <div>
                <Label>Goal (CAD)</Label>
                <Input
                  type="number"
                  min="0"
                  value={pillar.goal_amount}
                  onChange={(e) => set(index, 'goal_amount', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Tagline</Label>
              <Input
                value={pillar.tagline || ''}
                onChange={(e) => set(index, 'tagline', e.target.value)}
                placeholder="One line under the name"
              />
            </div>

            <div>
              <Label>What gifts to this pillar make possible</Label>
              <Textarea
                rows={2}
                value={pillar.description || ''}
                onChange={(e) => set(index, 'description', e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {pillar.image_url ? (
                <img src={pillar.image_url} alt="" className="h-16 w-24 rounded-lg object-cover" />
              ) : (
                <div className="h-16 w-24 rounded-lg bg-muted flex items-center justify-center">
                  <ImagePlus className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <Button variant="outline" size="sm" asChild disabled={uploading === String(index)}>
                <label className="cursor-pointer">
                  {uploading === String(index) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-2" />}
                  {pillar.image_url ? 'Replace photo' : 'Add photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(index, e)} />
                </label>
              </Button>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={pillar.is_active !== false}
                  onChange={(e) => set(index, 'is_active', e.target.checked)}
                />
                Shown on the page
              </label>
            </div>

            {pillar.name?.trim() && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                <span className="truncate">
                  {publicCampaignUrl(campaign.slug)}?pillar={pillar.id}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => copy(`${publicCampaignUrl(campaign.slug)}?pillar=${pillar.id}`, pillar.id)}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> {copied === pillar.id ? 'Copied' : 'Copy'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => setPillars((prev) => [...prev, newPillar()])}>
          <Plus className="w-4 h-4 mr-2" /> Add a pillar
        </Button>
        <Button onClick={save} disabled={saving} className="ml-auto">
          {saving ? 'Saving…' : 'Save pillars'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Giving options are attached to a pillar in the Giving options tab. Gifts recorded against a
        pillar show in Reporting, split by cause.
      </p>
    </div>
  );
}