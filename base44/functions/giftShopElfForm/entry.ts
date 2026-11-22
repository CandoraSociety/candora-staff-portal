import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  ELF_PIN,
  clearElfGift,
  completeElfVisit,
  findFamilyChildren,
  findRegistrationByElfToken,
  saveElfGifts,
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
      const changeGift = Number(form.get('change') || 0) || 0;
      const removeGift = Number(form.get('remove') || 0) || 0;

      const reg = await findRegistrationByElfToken(base44.asServiceRole, token);
      if (!reg) return giftShopHtmlResponse(renderElfClosedPage({ state: 'invalid' }), 404);

      if (!elfName) {
        return giftShopHtmlResponse(renderElfPinPage({ token, error: 'Enter your name to continue.' }), 400);
      }
      if (pin !== ELF_PIN) {
        return giftShopHtmlResponse(
          renderElfPinPage({ token, elfName, error: 'That desk PIN is not right. Please check it and try again.' }),
          403,
        );
      }

      // Brothers and sisters who are still shopping, so a family can be finished
      // from whichever of its tags is in hand.
      const siblingsFor = async (source) => {
        const family = await findFamilyChildren(base44.asServiceRole, source);
        return family
          .filter(r => r.elf_token)
          .map(r => ({ token: r.elf_token, name: r.child_name || r.participant_name || 'Child' }));
      };

      const goToken = String(form.get('go') || '').trim();
      if (goToken && goToken !== token) {
        const target = await findRegistrationByElfToken(base44.asServiceRole, goToken);
        if (target?.completed) {
          return giftShopHtmlResponse(renderElfClosedPage({
            state: 'completed', reg: target, token: goToken, elfName, pin, siblings: await siblingsFor(target),
          }));
        }
        if (target) {
          return giftShopHtmlResponse(renderElfChildPage({
            reg: target, token: goToken, elfName, pin, siblings: await siblingsFor(target),
          }));
        }
      }

      // A child already returned still offers the rest of the family, so a
      // finished tag can be used to close out a brother or sister.
      if (reg.completed) {
        return giftShopHtmlResponse(renderElfClosedPage({
          state: 'completed', reg, token, elfName, pin, siblings: await siblingsFor(reg),
        }));
      }

      // A gift that is still locked has no input on the page, so only the gifts
      // actually being written are saved.
      const gifts = {
        gift1: form.has('gift_1') ? String(form.get('gift_1') || '').trim() : undefined,
        gift2: form.has('gift_2') ? String(form.get('gift_2') || '').trim() : undefined,
      };

      // The child's card always carries the arrows to their siblings, so a family
      // is handled from whichever tag was scanned first.
      const renderChild = async (targetReg, targetToken, extra = {}) => giftShopHtmlResponse(
        renderElfChildPage({
          reg: targetReg, token: targetToken, elfName, pin, siblings: await siblingsFor(targetReg), ...extra,
        }),
      );

      if (removeGift) {
        const updated = await clearElfGift(base44.asServiceRole, reg, removeGift);
        return await renderChild(updated || reg, token, { saved: 'That gift detail has been removed.' });
      }

      if (changeGift) {
        return await renderChild(reg, token, { editGift: changeGift });
      }

      if (action === 'save') {
        const updated = await saveElfGifts(base44.asServiceRole, reg, gifts);
        return await renderChild(updated || reg, token, { saved: 'Gift details saved. You can change them at any time.' });
      }

      if (action === 'complete') {
        const updated = await completeElfVisit(base44.asServiceRole, reg, { elfName, ...gifts });
        // Any brother or sister still shopping is offered straight away, so a
        // family is never left half closed out.
        const siblings = await siblingsFor(updated || reg);
        return giftShopHtmlResponse(renderElfDonePage({ reg: updated || reg, elfName, token, pin, siblings }));
      }

      return await renderChild(reg, token);
    }

    const reg = await findRegistrationByElfToken(base44.asServiceRole, queryToken);
    if (!reg) return giftShopHtmlResponse(renderElfClosedPage({ state: 'invalid' }), 404);
    if (reg.completed) {
      // Re-scanning a finished tag still shows the family's other children, so a
      // volunteer is never stuck after closing one child out.
      const family = await findFamilyChildren(base44.asServiceRole, reg);
      const siblings = family
        .filter(r => r.elf_token)
        .map(r => ({ token: r.elf_token, name: r.child_name || r.participant_name || 'Child' }));
      return giftShopHtmlResponse(renderElfClosedPage({ state: 'completed', reg, siblings }));
    }
    return giftShopHtmlResponse(renderElfPinPage({ token: queryToken }));
  } catch (error) {
    console.log('giftShopElfForm failed:', error.message);
    return giftShopHtmlResponse(renderElfClosedPage({ state: 'invalid' }), 500);
  }
}