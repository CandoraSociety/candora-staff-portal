// The volunteer ("elf") form behind the QR code printed on a child's name tag.
// It is served straight from a backend function as its own standalone page, so
// it carries no portal code, no session and no client SDK — a volunteer's phone
// only ever receives this one page for this one child, and only after the desk
// PIN is entered.

import { giftShopHtmlResponse } from './giftShopInvitePage.ts';
import { slotLabel, GIFT_SHOP_PROGRAM_NAME } from './giftShopInvites.ts';

// The desk PIN every volunteer types before they can see a child's card.
export const ELF_PIN = '5011';

const LOGO_URL = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c7fbd36e2_logo.png';

const RECIPIENT_LABELS = {
  mother: 'Mother',
  father: 'Father',
  grandmother: 'Grandmother',
  grandfather: 'Grandfather',
  aunt: 'Aunt',
  uncle: 'Uncle',
  caregiver: 'Caregiver',
  other: 'Other',
};

const GENDER_LABELS = { female: 'F', male: 'M' };
const AGE_LABELS = { '0-5': 'Ages 0–5', '6-16': 'Ages 6–16' };

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const STYLES = `
  :root{--navy:#0a0f29;--gold:#fccf03;--ink:#080c21;--muted:#626784;--line:#dadce7;--bg:#f9fafb;--card:#fff}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55}
  .band{background:var(--gold);color:var(--navy)}
  .wrap{max-width:560px;margin:0 auto;padding:0 16px}
  .band .wrap{display:flex;align-items:center;gap:12px;padding-top:14px;padding-bottom:14px}
  .band img{height:34px;width:auto}
  .band h1{margin:0;font-size:16px;letter-spacing:.02em}
  .band p{margin:0;font-size:11px;text-transform:uppercase;letter-spacing:.16em;font-weight:700;opacity:.75}
  main{padding:18px 0 44px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin-bottom:14px}
  h2{margin:0 0 6px;font-size:22px;line-height:1.25}
  .lede{margin:0 0 16px;color:var(--muted);font-size:15px}
  .eyebrow{margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.18em;color:var(--muted)}
  .error{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:10px;padding:12px 14px;font-size:14px;margin-bottom:14px}
  .notice{background:#fffbeb;border:1px solid #f5e3a3;border-radius:10px;padding:13px 15px;font-size:14px;margin-top:14px}
  .notice strong{display:block;margin-bottom:3px}
  label{display:block;font-size:13px;font-weight:600;margin-bottom:14px}
  input[type=text],input[type=password]{width:100%;margin-top:6px;padding:13px 12px;font-size:17px;font-family:inherit;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:9px}
  input:focus{outline:2px solid var(--gold);outline-offset:1px;border-color:var(--gold)}
  .btn{display:block;width:100%;border:0;border-radius:10px;padding:16px 24px;font-size:17px;font-weight:800;background:var(--navy);color:var(--gold);cursor:pointer}
  .child-head{display:flex;align-items:center;gap:14px;margin-bottom:16px}
  .order{font-size:44px;font-weight:900;line-height:1;color:var(--navy)}
  .child-name{font-size:26px;font-weight:800;line-height:1.15;margin:0}
  .child-sub{margin:2px 0 0;font-size:13px;color:var(--muted)}
  .facts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
  .fact{background:#f4f6fb;border:1px solid var(--line);border-radius:10px;padding:10px 12px}
  .fact span{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:var(--muted);margin-bottom:2px}
  .fact strong{font-size:15px}
  .gift{border:1px solid var(--line);border-radius:10px;padding:13px 14px 12px;margin-bottom:12px;background:#fbfcfe}
  .gift .who{margin:0 0 8px;font-size:14px;font-weight:700}
  .gift .who small{display:block;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
  .hint{font-weight:400;color:var(--muted)}
  .picked{margin:0;font-size:17px;font-weight:700;background:#fff;border:1px dashed var(--line);border-radius:9px;padding:11px 12px}
  .gift-btns{display:flex;gap:18px;margin-top:10px}
  .link-btn{background:none;border:0;padding:0;font:inherit;font-size:13px;font-weight:800;color:var(--navy);text-decoration:underline;cursor:pointer}
  .link-btn.danger{color:#b91c1c}
  .sib{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#f4f6fb;border:1px solid var(--line);border-radius:10px;padding:6px 8px;margin:0 0 14px}
  .sib-btn{width:44px;height:44px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;padding:0;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--navy);font-size:22px;font-weight:800;line-height:1;cursor:pointer}
  .sib-off{opacity:.3;cursor:default}
  .sib-count{flex:1;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
  .contact{border-top:1px solid var(--line);margin-top:4px;padding-top:14px;margin-bottom:16px}
  .contact-name{margin:0 0 8px;font-size:19px;font-weight:800;line-height:1.25}
  .contact-link{display:inline-block;margin:0 14px 6px 0;font-size:15px;font-weight:700;color:var(--navy);text-decoration:none;border-bottom:2px solid var(--gold);padding-bottom:1px}
  .contact-none{margin:0;font-size:14px;color:var(--muted)}
  .saved{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;border-radius:10px;padding:12px 14px;font-size:14px;font-weight:700;margin-bottom:14px}
  .btn-secondary{background:#fff;color:var(--navy);border:2px solid var(--navy);margin-top:4px}
  .elf{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px;color:var(--muted);margin-top:6px}
  .done{text-align:center;padding:30px 18px}
  .done .tick{width:58px;height:58px;border-radius:50%;background:#ecfdf5;color:#047857;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:28px}
  footer{padding:0 0 34px;text-align:center;color:var(--muted);font-size:12px}
`;

function shell({ title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body>
  <header class="band">
    <div class="wrap">
      <img src="${LOGO_URL}" alt="Candora" />
      <div>
        <h1>Kids Gift Shop</h1>
        <p>Elf helper</p>
      </div>
    </div>
  </header>
  <main class="wrap">
    ${body}
  </main>
  <footer>Winter Wonderland · Kids Gift Shop</footer>
</body>
</html>`;
}

// One registration, found by the code printed on the tag. Nothing else is read.
export async function findRegistrationByElfToken(base44, token) {
  const clean = String(token || '').trim();
  if (!clean) return null;
  const rows = await base44.entities.ProgramRegistration.filter({
    program_name: GIFT_SHOP_PROGRAM_NAME,
    elf_token: clean,
  });
  return (rows || []).find(r => r.elf_token === clean) || null;
}

// Siblings are the children of one guardian booked into the same shopping slot,
// which is how the registration desk groups a family.
const familyKey = (reg) => [
  String(reg.parent_guardian_name || reg.participant_name || '').trim().toLowerCase(),
  String(reg.parent_guardian_phone || reg.participant_phone || '').trim(),
  reg.time_slot || '',
].join('|');

// The other children of the same family who are still shopping, in the order they
// were signed in, so a volunteer can step between siblings from one tag.
export async function findFamilyChildren(base44, reg) {
  const rows = await base44.entities.ProgramRegistration.filter({
    program_name: GIFT_SHOP_PROGRAM_NAME,
  });
  const key = familyKey(reg);
  return (rows || [])
    .filter(r => r.elf_token && !r.completed && familyKey(r) === key)
    .sort((a, b) => (a.check_in_sequence || 0) - (b.check_in_sequence || 0)
      || String(a.child_name || '').localeCompare(String(b.child_name || '')));
}

// The gifts the child is shopping for, one row each, with whatever an elf has
// already typed in.
export function elfGiftRows(reg) {
  const count = Number(reg?.gift_count) === 2 ? 2 : 1;
  const row = (index, recipient, gender, value) => ({
    index,
    who: RECIPIENT_LABELS[recipient] || 'Someone special',
    gender: GENDER_LABELS[gender] || '',
    value: value || '',
  });
  const rows = [row(1, reg?.gift_1_recipient, reg?.gift_1_gender, reg?.gift_1_selection)];
  if (count === 2) rows.push(row(2, reg?.gift_2_recipient, reg?.gift_2_gender, reg?.gift_2_selection));
  return rows;
}

const childCard = (reg) => `
  <div class="child-head">
    <div class="order">${escapeHtml(reg.check_in_sequence || '–')}</div>
    <div>
      <p class="child-name">${escapeHtml(reg.child_name || reg.participant_name || 'Child')}</p>
    </div>
  </div>
  <div class="facts">
    <div class="fact"><span>Age category</span><strong>${escapeHtml(AGE_LABELS[reg.child_age_band] || 'Not recorded')}</strong></div>
    <div class="fact"><span>Time slot</span><strong>${escapeHtml(slotLabel(reg.time_slot) || 'Not recorded')}</strong></div>
  </div>
`;

// Who to hand the child back to, with a tap-to-call number and email.
const guardianCard = (reg) => {
  const name = String(reg.parent_guardian_name || '').trim();
  const phone = String(reg.parent_guardian_phone || reg.participant_phone || '').trim();
  const email = String(reg.parent_guardian_email || reg.participant_email || '').trim();
  const links = [
    phone ? `<a class="contact-link" href="tel:${escapeHtml(phone.replace(/[^0-9+]/g, ''))}">Call ${escapeHtml(phone)}</a>` : '',
    email ? `<a class="contact-link" href="mailto:${escapeHtml(email)}">Email ${escapeHtml(email)}</a>` : '',
  ].filter(Boolean).join('');

  return `
  <div class="contact">
    <p class="eyebrow">Parent / guardian</p>
    <p class="contact-name">${escapeHtml(name || 'Not recorded')}</p>
    ${links || '<p class="contact-none">No phone or email recorded.</p>'}
  </div>
`;
};

export function renderElfPinPage({ token, elfName = '', error = '' }) {
  return shell({
    title: 'Elf sign-in · Kids Gift Shop',
    body: `
      <div class="card">
        <h2>Elf sign-in</h2>
        <p class="lede">Enter your name and the desk PIN to open this child's card.</p>
        ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
        <form method="post">
          <input type="hidden" name="token" value="${escapeHtml(token)}" />
          <input type="hidden" name="action" value="view" />
          <label>Your name
            <input type="text" name="elf_name" value="${escapeHtml(elfName)}" autocomplete="name" required />
          </label>
          <label>Desk PIN
            <input type="password" name="pin" inputmode="numeric" autocomplete="off" required />
          </label>
          <button type="submit" class="btn">Continue</button>
        </form>
        <div class="notice">
          <strong>Ask a staff member</strong>
          If you do not have the desk PIN, please ask at the registration desk.
        </div>
      </div>
    `,
  });
}

// One gift: the input while it is being written, then the saved wording locked
// in place with Change and Remove, so a phone carried in a pocket cannot type
// over what a volunteer already recorded.
function elfGiftBlock(gift, editGift) {
  const head = `
      <p class="who">
        <small>Gift ${gift.index}</small>
        For ${escapeHtml(gift.who)}${gift.gender ? ` (${escapeHtml(gift.gender)})` : ''}
      </p>`;

  if (gift.value && editGift !== gift.index) {
    return `
    <div class="gift">
      ${head}
      <p class="picked">${escapeHtml(gift.value)}</p>
      <div class="gift-btns">
        <button type="submit" class="link-btn" name="change" value="${gift.index}">Change</button>
        <button type="submit" class="link-btn danger" name="remove" value="${gift.index}">Remove</button>
      </div>
    </div>`;
  }

  return `
    <div class="gift">
      ${head}
      <label>What did they pick? <span class="hint">(optional)</span>
        <input type="text" name="gift_${gift.index}" value="${escapeHtml(gift.value)}" autocomplete="off" />
      </label>
      ${gift.value ? `<button type="submit" class="link-btn danger" name="remove" value="${gift.index}">Remove this entry</button>` : ''}
    </div>`;
}

// Arrows to step between the children of one family, on their own small form so
// switching never touches the gift notes being written.
function siblingNav(siblings, token) {
  if (!siblings || siblings.length < 2) return '';
  const index = siblings.findIndex(sibling => sibling.token === token);
  if (index < 0) return '';

  const arrow = (sibling, label, glyph) => (sibling
    ? `<button type="submit" class="sib-btn" name="go" value="${escapeHtml(sibling.token)}" aria-label="${label}">${glyph}</button>`
    : `<span class="sib-btn sib-off">${glyph}</span>`);

  return `
  <div class="sib">
    ${arrow(siblings[index - 1], 'Previous child', '‹')}
    <span class="sib-count">Sibling ${index + 1} of ${siblings.length}</span>
    ${arrow(siblings[index + 1], 'Next child', '›')}
  </div>`;
}

export function renderElfChildPage({ reg, token, elfName, pin, error = '', saved = '', editGift = 0, siblings = [] }) {
  const gifts = elfGiftRows(reg).map(gift => elfGiftBlock(gift, editGift)).join('');
  const nav = siblingNav(siblings, token);

  return shell({
    title: `${reg.child_name || 'Child'} · Kids Gift Shop`,
    body: `
      <div class="card">
        ${childCard(reg)}
        ${nav ? `
        <form method="post">
          <input type="hidden" name="token" value="${escapeHtml(token)}" />
          <input type="hidden" name="elf_name" value="${escapeHtml(elfName)}" />
          <input type="hidden" name="pin" value="${escapeHtml(pin)}" />
          ${nav}
        </form>` : ''}
        ${guardianCard(reg)}
        ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
        ${saved ? `<div class="saved">${escapeHtml(saved)}</div>` : ''}
        <p class="eyebrow">Gifts</p>
        <p class="lede" style="margin-bottom:12px">Write down what the child picked, then save it so it is kept.</p>
        <form method="post">
          <input type="hidden" name="token" value="${escapeHtml(token)}" />
          <input type="hidden" name="elf_name" value="${escapeHtml(elfName)}" />
          <input type="hidden" name="pin" value="${escapeHtml(pin)}" />
          ${gifts}
          <button type="submit" class="btn btn-secondary" name="action" value="save">Save gift details</button>
          <button type="submit" class="btn" name="action" value="complete" style="margin-top:12px">Completed and returned to parent/guardian</button>
        </form>
        <div class="elf">
          <span>Signed in as ${escapeHtml(elfName)}</span>
        </div>
      </div>
    `,
  });
}

export function renderElfDonePage({ reg, elfName }) {
  return shell({
    title: 'All done · Kids Gift Shop',
    body: `
      <div class="card done">
        <div class="tick">✓</div>
        <h2>All done — thank you, ${escapeHtml(elfName)}</h2>
        <p class="lede">
          ${escapeHtml(reg?.child_name || reg?.participant_name || 'This child')} has been recorded as
          completed and returned to their parent or guardian.
        </p>
        <div class="notice" style="text-align:left">
          <strong>What happens next</strong>
          Hand the child back to their parent or guardian. The registration desk can see that this
          child is finished.
        </div>
      </div>
    `,
  });
}

export function renderElfClosedPage({ state, reg }) {
  const copy = state === 'completed'
    ? {
      heading: 'This child is already finished',
      text: `${reg?.child_name || 'This child'} was returned to their parent or guardian${
        reg?.completed_by_elf ? ` by ${reg.completed_by_elf}` : ''
      }. If something is not right, please speak to the registration desk.`,
    }
    : {
      heading: 'This tag was not recognised',
      text: 'Scan the QR code printed on the child\'s name tag again, or ask at the registration desk.',
    };

  return shell({
    title: `${copy.heading} · Kids Gift Shop`,
    body: `
      <div class="card">
        <h2>${escapeHtml(copy.heading)}</h2>
        <p class="lede">${escapeHtml(copy.text)}</p>
      </div>
    `,
  });
}

// Keeps what the child picked without closing them out, so the wording survives
// while the volunteer is still walking around with the phone. A gift that was not
// on the form (still locked) is left exactly as it is.
export async function saveElfGifts(base44, reg, { gift1, gift2 }) {
  const patch = {};
  if (gift1 !== undefined) patch.gift_1_selection = gift1;
  if (gift2 !== undefined) patch.gift_2_selection = gift2;
  if (!Object.keys(patch).length) return reg;
  return await base44.entities.ProgramRegistration.update(reg.id, patch);
}

export async function clearElfGift(base44, reg, index) {
  const patch = Number(index) === 2 ? { gift_2_selection: '' } : { gift_1_selection: '' };
  return await base44.entities.ProgramRegistration.update(reg.id, patch);
}

// Closes the child out: records who helped them, what they picked, and that they
// went back to their parent or guardian.
export async function completeElfVisit(base44, reg, { elfName, gift1, gift2 }) {
  const patch = {
    completed: true,
    completed_at: new Date().toISOString(),
    completed_by_elf: elfName,
  };
  if (gift1) patch.gift_1_selection = gift1;
  if (gift2) patch.gift_2_selection = gift2;
  return await base44.entities.ProgramRegistration.update(reg.id, patch);
}

export { giftShopHtmlResponse };