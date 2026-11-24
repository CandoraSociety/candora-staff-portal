import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import { secrets } from 'base44:runtime';

// A tax receipt is issued automatically for a gift of this amount or more.
// Smaller gifts still get the thank-you email and text, with a line saying
// receipts are issued from this amount up.
export const RECEIPT_MINIMUM = 20;

const SMS_FROM = '+15877142554';
const FALLBACK = {
  orgName: 'Candora Society',
  address: '#262, 3210 - 118 Avenue, Edmonton, Alberta',
  email: 'info@candorasociety.com',
  phone: '780.474.5011',
  charityNumber: '133583120RR0001',
};

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;

const NAVY = rgb(0.039, 0.059, 0.161);
const GOLD = rgb(0.988, 0.812, 0.012);
const INK = rgb(0.031, 0.047, 0.129);
const MUTED = rgb(0.384, 0.404, 0.518);
const HAIR = rgb(0.855, 0.863, 0.906);
const TINT = rgb(0.976, 0.98, 0.984);

export function formatMoney(value) {
  return `$${(Number(value) || 0).toFixed(2)}`;
}

function longDate(value) {
  if (!value) return '';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
}

function firstNameOf(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'friend';
}

function clip(text, max) {
  const clean = String(text || '');
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function toBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// The receipt is drawn here rather than in the browser, so the file attached to
// the email is the same document whatever device the supporter gave from.
export async function buildReceiptPdf(gift) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);

  const rightText = (text, y, size, font, color) => {
    const width = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: PAGE_W - MARGIN - width, y, size, font, color });
  };

  // Header band with the organization's long-form logo.
  page.drawRectangle({ x: 0, y: PAGE_H - 112, width: PAGE_W, height: 112, color: NAVY });
  page.drawRectangle({ x: 0, y: PAGE_H - 116, width: PAGE_W, height: 4, color: GOLD });

  let drewLogo = false;
  if (gift.logoBytes) {
    try {
      const logo = await pdf.embedPng(gift.logoBytes);
      const width = 200;
      const height = (logo.height / logo.width) * width;
      page.drawImage(logo, {
        x: MARGIN,
        y: PAGE_H - 56 - height / 2,
        width,
        height,
      });
      drewLogo = true;
    } catch (error) {
      console.log('donorThankYou: logo could not be embedded', error.message);
    }
  }
  if (!drewLogo) {
    page.drawText('CANDORA', { x: MARGIN, y: PAGE_H - 62, size: 24, font: bold, color: GOLD });
  }

  rightText('OFFICIAL DONATION RECEIPT', PAGE_H - 52, 12, bold, rgb(1, 1, 1));
  rightText('Tax receipt for a charitable gift', PAGE_H - 70, 9, regular, rgb(0.72, 0.76, 0.85));

  let y = PAGE_H - 156;
  page.drawText('RECEIPT NUMBER', { x: MARGIN, y, size: 7.5, font: bold, color: MUTED });
  rightText('DATE ISSUED', y, 7.5, bold, MUTED);
  y -= 20;
  page.drawText(gift.receiptNumber, { x: MARGIN, y, size: 15, font: bold, color: INK });
  rightText(longDate(gift.receiptDate), y, 11, regular, INK);

  y -= 26;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: HAIR });

  y -= 30;
  page.drawText('RECEIVED WITH THANKS FROM', { x: MARGIN, y, size: 7.5, font: bold, color: MUTED });
  y -= 22;
  page.drawText(clip(gift.donorName || 'Supporter', 52), { x: MARGIN, y, size: 18, font: bold, color: INK });
  if (gift.donorEmail) {
    y -= 16;
    page.drawText(clip(gift.donorEmail, 70), { x: MARGIN, y, size: 10, font: regular, color: MUTED });
  }

  // Gift summary block.
  y -= 34;
  const boxHeight = 132;
  page.drawRectangle({
    x: MARGIN,
    y: y - boxHeight,
    width: PAGE_W - MARGIN * 2,
    height: boxHeight,
    color: TINT,
    borderColor: HAIR,
    borderWidth: 1,
  });

  let rowY = y - 26;
  const row = (label, value) => {
    page.drawText(label, { x: MARGIN + 18, y: rowY, size: 9, font: regular, color: MUTED });
    const width = regular.widthOfTextAtSize(value, 10.5);
    page.drawText(value, {
      x: PAGE_W - MARGIN - 18 - width,
      y: rowY,
      size: 10.5,
      font: regular,
      color: INK,
    });
    rowY -= 22;
  };
  row('Date of gift', longDate(gift.giftDate));
  row('Gift', clip(gift.giftLabel || 'Donation', 52));
  row('Designated to', clip(gift.campaignName || 'General fund', 52));
  row('Payment method', 'Credit card');

  page.drawLine({
    start: { x: MARGIN + 18, y: rowY + 8 },
    end: { x: PAGE_W - MARGIN - 18, y: rowY + 8 },
    thickness: 1,
    color: HAIR,
  });
  rowY -= 6;
  page.drawText('TOTAL CHARITABLE GIFT', { x: MARGIN + 18, y: rowY, size: 8.5, font: bold, color: MUTED });
  const totalWidth = bold.widthOfTextAtSize(formatMoney(gift.amount), 16);
  page.drawText(formatMoney(gift.amount), {
    x: PAGE_W - MARGIN - 18 - totalWidth,
    y: rowY - 4,
    size: 16,
    font: bold,
    color: INK,
  });

  let noteY = y - boxHeight - 34;
  page.drawText(
    'This receipt is for a charitable gift. No goods or services were provided in exchange for it.',
    { x: MARGIN, y: noteY, size: 9.5, font: regular, color: INK },
  );
  noteY -= 16;
  page.drawText(
    `Candora Society is a registered charity. Registration no. ${gift.charityNumber}`,
    { x: MARGIN, y: noteY, size: 9.5, font: regular, color: INK },
  );
  if (gift.monthly) {
    noteY -= 16;
    page.drawText(
      'This receipt covers one monthly gift. A receipt is issued for each monthly gift received.',
      { x: MARGIN, y: noteY, size: 9.5, font: regular, color: MUTED },
    );
  }

  // Footer.
  page.drawLine({ start: { x: MARGIN, y: 132 }, end: { x: PAGE_W - MARGIN, y: 132 }, thickness: 1, color: HAIR });
  page.drawText('CANDORA SOCIETY', { x: MARGIN, y: 112, size: 8, font: bold, color: MUTED });
  page.drawText(clip(gift.address, 70), { x: MARGIN, y: 98, size: 9, font: regular, color: MUTED });
  page.drawText(`${gift.orgEmail}  ·  ${gift.orgPhone}`, { x: MARGIN, y: 84, size: 9, font: regular, color: MUTED });
  rightText('Keep this receipt for your tax records', 98, 8.5, regular, MUTED);

  return pdf.save();
}

// Receipt numbers run in one sequence per calendar year, e.g. 2026-0007.
async function nextReceiptNumber(base44, giftDate) {
  const year = new Date(`${String(giftDate || new Date().toISOString().slice(0, 10))}T12:00:00`).getFullYear();
  let used = 0;
  try {
    used = await base44.asServiceRole.entities.Donation.count({
      receipt_issued: true,
      receipt_number: { $regex: `^${year}-` },
    });
  } catch (error) {
    const { items } = await base44.asServiceRole.entities.Donation.filter(
      { receipt_issued: true, receipt_number: { $regex: `^${year}-` } },
      { limit: 500 },
    );
    used = (items || []).length;
  }
  return `${year}-${String((Number(used) || 0) + 1).padStart(4, '0')}`;
}

async function loadBranding(base44) {
  let settings = null;
  try {
    const page = await base44.asServiceRole.entities.WebsiteSettings.list({ limit: 1 });
    settings = (page.items || [])[0] || null;
  } catch (error) {
    console.log('donorThankYou: site settings unavailable', error.message);
  }

  let logoBytes = null;
  const logoUrl = settings?.logo_url || 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/5625645f1_LongFormLogo.png';
  try {
    const res = await fetch(logoUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) logoBytes = new Uint8Array(await res.arrayBuffer());
  } catch (error) {
    console.log('donorThankYou: logo unavailable', error.message);
  }

  return {
    logoBytes,
    charityNumber: settings?.charity_number || FALLBACK.charityNumber,
    address: settings?.contact_address || FALLBACK.address,
    orgEmail: settings?.contact_email || FALLBACK.email,
    orgPhone: settings?.contact_phone || FALLBACK.phone,
  };
}

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/[^\d+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+')) return /^\+\d{8,15}$/.test(digits) ? digits : null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

async function sendText(rawPhone, body) {
  const to = normalizePhone(rawPhone);
  if (!to) return { ok: false, reason: 'no_phone' };

  try {
    const accountSid = secrets.get('TWILIO_ACCOUNT_SID');
    const authToken = secrets.get('TWILIO_AUTH_TOKEN');
    const form = new URLSearchParams({ To: to, From: SMS_FROM, Body: String(body || '').trim() });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.log('Donor thank-you text failed:', res.status, data?.code, data?.message);
      return { ok: false, reason: data?.message || `Twilio rejected the message (${res.status})` };
    }
    return { ok: true, sid: data.sid };
  } catch (error) {
    console.log('Donor thank-you text error:', error.message);
    return { ok: false, reason: error.message };
  }
}

// Thanks a supporter for a confirmed online gift: an email with their official
// tax receipt attached (when the gift qualifies), a text when a mobile number is
// on file, and the receipt number written back onto the donation so the donor
// portal shows it as receipted. Never throws — the payment is already recorded,
// so a thank-you that could not go out is only logged.
export async function sendDonationThankYou(base44, { donation, donorPhone, appUrl, campaignSlug }) {
  if (!donation?.id) return { sent: false, reason: 'no_donation' };
  if (donation.receipt_issued && donation.receipt_number) {
    return { sent: false, reason: 'already_thanked' };
  }

  const donor = donation.donor_id
    ? await base44.asServiceRole.entities.Donor.get(donation.donor_id).catch(() => null)
    : null;

  const branding = await loadBranding(base44);
  const amount = Number(donation.amount) || 0;
  const email = String(donation.donor_email || donor?.email || '').trim();
  const phone = String(donorPhone || donor?.phone || '').trim();
  const giftDate = donation.donation_date || new Date().toISOString().slice(0, 10);
  const giftLabel = donation.product_name || (donation.donation_type === 'recurring_monthly' ? 'Monthly gift' : 'Donation');
  const monthly = donation.donation_type === 'recurring_monthly';
  // A monthly gift is never receipted as it arrives: the supporter is thanked
  // each month, and one consolidated receipt for the whole year is issued in
  // early January (see sendAnnualDonationReceipts below).
  const receiptWanted = !monthly && amount >= RECEIPT_MINIMUM && donor?.receipt_preference !== 'none';

  let receiptNumber = '';
  let receiptBase64 = null;

  if (receiptWanted) {
    receiptNumber = await nextReceiptNumber(base44, giftDate);
    try {
      const bytes = await buildReceiptPdf({
        receiptNumber,
        receiptDate: giftDate,
        giftDate,
        donorName: donation.donor_name,
        donorEmail: email,
        amount,
        giftLabel,
        campaignName: donation.campaign_name,
        monthly,
        charityNumber: branding.charityNumber,
        address: branding.address,
        orgEmail: branding.orgEmail,
        orgPhone: branding.orgPhone,
        logoBytes: branding.logoBytes,
      });
      receiptBase64 = toBase64(bytes);
    } catch (error) {
      console.log('donorThankYou: receipt PDF failed', error.message);
      receiptBase64 = null;
    }
  }

  const base = String(appUrl || '').replace(/\/+$/, '');
  const campaignUrl = campaignSlug && base
    ? `${base}/campaign/${campaignSlug}`
    : `${base}/donate`;

  let emailed = false;
  if (email) {
    try {
      const result = await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        template_name: 'DonationThankYou',
        variables: {
          first_name: firstNameOf(donation.donor_name),
          amount: formatMoney(amount),
          gift_label: giftLabel,
          campaign_name: donation.campaign_name || 'the general fund',
          gift_date: longDate(giftDate),
          frequency_line: monthly
            ? 'Your monthly gift has been received and will repeat each month until you cancel.'
            : 'Your gift has been received and put to work right away.',
          receipt_heading: monthly ? 'Your tax receipt comes once a year' : 'Your tax receipt',
          receipt_number: receiptBase64 ? receiptNumber : '',
          receipt_line: monthly
            ? 'You do not need to do anything. Monthly gifts are not receipted one at a time: one official tax receipt covering every monthly gift you make this year will be emailed to you in early January, and that is the only receipt you will receive for them.'
            : receiptBase64
              ? `Your official tax receipt (no. ${receiptNumber}) is attached to this email. Keep it for your tax records.`
              : `Receipts are issued for gifts of ${formatMoney(RECEIPT_MINIMUM)} or more. Smaller gifts are recorded on your donor file and a consolidated receipt can be issued at year end.`,
          receipt_sent: receiptBase64 ? 'yes' : 'no',
          charity_number: branding.charityNumber,
          contact_email: branding.orgEmail,
          contact_phone: branding.orgPhone,
          contact_address: branding.address,
          campaign_url: campaignUrl,
          app_url: base,
        },
        attachments: receiptBase64
          ? [{ filename: `Candora-Tax-Receipt-${receiptNumber}.pdf`, content: receiptBase64 }]
          : undefined,
        category: 'transactional',
        from_name: 'Candora Society',
      });
      if (result && result.success === false) {
        console.log('donorThankYou: email refused', result.reason, result.message);
      } else {
        emailed = true;
      }
    } catch (error) {
      console.log('donorThankYou: email failed', error.message);
    }
  }

  let texted = false;
  if (phone && !donor?.do_not_contact) {
    const thanks = `Thank you ${firstNameOf(donation.donor_name)}! Candora received your ${formatMoney(amount)} gift to ${donation.campaign_name || 'the general fund'}.`
      + (monthly
        ? ' One tax receipt covering all your monthly gifts will be emailed to you in early January.'
        : receiptBase64
          ? ` Your tax receipt no. ${receiptNumber} was emailed to you.`
          : ' Your gift is on file with Candora Society.')
      + ' Candora Society, info@candorasociety.com';
    const result = await sendText(phone, thanks);
    texted = !!result.ok;
  }

  // Keep the mobile number the supporter gave at checkout on their donor file.
  if (phone && donor && !donor.phone) {
    await base44.asServiceRole.entities.Donor
      .update(donor.id, { phone })
      .catch((error) => console.log('donorThankYou: donor phone not saved', error.message));
  }

  if (receiptWanted && receiptBase64) {
    await base44.asServiceRole.entities.Donation
      .update(donation.id, {
        receipt_issued: true,
        receipt_number: receiptNumber,
        receipt_date: giftDate,
      })
      .catch((error) => console.log('donorThankYou: receipt fields not saved', error.message));
  }

  return { sent: emailed || texted, emailed, texted, receipt_number: receiptNumber || null };
}

// ---------------------------------------------------------------------------
// One receipt a year for monthly donors
// ---------------------------------------------------------------------------

// The highest receipt number already used in a year, so a batch of annual
// receipts continues the same sequence instead of restarting it.
async function highestReceiptSequence(base44, year) {
  let numbers = [];
  try {
    const { items } = await base44.asServiceRole.entities.Donation.filter(
      { receipt_issued: true, receipt_number: { $regex: `^${year}-` } },
      { limit: 500 },
    );
    numbers = (items || []).map((row) => Number(String(row.receipt_number || '').split('-')[1]) || 0);
  } catch (error) {
    console.log('donorThankYou: receipt sequence unavailable', error.message);
  }
  return numbers.length ? Math.max(...numbers) : 0;
}

// The consolidated receipt lists every monthly gift of the year and one total.
export async function buildAnnualReceiptPdf({
  receiptNumber,
  receiptDate,
  year,
  donorName,
  donorEmail,
  gifts = [],
  total = 0,
  charityNumber,
  address,
  orgEmail,
  orgPhone,
  logoBytes,
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);

  const rightText = (text, y, size, font, color) => {
    const width = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: PAGE_W - MARGIN - width, y, size, font, color });
  };

  page.drawRectangle({ x: 0, y: PAGE_H - 112, width: PAGE_W, height: 112, color: NAVY });
  page.drawRectangle({ x: 0, y: PAGE_H - 116, width: PAGE_W, height: 4, color: GOLD });

  let drewLogo = false;
  if (logoBytes) {
    try {
      const logo = await pdf.embedPng(logoBytes);
      const width = 200;
      const height = (logo.height / logo.width) * width;
      page.drawImage(logo, { x: MARGIN, y: PAGE_H - 56 - height / 2, width, height });
      drewLogo = true;
    } catch (error) {
      console.log('donorThankYou: logo could not be embedded', error.message);
    }
  }
  if (!drewLogo) {
    page.drawText('CANDORA', { x: MARGIN, y: PAGE_H - 62, size: 24, font: bold, color: GOLD });
  }

  rightText('OFFICIAL DONATION RECEIPT', PAGE_H - 52, 12, bold, rgb(1, 1, 1));
  rightText(`Monthly gifts, ${year}`, PAGE_H - 70, 9, regular, rgb(0.72, 0.76, 0.85));

  let y = PAGE_H - 156;
  page.drawText('RECEIPT NUMBER', { x: MARGIN, y, size: 7.5, font: bold, color: MUTED });
  rightText('DATE ISSUED', y, 7.5, bold, MUTED);
  y -= 20;
  page.drawText(receiptNumber, { x: MARGIN, y, size: 15, font: bold, color: INK });
  rightText(longDate(receiptDate), y, 11, regular, INK);

  y -= 26;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: HAIR });

  y -= 30;
  page.drawText('RECEIVED WITH THANKS FROM', { x: MARGIN, y, size: 7.5, font: bold, color: MUTED });
  y -= 22;
  page.drawText(clip(donorName || 'Supporter', 52), { x: MARGIN, y, size: 18, font: bold, color: INK });
  if (donorEmail) {
    y -= 16;
    page.drawText(clip(donorEmail, 70), { x: MARGIN, y, size: 10, font: regular, color: MUTED });
  }

  y -= 30;
  const boxHeight = 96;
  page.drawRectangle({
    x: MARGIN,
    y: y - boxHeight,
    width: PAGE_W - MARGIN * 2,
    height: boxHeight,
    color: TINT,
    borderColor: HAIR,
    borderWidth: 1,
  });

  let rowY = y - 26;
  const row = (label, value, size = 10.5, font = regular) => {
    page.drawText(label, { x: MARGIN + 18, y: rowY, size: 9, font: regular, color: MUTED });
    const width = font.widthOfTextAtSize(value, size);
    page.drawText(value, { x: PAGE_W - MARGIN - 18 - width, y: rowY, size, font, color: INK });
    rowY -= 22;
  };
  row('Period covered', `January 1 – December 31, ${year}`);
  row('Monthly gifts included', `${gifts.length} gift${gifts.length === 1 ? '' : 's'}`);
  row('TOTAL CHARITABLE GIFT', formatMoney(total), 16, bold);

  let listY = y - boxHeight - 26;
  page.drawText('GIFTS INCLUDED', { x: MARGIN, y: listY, size: 7.5, font: bold, color: MUTED });
  listY -= 16;
  const shown = gifts.slice(0, 10);
  for (const gift of shown) {
    page.drawText(longDate(gift.date), { x: MARGIN, y: listY, size: 9.5, font: regular, color: INK });
    page.drawText(clip(gift.label || 'Monthly gift', 34), { x: MARGIN + 150, y: listY, size: 9.5, font: regular, color: MUTED });
    const amountText = formatMoney(gift.amount);
    const width = regular.widthOfTextAtSize(amountText, 9.5);
    page.drawText(amountText, { x: PAGE_W - MARGIN - width, y: listY, size: 9.5, font: regular, color: INK });
    listY -= 13;
  }
  if (gifts.length > shown.length) {
    page.drawText(`…and ${gifts.length - shown.length} more monthly gift(s), all included in the total above.`, {
      x: MARGIN,
      y: listY - 4,
      size: 9,
      font: regular,
      color: MUTED,
    });
  }

  page.drawText(
    'This receipt covers every monthly gift received during the year shown. No goods or services were provided in exchange for these gifts.',
    { x: MARGIN, y: 190, size: 9.5, font: regular, color: INK },
  );
  page.drawText(
    `Candora Society is a registered charity. Registration no. ${charityNumber}`,
    { x: MARGIN, y: 176, size: 9.5, font: regular, color: INK },
  );

  page.drawLine({ start: { x: MARGIN, y: 132 }, end: { x: PAGE_W - MARGIN, y: 132 }, thickness: 1, color: HAIR });
  page.drawText('CANDORA SOCIETY', { x: MARGIN, y: 112, size: 8, font: bold, color: MUTED });
  page.drawText(clip(address, 70), { x: MARGIN, y: 98, size: 9, font: regular, color: MUTED });
  page.drawText(`${orgEmail}  ·  ${orgPhone}`, { x: MARGIN, y: 84, size: 9, font: regular, color: MUTED });
  rightText('Keep this receipt for your tax records', 98, 8.5, regular, MUTED);

  return pdf.save();
}

// Runs once a year (the Annual Donation Tax Receipts workflow, January 2): for
// every supporter who gave monthly during the year, one receipt covering all of
// their monthly gifts is issued and emailed, and those gifts are marked receipted
// with that number. Nothing new is ever sent — only gifts already recorded.
export async function sendAnnualDonationReceipts(base44, { year, appUrl }) {
  const now = new Date();
  const targetYear = Number(year) || now.getFullYear() - 1;
  const issueDate = now.toISOString().slice(0, 10);

  const { items } = await base44.asServiceRole.entities.Donation.filter(
    {
      donation_type: 'recurring_monthly',
      donation_date: { $gte: `${targetYear}-01-01`, $lte: `${targetYear}-12-31` },
    },
    { limit: 500, sort: 'donation_date' },
  );

  const pending = (items || []).filter((gift) => !gift.receipt_issued && Number(gift.amount) > 0);
  const groups = new Map();
  for (const gift of pending) {
    const email = String(gift.donor_email || '').trim().toLowerCase();
    const key = gift.donor_id || (email ? `e:${email}` : `n:${String(gift.donor_name || '').trim().toLowerCase()}`);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(gift);
  }

  const branding = await loadBranding(base44);
  const base = String(appUrl || '').replace(/\/+$/, '');
  let sequence = await highestReceiptSequence(base44, now.getFullYear());
  const receipts = [];

  for (const [, gifts] of groups) {
    const total = gifts.reduce((sum, gift) => sum + (Number(gift.amount) || 0), 0);
    const first = gifts[0];
    const donor = first.donor_id
      ? await base44.asServiceRole.entities.Donor.get(first.donor_id).catch(() => null)
      : null;
    const email = String(first.donor_email || donor?.email || '').trim();
    const name = first.donor_name || [donor?.first_name, donor?.last_name].filter(Boolean).join(' ');

    if (!email || donor?.receipt_preference === 'none' || total < RECEIPT_MINIMUM) {
      receipts.push({
        donor_name: name,
        total,
        status: 'skipped',
        reason: !email
          ? 'No email address on file'
          : donor?.receipt_preference === 'none'
            ? 'Receipts turned off on the donor file'
            : `Under the ${formatMoney(RECEIPT_MINIMUM)} receipt minimum`,
      });
      continue;
    }

    sequence += 1;
    const receiptNumber = `${now.getFullYear()}-${String(sequence).padStart(4, '0')}`;
    let attachment = null;
    try {
      const bytes = await buildAnnualReceiptPdf({
        receiptNumber,
        receiptDate: issueDate,
        year: targetYear,
        donorName: name,
        donorEmail: email,
        gifts: gifts.map((gift) => ({
          date: gift.donation_date,
          amount: Number(gift.amount) || 0,
          label: gift.product_name || gift.campaign_name || 'Monthly gift',
        })),
        total,
        charityNumber: branding.charityNumber,
        address: branding.address,
        orgEmail: branding.orgEmail,
        orgPhone: branding.orgPhone,
        logoBytes: branding.logoBytes,
      });
      attachment = { filename: `Candora-Tax-Receipt-${receiptNumber}.pdf`, content: toBase64(bytes) };
    } catch (error) {
      console.log('donorThankYou: annual receipt PDF failed', error.message);
      receipts.push({ donor_name: name, total, status: 'failed', reason: error.message });
      continue;
    }

    let emailed = false;
    try {
      const result = await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        template_name: 'DonationAnnualReceipt',
        variables: {
          first_name: firstNameOf(name),
          year: String(targetYear),
          gift_count: String(gifts.length),
          total: formatMoney(total),
          receipt_number: receiptNumber,
          receipt_date: longDate(issueDate),
          campaign_url: `${base}/donate`,
          charity_number: branding.charityNumber,
          contact_email: branding.orgEmail,
          contact_phone: branding.orgPhone,
          contact_address: branding.address,
        },
        attachments: [attachment],
        category: 'transactional',
        from_name: 'Candora Society',
      });
      if (result && result.success === false) {
        console.log('donorThankYou: annual receipt refused', result.reason, result.message);
        receipts.push({ donor_name: name, total, status: 'failed', reason: result.message || result.reason });
        continue;
      }
      emailed = true;
    } catch (error) {
      console.log('donorThankYou: annual receipt email failed', error.message);
      receipts.push({ donor_name: name, total, status: 'failed', reason: error.message });
      continue;
    }

    // One receipt number covers every gift it lists.
    await base44.asServiceRole.entities.Donation.bulkUpdate(
      gifts.map((gift) => ({
        id: gift.id,
        receipt_issued: true,
        receipt_number: receiptNumber,
        receipt_date: issueDate,
      })),
    ).catch((error) => console.log('donorThankYou: annual receipt not saved on gifts', error.message));

    receipts.push({ donor_name: name, donor_email: email, total, receipt_number: receiptNumber, status: 'sent', emailed });
  }

  const sent = receipts.filter((row) => row.status === 'sent').length;
  console.log(`Annual receipts ${targetYear}: ${sent} sent, ${receipts.length - sent} skipped or failed`);
  return { year: targetYear, groups: groups.size, sent, receipts };
}