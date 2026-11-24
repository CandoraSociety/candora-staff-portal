import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone } from 'lucide-react';
import CampaignImageSlot from '@/components/donors/campaign/CampaignImageSlot';
import { pillarHeadline } from '@/lib/campaignDisplay';

// Every photo the campaign uses in one place: the hero, the three cause cards,
// the social sharing picture and Candora's garland artwork. A photo replaced
// here is only used where it is placed — nothing else on the campaign changes.
export default function CampaignImagesPanel({ campaign, onSave }) {
  const [values, setValues] = useState({});
  const [view, setView] = useState('desktop');
  const [busy, setBusy] = useState('');
  const [saving, setSaving] = useState(false);

  const pillars = useMemo(() => campaign?.pillars || [], [campaign]);
  const history = campaign?.image_history || [];

  const slots = useMemo(() => ([
    {
      key: 'hero',
      label: 'Campaign hero photo',
      hint: 'Behind the campaign name at the top of the public page.',
    },
    ...pillars.map((pillar) => ({
      key: `pillar:${pillar.id}`,
      label: pillarHeadline(pillar),
      hint: 'The photo on this cause’s card.',
    })),
    {
      key: 'share',
      label: 'Social sharing image',
      hint: 'Shown when the campaign link is shared on social media or in a message.',
    },
  ]), [pillars]);

  const garlands = [
    {
      key: 'garland_horizontal',
      label: 'Christmas garland — across the top',
      hint: 'Candora’s garland artwork as a transparent PNG. Sits over the hero photo.',
      noAlt: true,
    },
    {
      key: 'garland_vertical',
      label: 'Christmas garland — down the side',
      hint: 'The vertical garland, shown at the left edge on wide screens.',
      noAlt: true,
    },
  ];

  useEffect(() => {
    const next = {
      hero: {
        url: campaign?.hero_image_url || '',
        alt: campaign?.hero_image_alt || '',
        position: campaign?.hero_image_position || 'center',
        provisional: campaign?.hero_image_provisional !== false,
      },
      share: {
        url: campaign?.share_image_url || '',
        alt: '',
        position: 'center',
        provisional: false,
      },
      garland_horizontal: { url: campaign?.garland_horizontal_url || '' },
      garland_vertical: { url: campaign?.garland_vertical_url || '' },
    };
    pillars.forEach((pillar) => {
      next[`pillar:${pillar.id}`] = {
        url: pillar.image_url || '',
        alt: pillar.image_alt || '',
        position: pillar.image_position || 'center',
        provisional: pillar.image_provisional !== false,
      };
    });
    setValues(next);
  }, [campaign, pillars]);

  const setSlot = (key, patch) =>
    setValues((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));

  const upload = async (key, file) => {
    setBusy(key);
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    setSlot(key, { url: file_url, provisional: true });
    setBusy('');
  };

  // The photo a slot holds right now, before any unsaved change.
  const savedUrl = (key) => {
    if (key === 'hero') return campaign?.hero_image_url || '';
    if (key === 'share') return campaign?.share_image_url || '';
    if (key === 'garland_horizontal') return campaign?.garland_horizontal_url || '';
    if (key === 'garland_vertical') return campaign?.garland_vertical_url || '';
    const pillar = pillars.find((item) => `pillar:${item.id}` === key);
    return pillar?.image_url || '';
  };

  const savedAlt = (key) => {
    if (key === 'hero') return campaign?.hero_image_alt || '';
    const pillar = pillars.find((item) => `pillar:${item.id}` === key);
    return pillar?.image_alt || '';
  };

  const save = async () => {
    setSaving(true);

    // A replaced photo is kept, so staff can put it back later.
    const replaced = slots
      .filter((slot) => {
        const previous = savedUrl(slot.key);
        return previous && previous !== (values[slot.key]?.url || '');
      })
      .map((slot) => ({
        slot: slot.key,
        url: savedUrl(slot.key),
        alt: savedAlt(slot.key),
        replaced_at: new Date().toISOString(),
      }));

    await onSave({
      hero_image_url: values.hero?.url || '',
      hero_image_alt: values.hero?.alt || '',
      hero_image_position: values.hero?.position || 'center',
      hero_image_provisional: values.hero?.provisional !== false,
      share_image_url: values.share?.url || '',
      garland_horizontal_url: values.garland_horizontal?.url || '',
      garland_vertical_url: values.garland_vertical?.url || '',
      pillars: pillars.map((pillar) => {
        const slot = values[`pillar:${pillar.id}`] || {};
        return {
          ...pillar,
          image_url: slot.url || '',
          image_alt: slot.alt || '',
          image_position: slot.position || 'center',
          image_provisional: slot.provisional !== false,
        };
      }),
      image_history: [...replaced, ...history].slice(0, 40),
    });

    setSaving(false);
  };

  const renderSlot = (slot) => (
    <CampaignImageSlot
      key={slot.key}
      slot={slot}
      value={values[slot.key] || {}}
      history={history.filter((entry) => entry.slot === slot.key)}
      view={view}
      busy={busy === slot.key}
      onChange={(patch) => setSlot(slot.key, patch)}
      onUpload={(file) => upload(slot.key, file)}
    />
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display font-bold">Photography &amp; artwork</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Each placement has its own photo, so one can be replaced without touching the rest of the
              campaign. Photos marked “Awaiting approval” are stand-ins until a staff member approves them.
            </p>
          </div>
          <div className="flex rounded-lg border overflow-hidden">
            {[
              { value: 'desktop', label: 'Desktop', Icon: Monitor },
              { value: 'mobile', label: 'Mobile', Icon: Smartphone },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setView(option.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${
                  view === option.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60'
                }`}
              >
                <option.Icon className="w-3.5 h-3.5" /> {option.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Use approved Candora photographs wherever they exist. A stand-in photo should never be
          presented as a picture of actual Candora participants.
        </p>
      </div>

      <div className="space-y-3">{slots.map(renderSlot)}</div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div>
          <h2 className="font-display font-bold">Candora Christmas artwork</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The garland carries the Christmas feeling, so the photographs can stay true to ordinary
            community life. Upload Candora’s approved garland artwork; nothing is drawn if it is left empty.
          </p>
        </div>
        <div className="space-y-3">{garlands.map(renderSlot)}</div>
      </div>

      <div className="rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground">Where the other artwork lives</p>
        <p>Christmas e-card designs are in the Gifting &amp; e-cards tab, and certificate wording is in Certificates.</p>
        <p>The combined Joy, Hope &amp; Belonging giving option uses Candora’s navy and gold styling rather than a photograph.</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save photography'}
        </Button>
      </div>
    </div>
  );
}