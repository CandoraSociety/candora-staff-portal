import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { buildPublicInvite } from '../../shared/giftShopInvites.ts';

// Public endpoint — no auth. The token in the link is the check. Returns only
// what the invitation page needs: the guardian's name, how many children the
// invitation covers, its state, and live slot availability. Contact details are
// deliberately withheld so the page itself never reveals them.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json().catch(() => ({}));
    const clean = typeof token === 'string' ? token.trim() : '';
    if (clean.length < 16) {
      return Response.json({ state: 'invalid' }, { status: 400 });
    }

    const result = await buildPublicInvite(base44.asServiceRole, clean);
    if (!result) {
      return Response.json({ state: 'invalid' }, { status: 404 });
    }
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}