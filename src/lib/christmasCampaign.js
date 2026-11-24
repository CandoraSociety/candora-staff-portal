import { formatMoney } from '@/lib/donorConstants';

// The Christmas campaign's shared identity and the copy that goes with each of
// its three causes. The approved headlines come from the campaign's own pillar
// records; everything here is what the public page adds around them.
export const CHRISTMAS_HEADLINE = 'Bring Joy, Hope & Belonging This Christmas';

export const CHRISTMAS_INTRO =
  'This Christmas, help create meaningful experiences for children, opportunities for families and connections that bring our community together. Choose how you would like to make a difference and help bring joy, hope and belonging to our community.';

const PILLAR_META = {
  joy: {
    cta: 'Sponsor a Child',
    tone: 'gold',
    impact: [
      'A child choosing and wrapping gifts for the people they love.',
      'A neighbourhood gift shop where families shop with dignity.',
      'The pride a child feels in giving something themselves.',
    ],
  },
  hope: {
    cta: 'Bring Hope',
    tone: 'blue',
    impact: [
      'Home Alone courses that build children\u2019s confidence and skills.',
      'Children\u2019s music and mental health programming.',
      'Enhanced prenatal programming for expecting parents.',
      'Other children and family initiatives as needs arise.',
    ],
  },
  belonging: {
    cta: 'Bring Belonging',
    tone: 'evergreen',
    impact: [
      'Community Lunch, where anyone is welcome at the table.',
      'Seniors programming that keeps people connected.',
      'Community field trips and shared experiences.',
      'Other opportunities for meaningful human connection.',
    ],
  },
};

// A pillar's tone and call to action, matched on its id first and its name next,
// so staff can rename a cause without losing its identity.
export const pillarKey = (pillar) => {
  const id = String(pillar?.id || '').toLowerCase();
  if (PILLAR_META[id]) return id;
  const name = String(pillar?.name || '').toLowerCase();
  return Object.keys(PILLAR_META).find((key) => name.startsWith(key)) || '';
};

export const pillarMeta = (pillar) =>
  PILLAR_META[pillarKey(pillar)] || { cta: 'Give now', tone: 'gold', impact: [] };

export const activePillars = (campaign) =>
  (campaign?.pillars || [])
    .filter((pillar) => pillar.is_active !== false)
    .slice()
    .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

// The campaign the campaigns page presents in full: the Christmas appeal that
// runs fundraising pillars.
export const findChristmasCampaign = (campaigns = []) =>
  campaigns.find(
    (campaign) =>
      campaign.seasonal_theme === 'christmas' &&
      campaign.enable_pillars === true &&
      activePillars(campaign).length > 0
  ) || null;

export const pillarTiers = (campaign, pillar) =>
  (campaign?.donation_products || [])
    .filter((tier) => tier.is_active !== false && tier.pillar_id === pillar?.id)
    .slice()
    .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

// The Joy card's headline amount, e.g. "$50 sponsors one child."
export const sponsorshipLine = (campaign, pillar) => {
  if (pillarKey(pillar) !== 'joy') return '';
  const tiers = (campaign?.donation_products || []).filter(
    (tier) => tier.is_active !== false && (!tier.pillar_id || tier.pillar_id === pillar.id)
  );
  const sponsor =
    tiers.find((tier) => /sponsor/i.test(tier.name || '')) ||
    tiers.find((tier) => Number(tier.amount) === 50);
  return sponsor ? `${formatMoney(sponsor.amount)} sponsors one child.` : '';
};

export const raisedForPillar = (campaign, pillarId) =>
  Number(
    (campaign?.pillar_totals || []).find((row) => (row.pillar_id || '') === pillarId)?.raised
  ) || 0;