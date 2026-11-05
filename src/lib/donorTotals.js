import { base44 } from '@/api/base44Client';

// Recomputes a donor's lifetime totals from their recorded gifts so the donor
// record always matches the gift history. A first-time giver moves from
// prospect to new; staff control every other level change by hand.
export async function recalcDonorTotals(donorId) {
  if (!donorId) return;
  const page = await base44.entities.Donation.filter({ donor_id: donorId }, { limit: 500 });
  const gifts = page.items || [];
  const total = gifts.reduce((sum, gift) => sum + (Number(gift.amount) || 0), 0);
  const dates = gifts.map((gift) => gift.donation_date).filter(Boolean).sort();

  const donor = await base44.entities.Donor.get(donorId);
  const patch = {
    total_donated: total,
    last_donation_date: dates[dates.length - 1] || '',
    first_donation_date: dates[0] || '',
  };

  if (total > 0 && (!donor?.giving_level || donor.giving_level === 'prospect')) {
    patch.giving_level = 'new';
  }

  await base44.entities.Donor.update(donorId, patch);
}