import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Gift } from 'lucide-react';
import GiftCardPreview from '@/components/campaign-public/GiftCardPreview';

// The charitable gifting part of the giving box: who the gift is for, the card
// design, the message and when it should arrive. Every change flows straight
// into the live preview beside it.
export default function CampaignGiftFields({ campaign, value, onChange, donorName, pillar }) {
  const themes = (campaign?.ecard_themes || []).filter((theme) => theme.is_active !== false);
  const giftName =
    String(pillar?.gift_name || '').trim() || 'The Gift of Joy, Hope & Belonging';
  const selectedTheme =
    themes.find((theme) => theme.id === value.cardThemeId) || themes[0] || null;

  const set = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
      <label className="flex items-start gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={!!value.isGift}
          onChange={(e) => set('isGift', e.target.checked)}
        />
        <span>
          <span className="flex items-center gap-1.5 font-medium">
            <Gift className="w-4 h-4 text-primary" /> Make this a gift for someone
          </span>
          <span className="block text-xs text-muted-foreground">
            They'll receive a personalized greeting card saying a gift was made in their honour.
          </span>
          <span className="mt-1.5 inline-block rounded-full bg-[#0a0f29] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#fccf03]">
            {giftName}
          </span>
        </span>
      </label>

      {value.isGift && (
        <div className="space-y-3 pt-1">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="gift-recipient">Their name</Label>
              <Input
                id="gift-recipient"
                value={value.recipientName || ''}
                onChange={(e) => set('recipientName', e.target.value)}
                placeholder="Who is it for?"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="gift-email">Their email</Label>
              <Input
                id="gift-email"
                type="email"
                value={value.recipientEmail || ''}
                onChange={(e) => set('recipientEmail', e.target.value)}
                placeholder="Where the card goes"
                className="mt-1.5"
              />
            </div>
          </div>

          {themes.length > 0 && (
            <div>
              <Label>Choose a card</Label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => set('cardThemeId', theme.id)}
                    className={`relative rounded-lg overflow-hidden border-2 text-left transition-colors ${
                      selectedTheme?.id === theme.id ? 'border-primary' : 'border-transparent hover:border-border'
                    }`}
                  >
                    <span className="block h-14 bg-sidebar">
                      {theme.image_url && (
                        <img src={theme.image_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="block px-1.5 py-1 text-[11px] leading-tight truncate">
                      {theme.name || 'Card'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="gift-message">Your message</Label>
            <Textarea
              id="gift-message"
              rows={3}
              value={value.cardMessage || ''}
              onChange={(e) => set('cardMessage', e.target.value)}
              placeholder="Write something they'll keep."
              className="mt-1.5"
            />
          </div>

          <GiftCardPreview
            campaign={campaign}
            theme={selectedTheme}
            recipientName={value.recipientName}
            donorName={donorName}
            giftName={giftName}
            description={String(pillar?.description || campaign?.description || '').trim()}
            message={value.cardMessage || selectedTheme?.message}
          />

          <div>
            <Label>When should it arrive?</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {[
                { value: 'now', label: 'Right away' },
                { value: 'later', label: 'On a day I choose' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => set('delivery', option.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    value.delivery === option.value ? 'border-primary bg-primary/10' : 'hover:bg-muted/60'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {value.delivery === 'later' && (
              <Input
                type="date"
                className="mt-2"
                min={new Date().toISOString().slice(0, 10)}
                value={value.deliverAt || ''}
                onChange={(e) => set('deliverAt', e.target.value)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}