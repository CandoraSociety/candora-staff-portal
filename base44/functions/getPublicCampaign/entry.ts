import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Public campaign page endpoint. Visitors have no staff sign-in, so this serves
// one campaign's public page and its progress, and nothing else. A campaign
// whose page is not published is only readable by signed-in staff, so they can
// preview it before it goes live.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug || '').trim().toLowerCase();
    const campaignId = String(body.campaignId || '').trim();

    if (!slug && !campaignId) {
      return Response.json({ error: 'slug is required' }, { status: 400 });
    }

    let campaign = null;
    if (campaignId) {
      campaign = await base44.asServiceRole.entities.DonationCampaign
        .get(campaignId)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    } else {
      const page = await base44.asServiceRole.entities.DonationCampaign.filter({ slug }, { limit: 1 });
      campaign = (page.items || [])[0] || null;
    }
    if (!campaign) return Response.json({ error: 'Not found' }, { status: 404 });

    let preview = false;
    if (!campaign.public_page_enabled) {
      const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
      if (!user) return Response.json({ error: 'Not found' }, { status: 404 });
      preview = true;
    }

    const totals = await base44.asServiceRole.entities.Donation
      .aggregate({ query: { campaign_id: campaign.id }, sum: ['amount'] })
      .catch(() => ({ rows: [] }));
    const row = (totals.rows || [])[0] || {};

    // Progress for each pillar, so every cause shows what it has raised on its
    // own while the campaign's total stays the sum of them.
    const pillarTotals = await base44.asServiceRole.entities.Donation
      .aggregate({ query: { campaign_id: campaign.id }, groupBy: 'pillar_id', sum: ['amount'] })
      .catch(() => ({ rows: [] }));
    const pillars = (pillarTotals.rows || []).map((group) => ({
      pillar_id: group.pillar_id || '',
      raised: Number(group.sum_amount) || 0,
      giftCount: Number(group.count) || 0,
    }));

    const { notes, ...publicCampaign } = campaign;

    return Response.json({
      campaign: publicCampaign,
      raised: Number(row.sum_amount) || 0,
      giftCount: Number(row.count) || 0,
      pillars,
      preview,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}