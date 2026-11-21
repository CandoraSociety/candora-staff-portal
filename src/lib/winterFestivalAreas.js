// The festival areas that have their own menu selection in the Winter Wonderland
// portal. Each one is backed by a FestivalComponent of the matching type for the
// active festival year.
export const FESTIVAL_AREAS = {
  kidsGiftShop: {
    type: 'kids_gift_shop',
    label: 'Kids Gift Shop',
    emoji: '🎁',
    color: '#ef4444',
    blurb: 'A shop where children pick gifts for their family, with volunteers on hand to help them choose and wrap.',
  },
  santasVillage: {
    type: 'santas_village',
    label: "Santa's Village",
    emoji: '🎅',
    color: '#22c55e',
    blurb: 'The Santa visit, photo station and family activities that anchor the festival.',
  },
  sleighBells: {
    type: 'sleigh_bells_snowflakes',
    label: 'Sleigh Bells and Snowflakes',
    emoji: '🔔',
    color: '#3b82f6',
    blurb: 'The music, entertainment and decorating that carry the festival through the season.',
  },
  communityLunch: {
    type: 'community_lunch',
    label: 'Christmas Community Lunch',
    emoji: '🍽️',
    color: '#f59e0b',
    blurb: 'The shared holiday meal served to the community, with volunteers and food services.',
  },
  donationDrive: {
    type: 'donation_drive',
    label: 'Donation Drive',
    emoji: '💝',
    color: '#ec4899',
    blurb: 'Collecting gifts, food and funds through the season so every family can take part.',
  },
};