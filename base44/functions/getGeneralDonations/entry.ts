import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// The public donation page's data: the general fund's own giving options, plus
// every campaign that is still open and published. Visitors have no sign-in, so
// only public-safe fields leave here.
const activeOptions = (campaign) =>
  (campaign.donation_products || [])
    .filter((option) => option.is_active !== false && Number(option.amount) > 0)
    .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

const publicCampaign = (campaign) => ({
  id: campaign.id,
  name: campaign.name,
  slug: campaign.slug || '',
  tagline: campaign.tagline || '',
  description: campaign.description || '',
  hero_image_url: campaign.hero_image_url || '',
  goal_amount: Number(campaign.goal_amount) || 0,
  allow_custom_amount: campaign.allow_custom_amount !== false,
  allow_monthly: campaign.allow_monthly !== false,
  allow_fee_coverage: campaign.allow_fee_coverage !== false,
  thank_you_message: campaign.thank_you_message || '',
  tax_receipt_note: campaign.tax_receipt_note || '',
  donation_products: activeOptions(campaign),
});

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const rows = await base44.asServiceRole.entities.DonationCampaign.list('-created_date', 200);
    const campaigns = Array.isArray(rows) ? rows : (rows?.items || []);

    const general = campaigns.find((campaign) => campaign.is_general_fund) || null;
    const today = new Date().toISOString().slice(0, 10);

    const open = campaigns.filter((campaign) =>
      !campaign.is_general_fund &&
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

    return Response.json({
      general: general ? publicCampaign(general) : null,
      campaigns: open.map((campaign) => ({
        ...publicCampaign(campaign),
        ...(raisedBy[campaign.id] || { raised: 0, gifts: 0 }),
      })),
    });
  } catch (error) {
    console.error('getGeneralDonations failed', error?.message || error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}