import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  buildPublicInvite,
  redeemGiftShopInvite,
  renderGiftShopForm,
  renderSuccessPage,
  readInviteForm,
  giftShopHtmlResponse,
} from '../../shared/giftShopInvitePage.ts';
import { confirmFamilyRegistration } from '../../shared/giftShopCheckin.ts';
import { loadGiftShopEvent } from '../../shared/giftShopEvent.ts';

// The Kids Gift Shop pre-registration form, served as its own standalone page.
// Nothing from the portal is loaded here and no app data is reachable: the page
// is built from one invitation and posts back to this same function.
// Gift gender is asked only for Other and Caregiver — every other recipient
// carries its own gender (see giftShopInvites.ts). Once the family registers,
// their check-in code reaches them by email and by text.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('token') || '';

    if (req.method === 'POST') {
      const form = await req.formData();
      const { payload, values } = readInviteForm(form);
      const token = values.token || queryToken;

      if (!values.data_ack) {
        const current = token ? await buildPublicInvite(base44.asServiceRole, token) : null;
        return giftShopHtmlResponse(
          renderGiftShopForm({
            state: current?.state || 'invalid',
            invite: current?.invite,
            slots: current?.slots || [],
            values: { ...values, token },
            error: 'Please tick the box confirming how your information is stored, then complete registration.',
          }),
          400,
        );
      }

      const result = await redeemGiftShopInvite(base44.asServiceRole, token, payload);
      if (result.ok) {
        const confirmed = await confirmFamilyRegistration(base44.asServiceRole, result.registration_ids);
        const event = await loadGiftShopEvent(base44);
        console.log('Gift shop invite registration confirmed — emailed:', confirmed.emailed, 'texted:', confirmed.texted);
        return giftShopHtmlResponse(renderSuccessPage({
          ...result,
          ...confirmed,
          event_date: event.event_date,
          event_location: event.event_location,
        }));
      }

      const current = token ? await buildPublicInvite(base44.asServiceRole, token) : null;
      return giftShopHtmlResponse(
        renderGiftShopForm({
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
      renderGiftShopForm({
        state: data?.state || 'invalid',
        invite: data?.invite,
        slots: data?.slots || [],
        values: { token: queryToken, guardian_name: data?.invite?.guardian_name || '' },
      }),
    );
  } catch (error) {
    console.log('giftShopInviteForm failed:', error.message);
    return giftShopHtmlResponse(renderGiftShopForm({ state: 'invalid' }), 500);
  }
}