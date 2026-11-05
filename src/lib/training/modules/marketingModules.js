// ── Marketing & Fundraising portal training ────────────────────────────────
// One module covering the whole working year of the marketing portal: making
// the material, getting it out, and the fundraising side that runs alongside.
// Steps point at the labels that are actually on the screens.

export const MARKETING_MODULES = [
  {
    key: "marketing",
    title: "Marketing & Fundraising Portal",
    shortTitle: "Marketing",
    blurb: "Making and sending the organization's material: brand assets, email campaigns, social posts, campaigns and the calendar, plus requests, donors, donation pages, media and the annual report.",
    path: "/marketing",
    steps: [
      {
        title: "Welcome to Marketing & Fundraising",
        body: "This portal is where Candora's public voice is made: the brand assets, the email campaigns, the social posts, and the campaigns that tie them together. It also carries the fundraising side — requests from staff, donors, donation pages, media and the annual report. You are in Training Mode, so everything here is simulated.",
        path: "/marketing"
      },
      {
        title: "The dashboard in six numbers",
        body: "Active Campaigns is what is running now; Brand Assets is how much approved material you have to draw on; Pending Requests is how much staff work is waiting on you. Then the email figures: average open rate and emails sent. Each tile is a link — click it and you land on the page behind the number.",
        path: "/marketing",
        target: { text: "Active Campaigns", scope: "main" }
      },
      {
        title: "Brand assets are the starting point",
        body: "Brand Assets holds the logos, templates, photographs and approved copy that everything else is built from. When someone asks for a poster or a post, start here rather than making something new: using the approved mark and colours is what keeps a hundred small pieces looking like one organization.",
        path: "/marketing/assets",
        target: { text: "Brand Assets", scope: "main" }
      },
      {
        title: "When nothing fits, make an image",
        body: "The AI Image Creator generates visuals for a campaign when no existing asset does the job — a header for an event page, a background for a post. Describe what you need, generate, and keep the ones worth using. Anything it makes for the organization belongs in Brand Assets so the next person finds it.",
        path: "/marketing/ai-image"
      },
      {
        title: "Email campaigns",
        body: "Email Campaigns is built in two parts: the lists of people you send to, and the campaigns themselves. A campaign is written from a template, sent to a list, and then reports back how many reached an inbox and how many were opened. The open rate on the dashboard is calculated from exactly these numbers.",
        path: "/marketing/email",
        target: { text: "Email Campaigns", scope: "main" }
      },
      {
        title: "Social media, planned ahead",
        body: "Social Media Manager is where posts are written, given an image and scheduled for a channel. Scheduled posts sit in a queue, so a week of presence is planned once rather than improvised each morning. The scheduled count on the dashboard is this queue.",
        path: "/marketing/social",
        target: { text: "Social Media Manager", scope: "main" }
      },
      {
        title: "Campaigns hold it together",
        body: "A campaign is the container for one push — a season, an appeal, an event — with its own dates, goal and budget. The emails and posts that belong to it are linked to it, so you can look at one campaign and see everything that went out and what it achieved. Statuses run Planning, Active, then Completed.",
        path: "/marketing/campaigns",
        target: { text: "Campaigns", scope: "main" }
      },
      {
        title: "The marketing calendar",
        body: "The Marketing Calendar lays every campaign, email send and scheduled post on one timeline. It answers the question that comes up constantly — what is going out next week — and it shows a gap before the gap becomes a quiet month.",
        path: "/marketing/calendar",
        target: { text: "Marketing Calendar", scope: "main" }
      },
      {
        title: "The content planner",
        body: "The Content Planner is for the pieces that take longer than a post: an article, a story, a video, a newsletter. Each piece moves through its own stages from idea to published, so work in progress is visible instead of living in someone's drafts folder.",
        path: "/marketing/content",
        target: { text: "Content Planner", scope: "main" }
      },
      {
        title: "Requests from the rest of the organization",
        body: "Marketing Requests is your queue of jobs other staff have asked for — a poster, a social post, a sign-up page. Each arrives submitted with what it is for and when it is needed. Move it to in progress while you work, and completed when it is done: the person who asked watches that status.",
        path: "/marketing/requests",
        target: { text: "Marketing Requests", scope: "main" }
      },
      {
        title: "Donors and donation pages",
        body: "Donor Management keeps the people and organizations who give, with their history and how they prefer to be contacted. Donation Pages & UTM Links are the giving pages you publish and the tracked links you share, so a donation that comes in can be traced back to the campaign or post that prompted it.",
        path: "/marketing/donors",
        target: { text: "Donor Management", scope: "main" }
      },
      {
        title: "Media, press and the annual report",
        body: "Media & Press keeps the press releases you have issued, the coverage Candora received and the contacts who write about it. The Annual Report Builder assembles the year's story: pick the sections, fill them in from the records, and produce the finished document from the same place.",
        path: "/marketing/media",
        target: { text: "Media & Press", scope: "main" }
      },
      {
        title: "SEO, the website and resources",
        body: "SEO Tools shows how the public sites are found — titles, descriptions and the search terms that matter. Website & Domains tracks the addresses Candora publishes on, and Resources Directory holds the how-to material the team works from. Together they are the plumbing behind everything you send people to.",
        path: "/marketing/seo",
        target: { text: "SEO Tools", scope: "main" }
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now create a campaign, schedule a social post and work one request through to completed — all on simulated data."
      }
    ],
    tasks: [
      {
        title: "Create a campaign",
        body: "Open Campaigns and create one with a name, a goal and a start date. Leave it in planning, then open it and look at what it will collect as emails and posts are added.",
        hint: "Campaigns → New campaign → fill in the name and dates.",
        path: "/marketing/campaigns",
        verify: { kind: "created", entity: "MarketingCampaign" }
      },
      {
        title: "Schedule a social post",
        body: "Write a short post in Social Media, choose a channel and schedule it for later this week. Check it appears in the scheduled queue.",
        hint: "Social Media → New post → pick a channel and a date.",
        path: "/marketing/social",
        verify: { kind: "created", entity: "SocialPost" }
      },
      {
        title: "Work a request",
        body: "Open Marketing Requests, take a submitted request, move it to in progress and then to completed.",
        hint: "Requests → open a submitted request → change its status.",
        path: "/marketing/requests",
        verify: { kind: "self" }
      }
    ]
  }
];