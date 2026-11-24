import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePlus, Loader2 } from 'lucide-react';
import { CAMPAIGN_TYPES } from '@/lib/donorConstants';

// The full campaign profile — everything the staff side keeps about a campaign
// and everything its public page shows.
export default function CampaignProfileForm({ campaign, onSave }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm({
      name: '',
      tagline: '',
      description: '',
      story: '',
      campaign_type: 'appeal',
      goal_amount: '',
      start_date: '',
      end_date: '',
      owner_name: '',
      contact_email: '',
      hero_image_url: '',
      seasonal_theme: 'none',
      thank_you_message: '',
      tax_receipt_note: '',
      is_active: true,
      ...campaign,
      goal_amount: campaign?.goal_amount ?? '',
    });
  }, [campaign]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    set('hero_image_url', file_url);
    setUploading(false);
  };

  const submit = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    await onSave({
      name: form.name.trim(),
      tagline: form.tagline || '',
      description: form.description || '',
      story: form.story || '',
      campaign_type: form.campaign_type || 'appeal',
      goal_amount: form.goal_amount === '' ? null : Number(form.goal_amount),
      start_date: form.start_date || '',
      end_date: form.end_date || '',
      owner_name: form.owner_name || '',
      contact_email: form.contact_email || '',
      hero_image_url: form.hero_image_url || '',
      seasonal_theme: form.seasonal_theme || 'none',
      thank_you_message: form.thank_you_message || '',
      tax_receipt_note: form.tax_receipt_note || '',
      is_active: !!form.is_active,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="font-display font-bold">The basics</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Campaign name</Label>
            <Input value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.campaign_type} onValueChange={(v) => set('campaign_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CAMPAIGN_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Tagline</Label>
          <Input value={form.tagline || ''} onChange={(e) => set('tagline', e.target.value)}
            placeholder="One line that sums up the appeal" />
        </div>
        <div>
          <Label>Short description</Label>
          <Textarea rows={2} value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label>Goal (CAD)</Label>
            <Input type="number" min="0" value={form.goal_amount} onChange={(e) => set('goal_amount', e.target.value)} />
          </div>
          <div>
            <Label>Start date</Label>
            <Input type="date" value={form.start_date || ''} onChange={(e) => set('start_date', e.target.value)} />
          </div>
          <div>
            <Label>End date</Label>
            <Input type="date" value={form.end_date || ''} onChange={(e) => set('end_date', e.target.value)} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Campaign owner</Label>
            <Input value={form.owner_name || ''} onChange={(e) => set('owner_name', e.target.value)} />
          </div>
          <div>
            <Label>Contact email on the page</Label>
            <Input type="email" value={form.contact_email || ''} onChange={(e) => set('contact_email', e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
          Still accepting gifts
        </label>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="font-display font-bold">The public page</h2>
        <div>
          <Label>Hero photo</Label>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            {form.hero_image_url ? (
              <img src={form.hero_image_url} alt="" className="h-20 w-32 rounded-lg object-cover border" />
            ) : (
              <div className="h-20 w-32 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
                <ImagePlus className="w-5 h-5" />
              </div>
            )}
            <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer rounded-md border px-3 py-2 hover:bg-muted">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              {uploading ? 'Uploading…' : 'Upload photo'}
              <input type="file" accept="image/*" className="hidden" onChange={upload} disabled={uploading} />
            </label>
            {form.hero_image_url && (
              <Button variant="ghost" size="sm" onClick={() => set('hero_image_url', '')}>Remove</Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Shown at the top of the campaign page (stored publicly — anyone with the link can open it).
          </p>
        </div>
        <div>
          <Label>Seasonal theme</Label>
          <Select
            value={form.seasonal_theme || 'none'}
            onValueChange={(value) => set('seasonal_theme', value)}
          >
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None — the site's normal look</SelectItem>
              <SelectItem value="christmas">Christmas — festive accents</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1.5">
            Only this campaign's page is dressed — every other campaign stays as it is.
          </p>
        </div>
        <div>
          <Label>The story</Label>
          <Textarea rows={10} value={form.story || ''} onChange={(e) => set('story', e.target.value)}
            placeholder="Why this campaign matters, who it helps, and what a gift makes possible. Leave a blank line between paragraphs." />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Thank-you message</Label>
            <Textarea rows={3} value={form.thank_you_message || ''} onChange={(e) => set('thank_you_message', e.target.value)}
              placeholder="Shown after a gift goes through" />
          </div>
          <div>
            <Label>Tax receipt note</Label>
            <Textarea rows={3} value={form.tax_receipt_note || ''} onChange={(e) => set('tax_receipt_note', e.target.value)}
              placeholder="e.g. Tax receipts are issued for gifts of $20 or more." />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save campaign'}</Button>
      </div>
    </div>
  );
}