import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// The public donation page's data: the general fund's own giving options, plus
// every campaign that is still open and published. Visitors have no sign-in, so
// only public-safe fields leave here.
const activeOptions = (campaign) =>
  (campaign.donation_products || [])
    .filter((option) => option.is_active !== false && Number(option.amount) > 0)
    .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

// The causes inside a campaign, so the campaigns page can present each one on
// its own instead of sending visitors through another page first.
const activePillars = (campaign) =>
  (campaign.pillars || [])
    .filter((pillar) => pillar.is_active !== false)
    .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
    .map((pillar) => ({
      id: pillar.id,
      name: pillar.name || '',
      headline: pillar.headline || '',
      gift_name: pillar.gift_name || '',
      tagline: pillar.tagline || '',
      description: pillar.description || '',
      image_url: pillar.image_url || '',
      image_alt: pillar.image_alt || '',
      image_position: pillar.image_position || 'center',
      image_provisional: pillar.image_provisional !== false,
      goal_amount: Number(pillar.goal_amount) || 0,
      display_order: Number(pillar.display_order) || 0,
    }));

// The greeting card designs a supporter can choose when they give in someone's
// honour, so the gifting feature can show an example card.
const activeCards = (campaign) =>
  (campaign.ecard_themes || [])
    .filter((card) => card.is_active !== false)
    .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
    .map((card) => ({
      id: card.id,
      name: card.name || '',
      image_url: card.image_url || '',
      message: card.message || '',
    }));

const publicCampaign = (campaign) => ({
  id: campaign.id,
  name: campaign.name,
  slug: campaign.slug || '',
  tagline: campaign.tagline || '',
  description: campaign.description || '',
  hero_image_url: campaign.hero_image_url || '',
  hero_image_alt: campaign.hero_image_alt || '',
  hero_image_position: campaign.hero_image_position || 'center',
  share_image_url: campaign.share_image_url || '',
  seasonal_theme: campaign.seasonal_theme || 'none',
  garland_horizontal_url: campaign.garland_horizontal_url || '',
  garland_vertical_url: campaign.garland_vertical_url || '',
  goal_amount: Number(campaign.goal_amount) || 0,
  contact_email: campaign.contact_email || '',
  allow_custom_amount: campaign.allow_custom_amount !== false,
  allow_monthly: campaign.allow_monthly !== false,
  allow_fee_coverage: campaign.allow_fee_coverage !== false,
  thank_you_message: campaign.thank_you_message || '',
  tax_receipt_note: campaign.tax_receipt_note || '',
  enable_pillars: campaign.enable_pillars === true,
  pillars: activePillars(campaign),
  enable_gifting: campaign.enable_gifting === true,
  ecard_themes: activeCards(campaign),
  certificate_enabled: campaign.certificate_enabled === true,
  donation_products: activeOptions(campaign),
});

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const rows = await base44.asServiceRole.entities.DonationCampaign.list('-created_date', 200);
    const campaigns = Array.isArray(rows) ? rows : (rows?.items || []);

    const general = campaigns.find((campaign) => campaign.is_general_fund) || null;
    const today = new Date().toISOString().slice(0, 10);

    // A private campaign is never listed publicly: it is only ever opened from
    // the link staff share, so it is left out of this feed entirely.
    const open = campaigns.filter((campaign) =>
      !campaign.is_general_fund &&
      campaign.is_private !== true &&
      campaign.is_active !== false &&
      campaign.public_page_enabled === true &&
      (!campaign.end_date || String(campaign.end_date).slice(0, 10) >= today)
    );

    const totals = await base44.asServiceRole.entities.Donation
      .aggregate({ groupBy: 'campaign_id', sum: ['amount'] })
      .catch(() => ({ rows: [] }));

    const raisedBy = {};
    for (const row of totals.rows || []) {
      raisedBy[row.campaign_id] = {
        raised: Number(row.sum_amount) || 0,
        gifts: Number(row.count) || 0,
      };
    }

    // Progress for each cause, so a pillar card can show what it has raised on
    // its own while the campaign's total stays the sum of them.
    const pillarRaisedBy = {};
    for (const campaign of open.filter((item) => item.enable_pillars === true)) {
      const pillarTotals = await base44.asServiceRole.entities.Donation
        .aggregate({ query: { campaign_id: campaign.id }, groupBy: 'pillar_id', sum: ['amount'] })
        .catch(() => ({ rows: [] }));
      pillarRaisedBy[campaign.id] = (pillarTotals.rows || []).map((group) => ({
        pillar_id: group.pillar_id || '',
        raised: Number(group.sum_amount) || 0,
        giftCount: Number(group.count) || 0,
      }));
    }

    return Response.json({
      general: general ? publicCampaign(general) : null,
      campaigns: open.map((campaign) => ({
        ...publicCampaign(campaign),
        ...(raisedBy[campaign.id] || { raised: 0, gifts: 0 }),
        pillar_totals: pillarRaisedBy[campaign.id] || [],
      })),
    });
  } catch (error) {
    console.error('getGeneralDonations failed', error?.message || error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}