const clean = (value) => String(value || '').trim();

// The design's standard wording belongs below the donor's personal message.
export function themeGiftWording(campaign, themeId) {
  const themes = campaign?.ecard_themes || [];
  const theme = themes.find((item) => item.id === String(themeId || '')) || themes[0];
  return clean(theme?.message);
}

export async function getGiftCardContent(base44, card, campaign) {
  const donation = card.donation_id
    ? await base44.asServiceRole.entities.Donation.get(card.donation_id)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)))
    : null;
  const pillar = (campaign?.pillars || []).find((item) => item.id === card.pillar_id);
  const theme = (campaign?.ecard_themes || []).find((item) => item.id === card.theme_id);
  return {
    gift_name: clean(pillar?.gift_name || theme?.name),
    gift_description: themeGiftWording(campaign, card.theme_id) || clean(card.gift_description || pillar?.description || campaign?.description),
    product_name: donation?.campaign_id === card.campaign_id ? clean(donation.product_name) : '',
  };
}