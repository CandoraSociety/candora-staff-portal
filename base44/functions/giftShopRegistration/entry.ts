import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  buildPublicGeneral,
  redeemGeneralRegistration,
  renderGiftShopForm,
  renderSuccessPage,
  readInviteForm,
  giftShopHtmlResponse,
} from '../../shared/giftShopInvitePage.ts';
import { confirmFamilyRegistration } from '../../shared/giftShopCheckin.ts';

// The Kids Gift Shop general registration form, open to the public. It is the
// same form families see through a pre-registration link, but with no
// invitation: anyone can open it, as often as their family needs, until
// December 9th or until every shopping time is full.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    if (req.method === 'POST') {
      const form = await req.formData();
      const { payload, values } = readInviteForm(form);
      const submission = {
        guardian_name: payload.guardian_name,
        guardian_phone: payload.guardian_phone,
        guardian_email: payload.guardian_email,
        time_slot: payload.time_slot,
        children: payload.children,
      };

      if (!values.data_ack) {
        const current = await buildPublicGeneral(base44.asServiceRole);
        return giftShopHtmlResponse(
          renderGiftShopForm({
            mode: 'general',
            state: current.state,
            invite: current,
            slots: current.slots,
            values,
            error: 'Please tick the box confirming how your information is stored, then complete registration.',
          }),
          400,
        );
      }

      const result = await redeemGeneralRegistration(base44.asServiceRole, submission);
      if (result.ok) {
        const confirmed = await confirmFamilyRegistration(base44.asServiceRole, result.registration_ids);
        return giftShopHtmlResponse(renderSuccessPage({ ...result, ...confirmed }));
      }

      const current = await buildPublicGeneral(base44.asServiceRole);
      return giftShopHtmlResponse(
        renderGiftShopForm({
          mode: 'general',
          state: current.state,
          invite: current,
          slots: current.slots,
          values,
          error: result.message,
        }),
        result.status || 400,
      );
    }

    const data = await buildPublicGeneral(base44.asServiceRole);
    return giftShopHtmlResponse(
      renderGiftShopForm({
        mode: 'general',
        state: data.state,
        invite: data,
        slots: data.slots,
        values: {},
      }),
    );
  } catch (error) {
    console.log('giftShopRegistration failed:', error.message);
    return giftShopHtmlResponse(renderGiftShopForm({ mode: 'general', state: 'invalid' }), 500);
  }
}