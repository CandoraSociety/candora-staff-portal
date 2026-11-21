// The online-presence checklist Website Studio works through. These are the
// things that decide whether someone — or an AI assistant — can actually find
// Candora today, kept as data so the page stays a checklist and the state lives
// in WebsitePresenceItem records.

export const PRESENCE_CATEGORIES = [
  {
    id: "listings",
    label: "Local listings & maps",
    blurb: "Where people look when they search for help nearby.",
  },
  {
    id: "reviews",
    label: "Reviews & reputation",
    blurb: "What a stranger reads before deciding to come in.",
  },
  {
    id: "social",
    label: "Social profiles",
    blurb: "The profiles that confirm you are real and active.",
  },
  {
    id: "ai_search",
    label: "AI assistants",
    blurb: "Whether ChatGPT and Google's AI answers can describe you correctly.",
  },
  {
    id: "technical",
    label: "Technical health",
    blurb: "The foundations search engines need to read the site.",
  },
  {
    id: "content",
    label: "Content & shareability",
    blurb: "How the site reads when it is shared or quoted.",
  },
  {
    id: "measurement",
    label: "Measurement",
    blurb: "Knowing what is working, month to month.",
  },
];

export const PRESENCE_ITEMS = [
  {
    key: "gbp_claimed",
    category: "listings",
    label: "Google Business Profile claimed and complete",
    why: "The single strongest local signal — it powers the map panel and the reviews shown in search.",
    link: "https://business.google.com",
  },
  {
    key: "gbp_hours_photo",
    category: "listings",
    label: "Hours, photo, phone and address correct on Google",
    why: "Half-complete profiles rank lower and send people to the wrong door.",
    link: "https://business.google.com",
  },
  {
    key: "bing_places",
    category: "listings",
    label: "Bing Places listing claimed",
    why: "Feeds Bing, Edge and Copilot's local answers.",
    link: "https://www.bingplaces.com",
  },
  {
    key: "apple_business",
    category: "listings",
    label: "Apple Business Connect listing claimed",
    why: "Puts the address and hours into Apple Maps and Siri.",
    link: "https://businessconnect.apple.com",
  },
  {
    key: "nap_consistent",
    category: "listings",
    label: "Name, address and phone identical everywhere",
    why: "Different spellings or phone formats split your reputation across listings.",
  },
  {
    key: "directories",
    category: "listings",
    label: "Listed in charity and community directories",
    why: "211, Volunteer Alberta, charity registries and city directories are where referral partners and AI assistants look.",
  },
  {
    key: "reviews_ask",
    category: "reviews",
    label: "A simple way to ask participants for a Google review",
    why: "Volume and recency of reviews are what move the map panel.",
  },
  {
    key: "reviews_reply",
    category: "reviews",
    label: "Replies to every review, especially the hard ones",
    why: "Replies are read by future participants and counted by search engines.",
  },
  {
    key: "social_linked",
    category: "social",
    label: "Every active social profile linked from the website",
    why: "Confirms the organization is real, and passes visitors somewhere they can follow along.",
    link: "https://candora.ca",
  },
  {
    key: "social_active",
    category: "social",
    label: "At least one profile posting monthly",
    why: "An abandoned profile reads as a closed organization.",
  },
  {
    key: "ai_one_sentence",
    category: "ai_search",
    label: "The site says in one sentence what Candora is, who it serves and where",
    why: "This is the sentence an AI assistant quotes. Without it, it guesses.",
  },
  {
    key: "ai_plain_pages",
    category: "ai_search",
    label: "Each program page says what it is, who it is for and how to start",
    why: "Assistants answer from single pages, not from the whole site.",
  },
  {
    key: "ai_faq",
    category: "ai_search",
    label: "A short FAQ answering the questions people actually ask at the desk",
    why: "Question-and-answer blocks are what AI answers lift most readily.",
  },
  {
    key: "ai_llms_txt",
    category: "ai_search",
    label: "An llms.txt file guiding AI assistants to the right pages",
    why: "A short map of the site that AI crawlers read before quoting you.",
  },
  {
    key: "schema_org",
    category: "technical",
    label: "Organization and LocalBusiness structured data on the site",
    why: "Tells search engines the legal name, address, phone and charity status in a form they parse.",
  },
  {
    key: "sitemap_submitted",
    category: "technical",
    label: "Sitemap submitted to Google Search Console and Bing",
    why: "How new pages get found in days instead of months.",
  },
  {
    key: "robots_ok",
    category: "technical",
    label: "robots.txt lets search engines and AI crawlers in",
    why: "A stray block hides the whole site from search.",
  },
  {
    key: "https_mobile",
    category: "technical",
    label: "Site loads over HTTPS and works on a phone",
    why: "Both are ranking factors, and most visitors arrive on a phone.",
  },
  {
    key: "speed",
    category: "technical",
    label: "Home page loads in under three seconds on a phone",
    why: "Slow pages lose visitors before they read anything.",
  },
  {
    key: "share_image",
    category: "content",
    label: "A share image and description for every main page",
    why: "Decides how a link looks in a message, a post or an AI citation.",
  },
  {
    key: "news_cadence",
    category: "content",
    label: "News or program updates posted at least monthly",
    why: "Fresh, dated content is what keeps a site being crawled and recommended.",
  },
  {
    key: "email_signup",
    category: "content",
    label: "An email signup on the site",
    why: "The one audience you own outright, independent of any algorithm.",
  },
  {
    key: "analytics",
    category: "measurement",
    label: "Search Console and site analytics connected",
    why: "Shows which phrases already bring people in, and which pages never get seen.",
  },
  {
    key: "consent",
    category: "measurement",
    label: "A cookie consent banner in place",
    why: "Required for tracking visitors in Canada, and it keeps analytics trustworthy.",
  },
  {
    key: "monthly_review",
    category: "measurement",
    label: "A monthly look at the numbers",
    why: "One hour a month on what changed beats any one-off optimisation.",
  },
];

export function itemsForCategory(categoryId) {
  return PRESENCE_ITEMS.filter((item) => item.category === categoryId);
}