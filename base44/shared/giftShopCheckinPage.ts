// The family's side of Kids Gift Shop check-in, as a standalone page served
// straight from a backend function. It carries no portal code, no session and
// no client SDK — the phone that scanned the desk QR code only ever receives
// this one page, and it can never reach the app itself.

const LOGO_URL = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c7fbd36e2_logo.png';

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
  .wrap{max-width:520px;margin:0 auto;padding:0 16px}
  .band .wrap{display:flex;align-items:center;gap:12px;padding-top:14px;padding-bottom:14px}
  .band img{height:34px;width:auto}
  .band h1{margin:0;font-size:16px;letter-spacing:.02em}
  .band p{margin:0;font-size:11px;text-transform:uppercase;letter-spacing:.16em;font-weight:700;opacity:.75}
  main{padding:18px 0 44px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px;margin-bottom:14px}
  h2{margin:0 0 6px;font-size:23px;line-height:1.25}
  .lede{margin:0 0 16px;color:var(--muted);font-size:15px}
  .eyebrow{margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.18em;color:var(--muted)}
  .error{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:10px;padding:12px 14px;font-size:14px;margin-bottom:14px}
  label{display:block;font-size:13px;font-weight:600;margin-bottom:14px}
  input[type=text],input[type=tel]{width:100%;margin-top:6px;padding:13px 12px;font-size:17px;font-family:inherit;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:9px}
  input#code{margin-top:10px;padding:14px 10px;font-size:32px;font-weight:800;letter-spacing:.34em;text-align:center}
  input:focus{outline:2px solid var(--gold);outline-offset:1px;border-color:var(--gold)}
  .btn{display:block;width:100%;border:0;border-radius:10px;padding:16px 24px;font-size:17px;font-weight:800;background:var(--navy);color:var(--gold);cursor:pointer}
  .facts{background:#f4f6fb;border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:16px}
  .facts .slot{margin:0;font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}
  .facts .guardian{margin:2px 0 10px;font-size:19px;font-weight:800;line-height:1.25}
  .child{border-top:1px solid var(--line);padding:9px 0 0;margin-top:9px;font-size:15px}
  .child:first-of-type{border-top:0;margin-top:0;padding-top:0}
  .child strong{display:block;font-size:16px}
  .child span{font-size:13px;color:var(--muted)}
  .tick{width:56px;height:56px;margin:0 auto 12px;border-radius:999px;background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:900}
  .center{text-align:center}
  .foot{margin-top:16px;text-align:center;font-size:12px;color:var(--muted)}
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
      <img src="${LOGO_URL}" alt="Candora 360" />
      <div>
        <p>Winter Wonderland</p>
        <h1>Kids Gift Shop check-in</h1>
      </div>
    </div>
  </header>
  <main>
    <div class="wrap">
      ${body}
    </div>
  </main>
</body>
</html>`;
}

export function renderCheckinCodePage({ sessionToken = '', code = '', error = '' }) {
  return shell({
    title: 'Check in · Kids Gift Shop',
    body: `
      <div class="card">
        <h2>Enter your check-in code</h2>
        <p class="lede">Type the six-digit code from your confirmation email.</p>
        ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
        <form method="post" action="">
          <input type="hidden" name="t" value="${escapeHtml(sessionToken)}" />
          <input type="hidden" name="action" value="lookup" />
          <label for="code">Six-digit code
            <input id="code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="123456" value="${escapeHtml(code)}" required />
          </label>
          <button class="btn" type="submit">Continue</button>
        </form>
      </div>
      <p class="foot">Keep your code to yourself — it opens your family’s registration.</p>
    `,
  });
}

export function renderCheckinNamePage({ sessionToken = '', code = '', family = {}, name = '', phone = '', error = '' }) {
  const children = (family.children || []).map(child => `
    <div class="child">
      <strong>${escapeHtml(child.name)}</strong>
      <span>${[child.age, child.gifts].filter(Boolean).map(escapeHtml).join(' · ')}</span>
    </div>`).join('');

  return shell({
    title: 'Your registration · Kids Gift Shop',
    body: `
      <div class="card">
        <p class="eyebrow">Your registration</p>
        <div class="facts">
          ${family.time_label ? `<p class="slot">Shopping time ${escapeHtml(family.time_label)}</p>` : ''}
          <p class="guardian">${escapeHtml(family.guardian_name || 'Your family')}</p>
          ${children}
        </div>
        ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
        <form method="post" action="">
          <input type="hidden" name="t" value="${escapeHtml(sessionToken)}" />
          <input type="hidden" name="code" value="${escapeHtml(code)}" />
          <input type="hidden" name="action" value="submit" />
          <label for="guardian_name">Your name — this prints on your name tag
            <input id="guardian_name" name="guardian_name" type="text" autocomplete="name" value="${escapeHtml(name || family.guardian_name || '')}" required />
          </label>
          <label for="guardian_phone">Your phone number — so we can reach you while your child shops
            <input id="guardian_phone" name="guardian_phone" type="tel" inputmode="tel" autocomplete="tel" value="${escapeHtml(phone || family.guardian_phone || '')}" required />
          </label>
          <button class="btn" type="submit">Submit and print my name tag</button>
        </form>
      </div>
    `,
  });
}

export function renderCheckinDonePage({ family = {} } = {}) {
  const names = (family.children || []).map(child => child.name).filter(Boolean);
  return shell({
    title: 'Checked in · Kids Gift Shop',
    body: `
      <div class="card center">
        <div class="tick">✓</div>
        <h2>You’re checked in, ${escapeHtml(family.guardian_name || '')}</h2>
        <p class="lede">Your parent or guardian name tag is printing at the desk. Please wait there and a volunteer will take you to the shop.</p>
        ${names.length ? `<p><strong>Shopping with: ${names.map(escapeHtml).join(', ')}</strong></p>` : ''}
      </div>
    `,
  });
}

export function renderCheckinUnavailablePage({ message = 'This check-in page is not open. Please ask a volunteer for help.' } = {}) {
  return shell({
    title: 'Check-in · Kids Gift Shop',
    body: `
      <div class="card">
        <h2>Check-in is not open</h2>
        <p class="lede">${escapeHtml(message)}</p>
      </div>
    `,
  });
}