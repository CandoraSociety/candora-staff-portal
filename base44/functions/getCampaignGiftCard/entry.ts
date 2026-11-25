import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Opens a charitable gift card by its unguessable token — no staff sign-in, the
// recipient of the gift is the one who follows the link. Serves the card, the
// campaign it belongs to, and the certificate wording when the campaign issues
// certificates. Nothing else about the campaign or the supporter is exposed.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const token = String(body.token || '').trim();
    if (!token) return Response.json({ error: 'token is required' }, { status: 400 });

    const { items } = await base44.asServiceRole.entities.CampaignGiftCard.filter({ token }, { limit: 1 });
    const card = (items || [])[0];
    if (!card) return Response.json({ error: 'Not found' }, { status: 404 });

    const campaign = await base44.asServiceRole.entities.DonationCampaign
      .get(card.campaign_id)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));

    // What the gift made possible — kept on the card, with the cause's own
    // wording as the fallback for cards written before it was stored.
    const cardPillar = (campaign?.pillars || []).find((item) => item.id === card.pillar_id);

    return Response.json({
      card: {
        token: card.token,
        campaign_name: card.campaign_name,
        pillar_name: card.pillar_name || '',
        gift_name: cardPillar?.gift_name || '',
        gift_description: card.gift_description || cardPillar?.description || campaign?.description || '',
        recipient_name: card.recipient_name || '',
        donor_name: card.is_anonymous ? '' : (card.donor_name || ''),
        is_anonymous: !!card.is_anonymous,
        message: card.message || '',
        theme_name: card.theme_name || '',
        theme_image_url: card.theme_image_url || campaign?.hero_image_url || '',
        amount: Number(card.amount) || 0,
        delivered_at: card.delivered_at || '',
        created_date: card.created_date || '',
      },
      certificate: campaign?.certificate_enabled
        ? {
            enabled: true,
            title: campaign.certificate_title || 'Certificate of Giving',
            message: campaign.certificate_message || '',
            signature: campaign.certificate_signature || '',
            signature_title: campaign.certificate_signature_title || '',
          }
        : { enabled: false },
      campaign: campaign
        ? {
            name: campaign.name,
            slug: campaign.slug || '',
            tagline: campaign.tagline || '',
            hero_image_url: campaign.hero_image_url || '',
            // The emblem each card design carries, so the card still shows it.
            ecard_themes: (campaign.ecard_themes || []).map((theme) => ({
              name: theme.name || '',
              motif_url: theme.motif_url || '',
              motif_dark: !!theme.motif_dark,
            })),
          }
        : null,
    });
  } catch (error) {
    console.error('getCampaignGiftCard failed', error?.message || error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}