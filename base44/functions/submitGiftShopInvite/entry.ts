import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { redeemGiftShopInvite } from '../../shared/giftShopInvites.ts';

// Public endpoint — no auth. Redeems a private pre-registration invitation:
// validates the token, single use, expiry, the matching contact details, the
// sibling limit and the slot capacity before writing any registration.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const token = typeof payload?.token === 'string' ? payload.token.trim() : '';
    if (token.length < 16) {
      return Response.json({ error: 'This invitation link was not recognised. Please call the office.' }, { status: 400 });
    }

    const result = await redeemGiftShopInvite(base44.asServiceRole, token, payload);
    if (!result.ok) {
      return Response.json({ error: result.message }, { status: result.status || 400 });
    }
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}