// Donor and gift bookkeeping for online campaign gifts. Shared by the checkout
// (which opens the payment) and the Stripe webhook (which records the gift once
// Stripe confirms the money arrived), so a gift is only ever written from a
// verified payment.

export function splitName(fullName) {
  const clean = String(fullName || '').trim().replace(/\s+/g, ' ');
  if (!clean) return { first_name: '', last_name: 'Supporter' };
  const parts = clean.split(' ');
  if (parts.length === 1) return { first_name: parts[0], last_name: parts[0] };
  return {
    first_name: parts.slice(0, -1).join(' '),
    last_name: parts[parts.length - 1],
  };
}

async function findOrCreateDonor(base44, { name, email, anonymous }) {
  const cleanEmail = String(email || '').trim();
  const candidates = [...new Set([cleanEmail, cleanEmail.toLowerCase()].filter(Boolean))];
  for (const candidate of candidates) {
    const { items } = await base44.asServiceRole.entities.Donor.filter(
      { email: candidate },
      { limit: 1 }
    );
    if (items && items[0]) return items[0];
  }

  const { first_name, last_name } = splitName(name);
  return base44.asServiceRole.entities.Donor.create({
    first_name,
    last_name,
    email: cleanEmail,
    donor_type: 'individual',
    giving_level: 'new',
    is_anonymous: !!anonymous,
    receipt_preference: 'email',
    notes: 'Created from an online campaign gift.',
  });
}

async function recalcDonorTotals(base44, donorId) {
  if (!donorId) return;
  const { items } = await base44.asServiceRole.entities.Donation.filter(
    { donor_id: donorId },
    { limit: 500 }
  );
  const gifts = items || [];
  const total = gifts.reduce((sum, gift) => sum + (Number(gift.amount) || 0), 0);
  const dates = gifts.map((gift) => gift.donation_date).filter(Boolean).sort();

  const donor = await base44.asServiceRole.entities.Donor
    .get(donorId)
    .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
  if (!donor) return;

  const patch = {
    total_donated: total,
    first_donation_date: dates[0] || '',
    last_donation_date: dates[dates.length - 1] || '',
  };
  if (total > 0 && (!donor.giving_level || donor.giving_level === 'prospect')) {
    patch.giving_level = 'new';
  }
  await base44.asServiceRole.entities.Donor.update(donorId, patch);
}

// Writes the gift itself: the supporter's donor record, the donation, and their
// updated lifetime totals. Returns the donation that was created.
export async function recordCampaignGift(base44, {
  campaignId,
  campaignName,
  productName,
  amount,
  feeAmount = 0,
  frequency,
  donorName,
  donorEmail,
  message,
  anonymous,
  reference,
}) {
  const donor = await findOrCreateDonor(base44, {
    name: donorName,
    email: donorEmail,
    anonymous,
  });

  const donation = await base44.asServiceRole.entities.Donation.create({
    donor_id: donor.id,
    donor_name: anonymous ? 'Anonymous' : donorName,
    amount: Number(amount),
    donation_date: new Date().toISOString().slice(0, 10),
    donation_type: frequency === 'monthly' ? 'recurring_monthly' : 'one_time',
    campaign_id: campaignId,
    campaign_name: campaignName,
    product_name: productName || '',
    payment_method: 'online',
    source: 'online_campaign',
    payment_reference: reference || '',
    donor_email: donorEmail || '',
    gift_message: message || '',
    is_anonymous: !!anonymous,
    notes: Number(feeAmount) > 0
      ? `Paid online on the campaign page. The supporter also covered $${Number(feeAmount).toFixed(2)} in processing fees.`
      : 'Paid online on the campaign page.',
  });

  await recalcDonorTotals(base44, donor.id);
  return donation;
}