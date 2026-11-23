import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
// Redeployed so the shared check-in changes ship with it.
import { giftShopHtmlResponse } from '../../shared/giftShopInvitePage.ts';
import { deskLookup, deskSubmit } from '../../shared/giftShopCheckin.ts';
import {
  renderCheckinCodePage,
  renderCheckinDonePage,
  renderCheckinNamePage,
  renderCheckinUnavailablePage,
} from '../../shared/giftShopCheckinPage.ts';

// The check-in form a family opens by scanning the QR code at the Kids Gift
// Shop desk. It is served on its own — outside the portal and outside the app's
// sign-in — so the phone never needs an account, a domain login or access to
// anything in Candora 360. The page posts back here, and the family's arrival is
// written to the desk session, which is what makes the desk computer print
// their name tag.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const service = base44.asServiceRole;
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('t') || '';

    if (req.method === 'POST') {
      const form = await req.formData().catch(() => new FormData());
      const sessionToken = String(form.get('t') || '') || queryToken;
      const action = String(form.get('action') || 'lookup');
      const code = String(form.get('code') || '');

      if (action === 'submit') {
        const result = await deskSubmit(service, {
          sessionToken,
          code,
          guardianName: String(form.get('guardian_name') || ''),
          guardianPhone: String(form.get('guardian_phone') || ''),
        });
        if (!result.ok) {
          const page = result.family
            ? renderCheckinNamePage({
              sessionToken,
              code,
              family: result.family,
              name: String(form.get('guardian_name') || ''),
              phone: String(form.get('guardian_phone') || ''),
              error: result.message,
            })
            : renderCheckinCodePage({ sessionToken, code, error: result.message });
          return giftShopHtmlResponse(page, result.status || 400);
        }
        return giftShopHtmlResponse(renderCheckinDonePage({ family: result.family }));
      }

      const result = await deskLookup(service, { sessionToken, code });
      if (!result.ok) {
        return giftShopHtmlResponse(
          renderCheckinCodePage({ sessionToken, code, error: result.message }),
          result.status || 400,
        );
      }
      return giftShopHtmlResponse(
        renderCheckinNamePage({ sessionToken, code: result.code, family: result.family }),
      );
    }

    if (!queryToken) {
      return giftShopHtmlResponse(
        renderCheckinUnavailablePage({
          message: 'This page only works from the QR code at the Kids Gift Shop check-in desk. Please scan it with your phone camera, or ask a volunteer for help.',
        }),
        400,
      );
    }

    return giftShopHtmlResponse(renderCheckinCodePage({ sessionToken: queryToken }));
  } catch (error) {
    console.log('giftShopCheckinForm failed:', error.message);
    return giftShopHtmlResponse(
      renderCheckinUnavailablePage({ message: 'Something went wrong. Please ask a volunteer for help.' }),
      500,
    );
  }
}