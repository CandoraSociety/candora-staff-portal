// Charitable gifting on a campaign's public page. A supporter can make their
// gift in someone's honour, choose a greeting card design, write a message and
// pick when it is delivered. The card is created by the payment webhook — never
// from the browser — so a card only exists for a gift that actually went
// through, and it is always tied to the Donation recorded for it.

import { sendGiftShopText } from './giftShopSms.ts';
import { getGiftCardContent, themeGiftWording } from './campaignGiftCardContent.ts';

export function newGiftToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

const clean = (value, max = 500) => String(value || '').trim().slice(0, max);

// The e-card design chosen, falling back to the campaign's first design and then
// to the campaign's own hero photo, so every card renders with artwork.
export function pickTheme(campaign, themeId) {
  const themes = (campaign?.ecard_themes || []).filter((theme) => theme.is_active !== false);
  const chosen = themes.find((theme) => theme.id === String(themeId || ''));
  const theme = chosen || themes[0] || null;
  return {
    id: theme?.id || '',
    name: theme?.name || '',
    image_url: theme?.image_url || campaign?.hero_image_url || '',
  };
}

// Kept separate from the donor's personal message on every design.
export function themeGreeting(campaign, themeId) {
  return themeGiftWording(campaign, themeId);
}

// Writes the card for a confirmed gift. `deliverAt` in the past (or missing)
// means it goes out now.
export async function createGiftCardForIntent(base44, intent, donation) {
  const campaign = await base44.asServiceRole.entities.DonationCampaign
    .get(intent.campaign_id)
    .catch((e) => (e.status === 404 ? null : Promise.reject(e)));

  const theme = pickTheme(campaign, intent.card_theme_id);
  // What the gift makes possible, kept on the card so the recipient can read
  // what was given in their honour.
  const pillar = (campaign?.pillars || []).find((item) => item.id === (intent.pillar_id || ''));
  const giftDescription = themeGiftWording(campaign, theme.id) || clean(pillar?.description || campaign?.description, 2000);
  const now = new Date();
  const wanted = intent.deliver_at ? new Date(intent.deliver_at) : now;
  const deliverAt = Number.isNaN(wanted.getTime()) || wanted.getTime() <= now.getTime() ? now : wanted;

  return base44.asServiceRole.entities.CampaignGiftCard.create({
    campaign_id: intent.campaign_id,
    campaign_name: intent.campaign_name || campaign?.name || '',
    pillar_id: intent.pillar_id || '',
    pillar_name: intent.pillar_name || '',
    gift_description: giftDescription,
    donation_id: donation.id,
    amount: Number(intent.amount) || 0,
    donor_name: intent.is_anonymous ? '' : (intent.donor_name || ''),
    donor_email: intent.donor_email || '',
    is_anonymous: !!intent.is_anonymous,
    recipient_name: clean(intent.recipient_name, 120),
    recipient_email: clean(intent.recipient_email, 200),
    recipient_phone: clean(intent.recipient_phone, 20),
    text_recipient: !!intent.text_recipient,
    message: clean(intent.card_message, 1000),
    theme_id: theme.id,
    theme_name: theme.name,
    theme_image_url: theme.image_url,
    token: newGiftToken(),
    app_url: clean(intent.app_url, 300),
    deliver_at: deliverAt.toISOString(),
    status: 'scheduled',
  });
}

// Emails the card to its recipient. The recipient never sees the supporter's
// email address, and the card and certificate links are built from the app
// address the gift was made in — never from the caller.
export async function deliverGiftCard(base44, card) {
  if (!card?.recipient_email) {
    await base44.asServiceRole.entities.CampaignGiftCard
      .update(card.id, { status: 'failed', failure_reason: 'No email address for the recipient.' })
      .catch(() => {});
    return { success: false, reason: 'missing_recipient' };
  }

  const campaign = await base44.asServiceRole.entities.DonationCampaign
    .get(card.campaign_id)
    .catch((e) => (e.status === 404 ? null : Promise.reject(e)));

  const base = String(card.app_url || '').replace(/\/+$/, '');
  const cardLink = `${base}/gift-card/${card.token}`;
  const certificateLink = campaign?.certificate_enabled ? `${base}/certificate/${card.token}` : '';
  const greeting = clean(card.message, 1000);
  const content = await getGiftCardContent(base44, card, campaign);
  const giftName = content.gift_name;
  const giftDescription = content.gift_description;

  try {
    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      to: card.recipient_email,
      template_name: 'CampaignGiftCard',
      category: 'transactional',
      variables: {
        recipient_name: card.recipient_name,
        donor_line: card.is_anonymous ? 'Someone who cares about you' : (card.donor_name || 'Someone who cares about you'),
        campaign_name: card.campaign_name,
        gift_line: giftName,
        pillar_line: card.pillar_name ? `Your gift supports ${card.pillar_name}.` : '',
        gift_description: giftDescription,
        donation_selection: [content.product_name, Number(card.amount) > 0 ? `${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Number(card.amount))} CAD` : ''].filter(Boolean).join(' · '),
        greeting,
        card_image_url: card.theme_image_url || campaign?.hero_image_url || '',
        card_link: cardLink,
        card_print_link: `${cardLink}?print=1`,
        certificate_link: certificateLink,
        certificate_note: certificateLink
          ? 'Your personal certificate is ready to open and print.'
          : '',
      },
    });

    if (result?.success === false) {
      const reason = result.reason || result.message || 'The email could not be sent.';
      await base44.asServiceRole.entities.CampaignGiftCard
        .update(card.id, { status: 'failed', failure_reason: reason })
        .catch(() => {});
      return { success: false, reason };
    }

    // When the supporter asked for a text too, it goes out with the card.
    let textedAt = '';
    let textFailure = '';
    if (card.text_recipient && card.recipient_phone) {
      const firstName = String(card.recipient_name || '').trim().split(/\s+/)[0];
      const from = card.is_anonymous
        ? 'Someone who cares about you'
        : (card.donor_name || 'Someone who cares about you');
      const text = await sendGiftShopText(
        card.recipient_phone,
        `Hi ${firstName || 'there'}, ${from} made a donation${
          giftName ? ` — ${giftName} —` : ''
        } to Candora Society as a gift to you. Open your card: ${cardLink}`,
      );
      if (text.ok) textedAt = new Date().toISOString();
      else textFailure = text.reason || 'The text could not be sent.';
    }

    await base44.asServiceRole.entities.CampaignGiftCard.update(card.id, {
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      failure_reason: '',
      ...(textedAt ? { texted_at: textedAt } : {}),
      ...(textFailure ? { text_failure_reason: textFailure } : {}),
    });
    return { success: true };
  } catch (error) {
    const reason = error?.message || 'The email could not be sent.';
    await base44.asServiceRole.entities.CampaignGiftCard
      .update(card.id, { status: 'failed', failure_reason: reason })
      .catch(() => {});
    return { success: false, reason };
  }
}