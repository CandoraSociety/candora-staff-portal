import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  ELF_PIN,
  completeElfVisit,
  findRegistrationByElfToken,
  renderElfChildPage,
  renderElfClosedPage,
  renderElfDonePage,
  renderElfPinPage,
  giftShopHtmlResponse,
} from '../../shared/giftShopElfPage.ts';

// The form behind the QR code on a child's Kids Gift Shop name tag. A volunteer
// scans the tag, types their name and the desk PIN, sees who the child is buying
// for, can note the gift, and closes the child out when they are returned to
// their parent or guardian. The page is served on its own and reaches nothing
// else in the app: it only ever reads the one registration the code belongs to.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('token') || '';

    if (req.method === 'POST') {
      const form = await req.formData().catch(() => new FormData());
      const token = String(form.get('token') || '') || queryToken;
      const elfName = String(form.get('elf_name') || '').trim();
      const pin = String(form.get('pin') || '').trim();
      const action = String(form.get('action') || 'view');

      const reg = await findRegistrationByElfToken(base44.asServiceRole, token);
      if (!reg) return giftShopHtmlResponse(renderElfClosedPage({ state: 'invalid' }), 404);
      if (reg.completed) return giftShopHtmlResponse(renderElfClosedPage({ state: 'completed', reg }));

      if (!elfName) {
        return giftShopHtmlResponse(renderElfPinPage({ token, error: 'Enter your name to continue.' }), 400);
      }
      if (pin !== ELF_PIN) {
        return giftShopHtmlResponse(
          renderElfPinPage({ token, elfName, error: 'That desk PIN is not right. Please check it and try again.' }),
          403,
        );
      }

      if (action === 'complete') {
        const updated = await completeElfVisit(base44.asServiceRole, reg, {
          elfName,
          gift1: String(form.get('gift_1') || '').trim(),
          gift2: String(form.get('gift_2') || '').trim(),
        });
        return giftShopHtmlResponse(renderElfDonePage({ reg: updated || reg, elfName }));
      }

      return giftShopHtmlResponse(renderElfChildPage({ reg, token, elfName, pin }));
    }

    const reg = await findRegistrationByElfToken(base44.asServiceRole, queryToken);
    if (!reg) return giftShopHtmlResponse(renderElfClosedPage({ state: 'invalid' }), 404);
    if (reg.completed) return giftShopHtmlResponse(renderElfClosedPage({ state: 'completed', reg }));
    return giftShopHtmlResponse(renderElfPinPage({ token: queryToken }));
  } catch (error) {
    console.log('giftShopElfForm failed:', error.message);
    return giftShopHtmlResponse(renderElfClosedPage({ state: 'invalid' }), 500);
  }
}