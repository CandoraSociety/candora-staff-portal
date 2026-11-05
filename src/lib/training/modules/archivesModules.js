// ── Candora Archives training ─────────────────────────────────────────────
// Two modules: a tour of the portal itself, and the curation module — what
// staff actually have to collect, write down and file for the archive to
// become a living history rather than an empty shelf.
// Steps point at headings that exist on the real pages.

export const ARCHIVES_MODULES = [
  {
    key: "archives",
    title: "Candora Archives",
    shortTitle: "Archives",
    blurb: "The organization's memory: the historical timeline, the full chronicle, biographies of the people who built Candora, the stories worth retelling, and the document archive behind them.",
    path: "/archives",
    steps: [
      {
        title: "Welcome to the Candora Archives",
        body: "The Archives portal is where Candora keeps its own history — not client records, not program data, but the story of the organization: when it started, who built it, what it survived, and the moments worth telling again. Four collections sit inside it, and they are meant to be read together: the Timeline, the people (Bios), the Stories, and the Documents. You are in Training Mode, so everything you open and everything you add here is simulated.",
        path: "/archives",
        target: { selector: '[data-tour="archives-hero"]' }
      },
      {
        title: "Four counts that tell you whether the archive is alive",
        body: "Timeline Events, Biographies, Stories and Documents are the health of the archive in four numbers. A timeline with sixty events and two bios means one person has been doing all the work; a document count with no stories means the archive holds evidence but not meaning. When you are asked to help with the archives, these four counts tell you what is missing before you open a single page.",
        path: "/archives",
        target: { selector: '[data-tour="archives-stats"]' }
      },
      {
        title: "Featured Moments",
        body: "The home page shows the items marked as featured — normally no more than three timeline items and two stories. Featuring is how the archive stays in front of staff: something new at the top each time the page is opened is what makes people believe the archive is alive. It is also the first thing a new employee or a funder sees, so keep the featured items current and rotate them.",
        path: "/archives",
        target: { text: "Featured Moments", scope: "main" }
      },
      {
        title: "The quick upload strip",
        body: "At the top of the page is the portals' quick upload. A file dropped here is filed into the Archives folder in SharePoint and appears in the File Manager, so a photo or a scanned clipping can be put somewhere safe before anyone has time to write it up. Getting the file saved is the first half of the job; writing the event or story around it is the second half, and both matter.",
        path: "/archives",
        target: { selector: '[data-tour="archives-upload"]' }
      },
      {
        title: "The timeline is the spine",
        body: "Historical Timeline lists every event, newest first, on a single line that runs down the page. Press a card and it opens in place: the summary, the first photo attached to it, and a link to read the full story. Nothing here is edited in the card itself — admin staff open the item to change it. The timeline is the spine of the archive, because every other collection hangs off a date.",
        path: "/archives/timeline",
        target: { text: "Historical Timeline", scope: "main" }
      },
      {
        title: "Eras are how people browse a long history",
        body: "The era buttons — Founding, Growth, Expansion, Milestones, Modern — filter the timeline without leaving the page. They only work if every item has been given an era when it was written, which is why the era field is never left on its default. Someone reading a thirty-year history thinks in periods, not in an alphabetical list of events.",
        path: "/archives/timeline",
        target: { text: "All Eras", scope: "main" }
      },
      {
        title: "The Full Chronicle",
        body: "Full Chronicle reads the whole timeline as one continuous document, era by era, with a print button. This is the version that goes to a board orientation package, a funder, or an anniversary event — so it is only as good as the writing inside the timeline items. If the chronicle reads like a list of dates rather than a story, the fix is in the items, not in the chronicle.",
        path: "/archives/timeline/chronicle",
        target: { text: "The Candora Chronicle", scope: "main" }
      },
      {
        title: "People of Candora",
        body: "Bios holds one card per significant person — executive directors, board chairs, founders, key staff, community champions — filterable by the role they held. Each card opens a biography with their term, their portrait and their key highlights. The people who left are the ones most easily lost, so a bio is usually the first thing to write when someone retires from the board or moves on from a long role.",
        path: "/archives/bios",
        target: { text: "People of Candora", scope: "main" }
      },
      {
        title: "Interesting and important stories",
        body: "Stories are the narrative pieces: the flood, the first graduating class, the year the building nearly closed, the reason a program started in the first place. Each card carries the date the story takes place, its era and who wrote it down. A timeline item says that something happened; a story says what it was like — that is what makes people read the archive instead of skimming it.",
        path: "/archives/stories",
        target: { text: "Interesting", scope: "main" }
      },
      {
        title: "The document archive",
        body: "Document Archive holds the evidence: photos, videos, newspaper clippings and news coverage, contracts and communications, sorted by subcategory. View opens the file as it was uploaded. These are the originals — the photo you can put in an annual report, the clipping that proves what a news story said — so a document is filed here even when nobody has written the event up yet.",
        path: "/archives/documents",
        target: { text: "Document Archive", scope: "main" }
      },
      {
        title: "Who can change the archive",
        body: "Reading the archive is open to staff; adding and editing is not. The Add buttons — Add Item, Add Bio, Add Story, Upload Document — only appear for administrators, which is deliberate: a history that anyone can quietly rewrite is not a history. If you have something for the archive, you either write it up and hand it to the archive lead, or you are given admin access and do it yourself.",
        path: "/archives/timeline"
      },
      {
        title: "One moment, several collections",
        body: "A single moment in Candora's life usually belongs in more than one place: the date on the timeline, a bio update for the person who led it, a story that explains what it felt like, and the photo or clipping in the document archive. Link them and cross-reference them rather than duplicating the same paragraph in three places — when the facts change, one correction then fixes all three.",
        path: "/archives"
      },
      {
        title: "Time to practice",
        body: "That is the tour. Open an event and read its full story, use the era filters, open a biography, read the chronicle and open a document — all on simulated data. Then take the second module, Building a Living History, which is the part that matters: what we have to go out and collect."
      }
    ],
    tasks: [
      {
        id: "arch-read-event",
        title: "Read one event end to end",
        body: "Open a timeline event, expand it, and follow it through to the full story.",
        hint: "Timeline → press any card to expand it → Read full story.",
        path: "/archives/timeline",
        verify: { kind: "self" }
      },
      {
        id: "arch-era-filter",
        title: "Browse by era",
        body: "Filter the timeline to one era and notice how few or many events sit inside it.",
        hint: "On the Timeline, press Founding, Growth, Expansion or Modern.",
        path: "/archives/timeline",
        verify: { kind: "self" }
      },
      {
        id: "arch-chronicle",
        title: "Read a section of the chronicle",
        body: "Open Full Chronicle and read one era straight through, as a reader would.",
        hint: "Timeline → Full Chronicle button at the top right.",
        path: "/archives/timeline/chronicle",
        verify: { kind: "self" }
      },
      {
        id: "arch-bio",
        title: "Open a biography",
        body: "Find a person by the role they held and read their highlights.",
        hint: "Bios → choose a role filter → press a card.",
        path: "/archives/bios",
        verify: { kind: "self" }
      }
    ]
  },
  {
    key: "archives_curation",
    title: "Building a Living History",
    shortTitle: "Living History",
    blurb: "How the archive gets filled: what to collect, how to record it properly, who to interview, and the small habit that keeps the history growing every quarter.",
    path: "/archives",
    steps: [
      {
        title: "An archive is a habit, not a project",
        body: "Every organization's history starts as boxes, photos on someone's phone and stories only three people remember. What separates an archive from a shoebox is a habit: a small, repeated practice of capturing what happened while the people who were there can still be asked. This module is about that practice — what to collect, how to record it so it is still useful in ten years, and who does it.",
        path: "/archives"
      },
      {
        title: "The one rule: write it down when you hear it",
        body: "Memory decays fast and unevenly. A program launch is vivid the week it happens and gone in a year; the person who ran it retires and the reason behind a decision goes with them. So the standing rule is simple — the moment something worth remembering happens, someone writes three lines on the timeline. Three lines captured while it is fresh beats a beautiful article written never.",
        path: "/archives/timeline",
        target: { text: "Add Item", scope: "main" }
      },
      {
        title: "What counts as an event",
        body: "Anything that later explains why Candora looks the way it does: a founding, a program launch, a partnership signed, an award, a leadership change, a building expansion, a crisis survived, a measurable change in the community. The category field is exactly this list. If you cannot pick a category, the item is usually a story rather than an event — put it in Stories instead.",
        path: "/archives/timeline",
        target: { text: "Add Item", scope: "main" }
      },
      {
        title: "Write the title like a headline",
        body: "The title is what appears on the timeline card and in the chronicle's table of contents, so it should say what happened rather than name a topic. Candora Opens Its Doors on 118 Avenue says more than Founding, and The Fire That Closed the Kitchen for Six Months tells a reader where they are heading. Keep it to one line and put the date in the date fields, never in the title.",
        path: "/archives/timeline"
      },
      {
        title: "Date, era and category are what make it findable",
        body: "Year is required; month and day are what place the item correctly inside its year, so add them whenever they are known rather than leaving them blank. Era puts the event in a period a reader can browse. Somewhere in the detailed content, name the source: which minutes, which newsletter, which person told you. A date you cannot source is the first thing the next generation will doubt.",
        path: "/archives/timeline"
      },
      {
        title: "The summary and the full story do different jobs",
        body: "The summary is two sentences — what happened and why it mattered — and it is the only text most readers will ever see, because it is what the card, the chronicle entry and the featured tile show. The detailed content is the full account: who was involved, what was decided, what it changed, what it cost. Write the summary last, once you know what the story actually is.",
        path: "/archives/timeline"
      },
      {
        title: "Interview before you write",
        body: "For anything older than a couple of years, the record will not be enough. Put half an hour in front of the person who was there, ask what happened before and after, and write down how they describe it — their phrases are usually better than yours. Get the spelling of names right in that conversation, and ask whether they are happy to be quoted. The archive holds what people agreed to share, not everything they said.",
        path: "/archives/stories"
      },
      {
        title: "Photographs need captions, not just files",
        body: "A folder of uncaptioned photos becomes unreadable within a decade: nobody knows who is in them, or which year it was. Every photo attached to an event or story carries a caption naming the people, the place and the rough date — write 'believed to be' when you are guessing, because a confident wrong caption is worse than an honest uncertain one. Ask permission before publishing a portrait or a photo of someone who has since left.",
        path: "/archives/documents",
        target: { text: "Upload Document", scope: "main" }
      },
      {
        title: "File documents so they can be found again",
        body: "Upload Document asks for a subcategory and a short description. Choose the subcategory honestly — Photos, Videos, Newspaper Clippings, News Coverage, Contracts, Communications — and use the description for what a searcher would type: who, where, when. Name the file itself with the year first, then the event, then the detail, so a list of files sorts itself into a chronology.",
        path: "/archives/documents",
        target: { text: "Document Archive", scope: "main" }
      },
      {
        title: "Bios: write people up while they can still correct you",
        body: "A biography is the most personal part of the archive and the easiest to get wrong. The role and the term dates are facts — take them from the board minutes. The biography is the interpretation — what that person changed, what they were like to work with. Write it while they can read it back to you, and let them fix it; a bio corrected by its subject is worth ten written after they have gone.",
        path: "/archives/bios",
        target: { text: "Add Bio", scope: "main" }
      },
      {
        title: "Stories carry the meaning",
        body: "Stories are where the archive becomes readable: the first day, the year the money ran out, the family that came back three generations later, the client who became a staff member told with no identifying details and with consent. Record who curated it in the author field and when it takes place in the story date, so a story can be found by period like everything else. Do not put anything on a living person's file that they have not agreed to.",
        path: "/archives/stories",
        target: { text: "Add Story", scope: "main" }
      },
      {
        title: "The quarterly harvest",
        body: "The habit that keeps the archive alive is a short, scheduled sweep — once a quarter, half an hour, with the year's calendar open. Ask four questions: what launched, who arrived or left in a significant role, what did we survive, what did a funder or the community notice about us? Each answer becomes a timeline item. Anything longer goes to the person who likes writing, as a story.",
        path: "/archives/timeline"
      },
      {
        title: "Where the raw material already sits",
        body: "Almost none of this has to be created from nothing. Board minutes hold decisions and dates, annual reports hold the year in numbers, program launches have posters and photos, newsletters hold the language each era used about itself, and long-serving staff hold the parts nobody wrote down. The archive's job is to pull those four sources together into one dated, readable record — one event at a time.",
        path: "/archives/documents"
      },
      {
        title: "Keeping it alive rather than finished",
        body: "An archive is finished the day it stops being added to. Rotate the featured items each quarter, add anniversaries and milestones as they land, and connect old events to the programs that still exist because of them — the archive is also the best onboarding document staff have and the strongest evidence in a funder application. The test is simple: if a new employee read the chronicle in their first week, would they understand what this organization is and why?",
        path: "/archives/timeline/chronicle",
        target: { text: "The Candora Chronicle", scope: "main" }
      },
      {
        title: "Time to practice",
        body: "Now build something. Add a timeline item for a milestone in your own program, write one bio for a person who shaped it, write one story with the people and photos you have, and file a document with a proper caption and description — all in Training Mode, so nothing here touches the real archive."
      }
    ],
    tasks: [
      {
        id: "archc-event",
        title: "Add a timeline item",
        body: "Create one event from a milestone in your own program: a headline-style title, year, month, era, category, a two-sentence summary.",
        hint: "Timeline → Add Item. Pick the era you would want a reader to find it in, and write the summary as what happened and why it mattered.",
        path: "/archives/timeline",
        verify: { kind: "created", entity: "ArchiveTimelineItem" }
      },
      {
        id: "archc-bio",
        title: "Write a biography",
        body: "Add one bio for a person who shaped Candora — their role, term, and two or three highlights.",
        hint: "Bios → Add Bio. Use the highlights field for one achievement per line.",
        path: "/archives/bios",
        verify: { kind: "created", entity: "ArchiveBio" }
      },
      {
        id: "archc-story",
        title: "Write a story",
        body: "Add one story with a title, the period it takes place in, who curated it, and what actually happened.",
        hint: "Stories → Add Story. The story date and era are what let people find it later.",
        path: "/archives/stories",
        verify: { kind: "created", entity: "ArchiveStory" }
      },
      {
        id: "archc-harvest",
        title: "Draft a quarterly harvest list",
        body: "Write down three things from your own area that a reader in ten years would want to know, and mark them for the next archive sweep.",
        hint: "Use the timeline's Add Item three times, or keep the list in a note — the habit is the point.",
        path: "/archives/timeline",
        verify: { kind: "self" }
      }
    ]
  }
];