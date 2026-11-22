// The Kids Gift Shop pre-registration form as a standalone page. It is served
// straight from a backend function, so it carries no portal code, no session
// and no client SDK — the family's browser only ever receives this one page,
// built from their own invitation. Every check still runs in
// redeemGiftShopInvite, which is the same code the rest of the app uses.

import {
  buildPublicInvite,
  redeemGiftShopInvite,
  slotLabel,
  GIFT_SHOP_AGE_BANDS,
  GIFT_SHOP_GENDERS,
  GIFT_SHOP_RECIPIENTS,
} from './giftShopInvites.ts';

export const GIFT_SHOP_CONTACT_EMAIL = 'info@candorasociety.com';

// Kept in step with src/lib/dataPrivacy.js — every Candora form says the same
// thing about where a family's details are stored.
const DATA_STORAGE_ACK =
  'I understand that the information I submit is stored by Base44, the third-party platform that hosts Candora 360. ' +
  'That data is kept in the United States, is encrypted in transit and at rest, and can be accessed by authorized ' +
  'Candora staff and, when needed for support or security, by Base44. It is used only to run the Kids Gift Shop, and ' +
  `I can ask to see, correct or delete it by emailing ${GIFT_SHOP_CONTACT_EMAIL}.`;
const LOGO_URL = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c7fbd36e2_logo.png';

const AGE_LABELS = { '0-5': '0–5 years', '6-16': '6–16 years' };
const GENDER_LABELS = { female: 'Female', male: 'Male' };
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

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const options = (list, selected, labels, placeholder) => [
  `<option value="">${escapeHtml(placeholder)}</option>`,
  ...list.map(value => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(labels[value] || value)}</option>`),
].join('');

const STYLES = `
  :root{--navy:#0a0f29;--gold:#fccf03;--ink:#080c21;--muted:#626784;--line:#dadce7;--bg:#f9fafb;--card:#fff}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55}
  .band{background:var(--gold);color:var(--navy)}
  .wrap{max-width:640px;margin:0 auto;padding:0 18px}
  .band .wrap{display:flex;align-items:center;gap:12px;padding-top:16px;padding-bottom:16px}
  .band img{height:38px;width:auto}
  .band h1{margin:0;font-size:17px;letter-spacing:.02em}
  .band p{margin:0;font-size:12px;text-transform:uppercase;letter-spacing:.16em;font-weight:700;opacity:.75}
  main{padding:26px 0 48px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;margin-bottom:16px}
  h2{margin:0 0 6px;font-size:22px;line-height:1.25}
  .lede{margin:0 0 18px;color:var(--muted);font-size:15px}
  .eyebrow{margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.18em;color:var(--muted)}
  .notice{background:#fffbeb;border:1px solid #f5e3a3;border-radius:10px;padding:14px 16px;font-size:14px;margin-bottom:16px}
  .notice strong{display:block;margin-bottom:4px}
  .error{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:10px;padding:12px 14px;font-size:14px;margin-bottom:16px}
  label{display:block;font-size:13px;font-weight:600;margin-bottom:14px}
  input[type=text],input[type=email],input[type=tel],select{width:100%;margin-top:6px;padding:11px 12px;font-size:16px;font-family:inherit;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:8px}
  input:focus,select:focus{outline:2px solid var(--gold);outline-offset:1px;border-color:var(--gold)}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .gifts{margin-bottom:14px}
  .gifts>span{display:block;font-size:13px;font-weight:600;margin-bottom:6px}
  .seg{display:flex;gap:8px}
  .seg label{flex:1;margin:0;position:relative;display:block;text-align:center;border:1px solid var(--line);border-radius:8px;padding:10px 8px;background:#fff;cursor:pointer;font-size:14px;font-weight:600}
  .seg input{position:absolute;opacity:0;pointer-events:none}
  .seg label:has(input:checked){border-color:var(--navy);background:#fffbe6;box-shadow:inset 0 0 0 1px var(--navy)}
  .gift-two{display:none}
  .row:has(input[name$="_gifts"][value="2"]:checked) + .gift-two{display:block}
  .child{border:1px solid var(--line);border-radius:10px;padding:14px;margin-bottom:12px}
  .child-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
  .child-head span{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
  details.child{padding:0}
  details.child>summary{list-style:none;cursor:pointer;padding:13px 14px;font-size:14px;font-weight:600;color:var(--navy);display:flex;align-items:center;gap:9px}
  details.child>summary::-webkit-details-marker{display:none}
  details.child>summary::before{content:'+';font-size:17px;font-weight:700;color:var(--muted);line-height:1}
  details.child[open]>summary::before{content:'–'}
  details.child[open]>summary{border-bottom:1px solid var(--line);margin-bottom:14px}
  details.child .child-fields{padding:0 14px 14px}
  details.child .child-fields details.child{margin:12px 0 0}
  .slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:8px;margin-top:6px}
  .slot{position:relative;display:block;margin:0;border:1px solid var(--line);border-radius:8px;padding:9px 10px;background:#fff;cursor:pointer;font-weight:500}
  .slot input{position:absolute;opacity:0;pointer-events:none}
  .slot .time{display:block;font-size:13px;font-weight:700}
  .slot .left{display:block;font-size:11px;color:var(--muted)}
  .slot:has(input:checked){border-color:var(--navy);background:#fffbe6;box-shadow:inset 0 0 0 1px var(--navy)}
  .slot.is-full{background:#f1f2f6;color:#9aa0b4;cursor:not-allowed}
  .slot.is-full .time{text-decoration:line-through}
  .actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:4px}
  button{font:inherit}
  .btn{display:inline-block;border:0;border-radius:10px;padding:15px 26px;font-size:16px;font-weight:700;background:var(--navy);color:var(--gold);cursor:pointer}
  .btn:disabled{opacity:.6;cursor:not-allowed}
  .btn-ghost{background:#fff;color:var(--navy);border:1px solid var(--line);font-weight:600;padding:11px 16px;font-size:14px;border-radius:9px;cursor:pointer}
  .submit{width:100%;margin-top:8px}
  .privacy{background:#f4f6fb;border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin:16px 0 4px}
  .privacy label{display:flex;gap:10px;align-items:flex-start;margin:0;font-size:13px;font-weight:400;line-height:1.55;color:var(--muted)}
  .privacy input{margin:2px 0 0;flex:0 0 auto;width:18px;height:18px;accent-color:var(--navy)}
  .done{text-align:center;padding:34px 20px}
  .done .tick{width:58px;height:58px;border-radius:50%;background:#ecfdf5;color:#047857;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px}
  footer{padding:0 0 40px;text-align:center;color:var(--muted);font-size:13px}
  footer a{color:var(--navy)}
  @media (max-width:420px){.row{grid-template-columns:1fr}}
`;

function childFields(index, value) {
  const gifts = String(value?.gift_count || '1') === '2' ? '2' : '1';
  return `
      <label>Child’s name
        <input type="text" name="child_${index}_name" value="${escapeHtml(value?.child_name || '')}" autocomplete="off" />
      </label>
      <div class="row">
        <label>Age
          <select name="child_${index}_age">${options(GIFT_SHOP_AGE_BANDS, value?.age_band || '', AGE_LABELS, 'Select age')}</select>
        </label>
        <div class="gifts">
          <span>How many gifts</span>
          <div class="seg">
            <label><input type="radio" name="child_${index}_gifts" value="1"${gifts === '1' ? ' checked' : ''} /><span>1 gift</span></label>
            <label><input type="radio" name="child_${index}_gifts" value="2"${gifts === '2' ? ' checked' : ''} /><span>2 gifts</span></label>
          </div>
        </div>
      </div>
      <label>Gift one is for a…
        <select name="child_${index}_gift1">${options(GIFT_SHOP_GENDERS, value?.gift_1 || '', GENDER_LABELS, 'Select')}</select>
      </label>
      <label>Who is gift one for?
        <select name="child_${index}_gift1_rec">${options(GIFT_SHOP_RECIPIENTS, value?.gift_1_rec || '', RECIPIENT_LABELS, 'Select who the gift is for')}</select>
      </label>
      <div class="gift-two">
        <label>Gift two is for a…
          <select name="child_${index}_gift2">${options(GIFT_SHOP_GENDERS, value?.gift_2 || '', GENDER_LABELS, 'Select')}</select>
        </label>
        <label>Who is gift two for?
          <select name="child_${index}_gift2_rec">${options(GIFT_SHOP_RECIPIENTS, value?.gift_2_rec || '', RECIPIENT_LABELS, 'Select who the gift is for')}</select>
        </label>
      </div>
  `;
}

// Child one is always on the page. A single "Add a child" toggle sits under it,
// and each one you open carries the next one inside it — so the button can be
// pressed once per extra child, up to the number the invitation covers. It is
// all plain <details>, so it works with no JavaScript at all.
function childToggle(index, maxChildren, values) {
  const value = values?.[index - 1];
  return `
    <details class="child"${value ? ' open' : ''}>
      <summary>Add a child</summary>
      <div class="child-fields">
        <p class="eyebrow" style="margin:0 0 10px">Child ${index}</p>
        ${childFields(index, value)}
        ${index < maxChildren ? childToggle(index + 1, maxChildren, values) : ''}
      </div>
    </details>
  `;
}

function childBlocks(maxChildren, values) {
  return `
    <div class="child"><div class="child-head"><span>Child 1</span></div>${childFields(1, values?.[0])}</div>
    ${maxChildren > 1 ? childToggle(2, maxChildren, values) : ''}
  `;
}

function shell({ title, body, maxChildren = 1 }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body data-max-children="${maxChildren}">
  <header class="band">
    <div class="wrap">
      <img src="${LOGO_URL}" alt="Candora" />
      <div>
        <h1>Kids Gift Shop</h1>
        <p>Winter Wonderland · Pre-registration</p>
      </div>
    </div>
  </header>
  <main class="wrap">
    ${body}
  </main>
  <footer>
    Questions, or trouble with your link? Email
    <a href="mailto:${GIFT_SHOP_CONTACT_EMAIL}">${GIFT_SHOP_CONTACT_EMAIL}</a>
  </footer>
</body>
</html>`;
}

function closedPage(state) {
  const copy = {
    registered: {
      heading: 'This invitation has already been used',
      text: 'Your family is already registered for the Kids Gift Shop. If you need to change a time or add a child, email us and we will help.',
    },
    expired: {
      heading: 'This invitation has closed',
      text: 'The pre-registration window for this link has ended. Email us and we will let you know what is still available.',
    },
    revoked: {
      heading: 'This invitation was cancelled',
      text: 'This link is no longer active. Email us and we will sort out your family’s registration.',
    },
    invalid: {
      heading: 'This link was not recognised',
      text: 'The link may be incomplete. Copy the whole link from your invitation email and try again, or email us and we will send a fresh one.',
    },
  }[state] || {
    heading: 'This link was not recognised',
    text: 'Copy the whole link from your invitation email and try again, or email us and we will send a fresh one.',
  };

  return shell({
    title: `${copy.heading} · Kids Gift Shop`,
    body: `
      <div class="card">
        <h2>${escapeHtml(copy.heading)}</h2>
        <p class="lede">${escapeHtml(copy.text)}</p>
        <a class="btn" href="mailto:${GIFT_SHOP_CONTACT_EMAIL}">Email the office</a>
      </div>
    `,
  });
}

function successPage({ children = [], time_label: timeLabel }) {
  const names = children.length > 1
    ? `${children.slice(0, -1).join(', ')} and ${children[children.length - 1]}`
    : children[0] || 'Your child';
  return shell({
    title: 'You’re registered · Kids Gift Shop',
    body: `
      <div class="card done">
        <div class="tick">✓</div>
        <h2>You’re registered</h2>
        <p class="lede">
          ${escapeHtml(names)} ${children.length > 1 ? 'are' : 'is'} booked for ${escapeHtml(timeLabel || '')} on
          Saturday, December 12th at Riverview Crossing Shopping Centre.
        </p>
        <div class="notice" style="text-align:left;margin:18px 0 0">
          <strong>On the day</strong>
          Come to the Kids Gift Shop registration desk and sign in every child who is participating. There is no name tag
          waiting at the door — each child is signed in at the desk before they shop.
        </div>
        <div class="notice" style="text-align:left;margin:12px 0 0">
          <strong>Please arrive on time</strong>
          If your family does not arrive within your scheduled time slot, we may not be able to accommodate you.
        </div>
      </div>
    `,
  });
}

export function renderInvitePage({ state, invite, slots = [], values = {}, error = '' }) {
  if (state !== 'open') return closedPage(state);

  const maxChildren = Math.min(Math.max(Number(invite?.children_allowed) || 3, 1), 6);
  const blocks = childBlocks(maxChildren, values.children);

  const slotCards = (slots.length ? slots : []).map(slot => `
    <label class="slot" data-remaining="${Number(slot.remaining) || 0}">
      <input type="radio" name="time_slot" value="${escapeHtml(slot.value)}"${values.time_slot === slot.value ? ' checked' : ''} />
      <span class="time">${escapeHtml(slot.label)}</span>
      <span class="left">${slot.remaining <= 0 ? 'Full' : `${slot.remaining} left`}</span>
    </label>
  `).join('');

  return shell({
    title: 'Book a shopping time · Kids Gift Shop',
    maxChildren,
    body: `
      <h2>Book a shopping time</h2>
      <p class="lede">Each child picks out a gift for someone special. Choose a time and we will have everything ready.</p>

      <div class="notice">
        <strong>This link works once</strong>
        It is for ${escapeHtml(invite?.guardian_name || 'your family')} and covers up to ${maxChildren}
        ${maxChildren === 1 ? 'child' : 'children'}. To use it, confirm the email address or phone number the invitation was sent to.
      </div>

      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}

      <form method="post" novalidate>
        <input type="hidden" name="token" value="${escapeHtml(values.token || '')}" />

        <div class="card">
          <label>Parent or guardian’s name
            <input type="text" name="guardian_name" value="${escapeHtml(values.guardian_name || invite?.guardian_name || '')}" autocomplete="name" />
          </label>
          <label>Email or phone this invitation was sent to
            <input type="text" name="contact" value="${escapeHtml(values.contact || '')}" autocomplete="email" placeholder="you@example.com or 780-555-1234" />
          </label>
          <p class="eyebrow" style="margin:0">Either one works, whichever your invitation came to.</p>
        </div>

        <div class="card">
          <p class="eyebrow">Children</p>
          <p class="lede" style="margin-bottom:14px">Add each child coming to shop.</p>
          ${blocks}
        </div>

        <div class="card">
          <p class="eyebrow">Shopping time</p>
          <div class="slots">${slotCards}</div>
        </div>

        <div class="privacy">
          <label>
            <input type="checkbox" name="data_ack" value="yes"${values.data_ack ? ' checked' : ''} required />
            <span>${DATA_STORAGE_ACK}</span>
          </label>
        </div>

        <button type="submit" class="btn submit">Complete registration</button>
      </form>
    `,
  });
}

export function renderSuccessPage(result) {
  return successPage(result);
}

// Turns a submitted form into the payload redeemGiftShopInvite expects, and
// keeps the typed answers so an error can show them again.
export function readInviteForm(form) {
  const children = [];
  const values = [];
  for (let index = 1; index <= 6; index += 1) {
    const name = String(form.get(`child_${index}_name`) || '').trim();
    const age = String(form.get(`child_${index}_age`) || '');
    const giftCount = Number(form.get(`child_${index}_gifts`) || 1);
    const gift1 = String(form.get(`child_${index}_gift1`) || '');
    const gift2 = giftCount === 2 ? String(form.get(`child_${index}_gift2`) || '') : '';
    const gift1Rec = String(form.get(`child_${index}_gift1_rec`) || '');
    const gift2Rec = giftCount === 2 ? String(form.get(`child_${index}_gift2_rec`) || '') : '';
    values.push({
      child_name: name,
      age_band: age,
      gift_count: String(giftCount),
      gift_1: gift1,
      gift_2: gift2,
      gift_1_rec: gift1Rec,
      gift_2_rec: gift2Rec,
    });
    if (!name) continue;
    children.push({
      child_name: name,
      age_band: age,
      gift_count: giftCount,
      gift_1_gender: gift1,
      gift_2_gender: giftCount === 2 ? gift2 : null,
      gift_1_recipient: gift1Rec,
      gift_2_recipient: giftCount === 2 ? gift2Rec : null,
    });
  }

  return {
    payload: {
      guardian_name: String(form.get('guardian_name') || ''),
      contact: String(form.get('contact') || ''),
      time_slot: String(form.get('time_slot') || ''),
      children,
    },
    values: {
      token: String(form.get('token') || ''),
      guardian_name: String(form.get('guardian_name') || ''),
      contact: String(form.get('contact') || ''),
      time_slot: String(form.get('time_slot') || ''),
      data_ack: form.get('data_ack') === 'yes',
      children: values,
    },
  };
}

export const giftShopHtmlResponse = (html, status = 200) => new Response(html, {
  status,
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
  },
});

export { buildPublicInvite, redeemGiftShopInvite, slotLabel };