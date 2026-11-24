import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { deliverGiftCard } from '../../shared/campaignGiftCards.ts';

// Sends the charitable gift cards whose delivery time has come. Run every few
// minutes by the Campaign Gift Card Deliveries workflow; an admin can also call
// it with one card_id to send that card straight away.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    let cards = [];

    if (body.card_id) {
      const card = await base44.asServiceRole.entities.CampaignGiftCard
        .get(String(body.card_id))
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (card) cards = [card];
    } else {
      const { items } = await base44.asServiceRole.entities.CampaignGiftCard.filter(
        { status: 'scheduled', deliver_at: { $lte: new Date().toISOString() } },
        { limit: 50, sort: 'deliver_at' }
      );
      cards = items || [];
    }

    const results = [];
    for (const card of cards) {
      const result = await deliverGiftCard(base44, card);
      results.push({ id: card.id, ...result });
    }

    return Response.json({
      processed: cards.length,
      sent: results.filter((result) => result.success).length,
      results,
    });
  } catch (error) {
    console.error('sendScheduledCampaignGiftCards failed', error?.message || error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}