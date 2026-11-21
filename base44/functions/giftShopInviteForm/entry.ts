import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  buildPublicInvite,
  redeemGiftShopInvite,
  renderInvitePage,
  renderSuccessPage,
  readInviteForm,
  giftShopHtmlResponse,
} from '../../shared/giftShopInvitePage.ts';

// The Kids Gift Shop pre-registration form, served as its own standalone page.
// Nothing from the portal is loaded here and no app data is reachable: the page
// is built from one invitation and posts back to this same function.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('token') || '';

    if (req.method === 'POST') {
      const form = await req.formData();
      const { payload, values } = readInviteForm(form);
      const token = values.token || queryToken;

      const result = await redeemGiftShopInvite(base44.asServiceRole, token, payload);
      if (result.ok) {
        return giftShopHtmlResponse(renderSuccessPage(result));
      }

      const current = token ? await buildPublicInvite(base44.asServiceRole, token) : null;
      return giftShopHtmlResponse(
        renderInvitePage({
          state: current?.state || 'invalid',
          invite: current?.invite,
          slots: current?.slots || [],
          values: { ...values, token },
          error: result.message,
        }),
        result.status || 400,
      );
    }

    const data = queryToken ? await buildPublicInvite(base44.asServiceRole, queryToken) : null;
    return giftShopHtmlResponse(
      renderInvitePage({
        state: data?.state || 'invalid',
        invite: data?.invite,
        slots: data?.slots || [],
        values: { token: queryToken, guardian_name: data?.invite?.guardian_name || '' },
      }),
    );
  } catch (error) {
    console.log('giftShopInviteForm failed:', error.message);
    return giftShopHtmlResponse(renderInvitePage({ state: 'invalid' }), 500);
  }
}