// Printable / emailable receipt for something completed at the customer tablet —
// a donation or an order. One document, used in the reception viewer and in the
// email, so both always say the same thing.

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const dateLabel = (value) => {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
};

export function kioskReceiptNumber(prompt) {
  if (!prompt) return '';
  const prefix = prompt.kind === 'donation' ? 'D' : 'O';
  const stamp = String(prompt.responded_at || prompt.created_date || '').slice(0, 10).replace(/-/g, '') || '00000000';
  return `${prefix}-${stamp}-${String(prompt.id || '').slice(-4).toUpperCase()}`;
}

export function buildKioskReceiptHtml({ prompt, orgName = 'Candora', logoUrl = '' }) {
  const isDonation = prompt?.kind === 'donation';
  const title = isDonation ? 'Donation Tax Receipt' : 'Purchase Receipt';
  const number = kioskReceiptNumber(prompt);
  const issued = dateLabel(prompt?.responded_at || prompt?.updated_date || prompt?.created_date);
  const customer = prompt?.response_name || (isDonation ? 'Anonymous donor' : 'Walk-in customer');
  const email = prompt?.response_email || '';
  const total = Number(isDonation ? prompt?.response_amount : prompt?.response_total) || 0;
  const items = Array.isArray(prompt?.response_items) ? prompt.response_items : [];
  const campaign = prompt?.campaign_name || '';

  const rows = items
    .map((item) => {
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;">${esc(item.name)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:center;">${quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:right;">${money(price)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:right;">${money(price * quantity)}</td>
      </tr>`;
    })
    .join('');

  const details = isDonation
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
        <tr>
          <td style="width:50%;padding:12px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;">Donated by</td>
          <td style="padding:12px 0;font-size:14px;color:#111827;text-align:right;">
            ${esc(customer)}${email ? `<br /><span style="color:#6b7280;font-size:12px;">${esc(email)}</span>` : ''}
          </td>
        </tr>
        ${campaign ? `<tr>
          <td style="padding:12px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;border-top:1px solid #e5e7eb;">Gift for</td>
          <td style="padding:12px 0;font-size:14px;color:#111827;text-align:right;border-top:1px solid #e5e7eb;">${esc(campaign)}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:12px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;border-top:1px solid #e5e7eb;">Frequency</td>
          <td style="padding:12px 0;font-size:14px;color:#111827;text-align:right;border-top:1px solid #e5e7eb;">${prompt?.response_recurring ? 'Every month' : 'One time'}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;border-top:1px solid #e5e7eb;">Received</td>
          <td style="padding:12px 0;font-size:14px;color:#111827;text-align:right;border-top:1px solid #e5e7eb;">At the front desk</td>
        </tr>
      </table>
      <div style="background:#fdf6dd;border:1px solid #f5be19;border-radius:10px;padding:18px 20px;">
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;">${prompt?.response_recurring ? 'Monthly gift amount' : 'Gift amount'}</div>
        <div style="font-size:34px;font-weight:700;color:#0a0f29;margin-top:4px;">${money(total)}${prompt?.response_recurring ? '<span style="font-size:16px;font-weight:600;color:#4b5563;"> / month</span>' : ''}</div>
        <div style="font-size:13px;color:#4b5563;margin-top:6px;">${prompt?.response_recurring
          ? 'This gift repeats every month. Reception has recorded the schedule, so this one receipt covers your first payment.'
          : 'Official receipt for income tax purposes.'}</div>
      </div>`
    : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 18px;">
        <thead>
          <tr>
            <th style="padding:8px 12px;text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #0f1f6b;">Item</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #0f1f6b;">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #0f1f6b;">Price</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #0f1f6b;">Amount</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="4" style="padding:14px 12px;font-size:14px;color:#6b7280;">No items listed.</td></tr>`}</tbody>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px;">
        <tr>
          <td style="padding:10px 0;font-size:16px;font-weight:700;color:#0a0f29;">Total</td>
          <td style="padding:10px 0;font-size:24px;font-weight:700;color:#0a0f29;text-align:right;">${money(total)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6b7280;">Ordered by</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;text-align:right;">${esc(customer)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6b7280;">Payment</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;text-align:right;">Due at the counter</td>
        </tr>
      </table>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title)} ${esc(number)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;">
    <div style="background:#0f1f6b;padding:22px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            ${logoUrl ? `<img src="${esc(logoUrl)}" alt="${esc(orgName)}" style="height:44px;width:auto;display:block;" />` : `<span style="color:#f5be19;font-size:22px;font-weight:700;">${esc(orgName)}</span>`}
          </td>
          <td style="vertical-align:middle;text-align:right;color:#ffffff;font-size:13px;line-height:1.5;">
            ${esc(orgName)}<br />
            <span style="color:#c7cbe0;">Front desk</span>
          </td>
        </tr>
      </table>
    </div>

    <div style="padding:32px;">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6b7280;">${esc(title)}</div>
      <h1 style="margin:6px 0 18px;font-size:26px;line-height:1.2;color:#0a0f29;">${isDonation ? 'Thank you for your gift' : 'Thank you for your order'}</h1>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
        <tr>
          <td style="padding:0 0 6px;font-size:13px;color:#6b7280;">Receipt number</td>
          <td style="padding:0 0 6px;font-size:13px;color:#111827;text-align:right;font-weight:600;">${esc(number)}</td>
        </tr>
        <tr>
          <td style="padding:0;font-size:13px;color:#6b7280;">Date</td>
          <td style="padding:0;font-size:13px;color:#111827;text-align:right;">${esc(issued)}</td>
        </tr>
      </table>

      ${details}

      <div style="margin-top:26px;padding-top:18px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;line-height:1.6;">
        ${isDonation
          ? `Please keep this receipt for your records. ${esc(orgName)} thanks you for supporting our work in the community.`
          : `Please keep this receipt for your records. ${esc(orgName)} thanks you for your order — reception will have it ready at the counter.`}
      </div>
    </div>
  </div>
</body>
</html>`;
}