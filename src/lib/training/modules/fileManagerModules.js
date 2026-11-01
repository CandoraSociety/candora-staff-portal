// ── File Manager training module ───────────────────────────────────────────
// Most staff never need the File Manager's full functionality, but almost
// every role meets the vault through the dashboard Quick Files widget, the
// upload card on each portal dashboard, receipts and signed documents. The
// tour is built around that: where the vault meets your day first, then the
// tools you reach for when you actually need them.

export const FILE_MANAGER_MODULES = [
  {
    key: "filemanager",
    title: "File Manager & Document Vault",
    shortTitle: "File Manager",
    blurb: "Candora's document vault: where the files you upload from any portal, receipt or signature end up — and the few tools worth knowing if you ever have to go in after one.",
    path: "/filemanager",
    steps: [
      {
        title: "Welcome to the File Manager",
        body: "Press Play to hear a quick overview of the File Manager and why it matters even if you never open it. Each scene stays on screen until its narration finishes. When you're ready, press Next below to continue training — everything you see is simulated.",
        introExplainer: true,
        path: "/filemanager",
        target: { selector: 'a[href="/filemanager"]' }
      },
      {
        title: "You already use it",
        body: "Here's the surprising part: most staff never open the File Manager portal, yet they use it every week. The Quick Files widget on your home page, the upload card on every portal dashboard, the receipts you attach, the documents you sign — all of them land in the same document vault. The File Manager is simply the portal where that vault is browsed, organized and shared.",
        path: "/",
        target: { selector: '[data-tour="dashboard-quickfiles"]' }
      },
      {
        title: "The vault at a glance",
        body: "When you do open it, the dashboard answers the everyday questions. These cards count your files, notes, collections and storage, and the panels below show the most recent files and the categories in use. If anything arrived without a category, a sorting banner appears right here telling you what still needs a home.",
        path: "/filemanager",
        target: { selector: '[data-tour="fm-stats"]' }
      },
      {
        title: "All Files",
        body: "All Files is the whole vault, as far as your permissions reach: every file you've been granted access to in one list, with each portal collecting its own files in a sub-folder underneath. Nothing here is a copy — it's the same file anyone else with access opens.",
        path: "/filemanager/files",
        target: { selector: 'a[href="/filemanager/files"]', additionalSelectors: ['[data-tour="fm-grid"]'] }
      },
      {
        title: "Narrowing it down",
        body: "Three controls do the work. The search box matches file names, descriptions and summaries. The filters narrow by file type, category and access level. And the grid/list switch on the right changes how much you see at once. If a file you expect is missing, the access filter is almost always the reason — you only ever see what you're allowed to open.",
        path: "/filemanager/files",
        target: { selector: '[data-tour="fm-filters"]' }
      },
      {
        title: "Opening a file",
        body: "Click any card to open the file: the viewer previews PDFs, images and Office documents, and the actions on the card let you download it, edit its details or share it. Access level is the gate — someone without it never sees the file at all, not even its name.",
        path: "/filemanager/files",
        target: { selector: '[data-tour="fm-grid"]' }
      },
      {
        title: "Uploading one file",
        body: "Upload Files is the single-file flow, and it's where the vault stays organized. Drop the file in, then give it a display name, a category, an access level, a description and keywords. Keywords matter more than they look: they're what the Quick Files search and the vault search match on later.",
        path: "/filemanager/upload",
        target: { selector: '[data-tour="fm-upload-fields"]' }
      },
      {
        title: "The access levels",
        body: "Five levels decide who sees a file: personal (only you), universal (everyone), manager, finance (only authorized people) and corporate. Choose the least open level that still does the job — this is the setting you can't fix later on behalf of someone who can't see the file. Finance files also let you name the people authorized to open them.",
        path: "/filemanager/upload",
        target: { selector: '[data-tour="fm-upload-access"]' }
      },
      {
        title: "My Files — your own space",
        body: "My Files filters the same list down to what's yours alone: drafts, working documents, anything you uploaded as personal. It's the closest thing to a personal drive, and nobody else can open what's in it.",
        path: "/filemanager/files?access=personal",
        target: { selector: 'a[href="/filemanager/files?access=personal"]' }
      },
      {
        title: "Portal folders",
        body: "Each portal files into its own folder: Pathways, ELL, Finance, the Board and the rest. Those appear as sub-folders under All Files, and the upload card on each portal dashboard drops files straight into that portal's folder — so an ELL document and a Finance document never end up mixed together.",
        path: "/filemanager/files",
        target: { selector: '[data-tour="fm-portal-folders"]' }
      },
      {
        title: "Bulk Import — a stack, not a file",
        body: "When you're digitizing a filing cabinet or a folder of photographs, Bulk Import takes many files at once. Choose the batch, give each file a category (or leave it to be sorted later — the sorting banner keeps track), and upload them together. Photos get their own sorter so each image can be filed without opening it.",
        path: "/filemanager/bulk",
        target: { selector: '[data-tour="fm-bulk"]' }
      },
      {
        title: "Beyond storing: collections, workspace, notes",
        body: "Three tools take it past storage. Collections group files into a set you can hand over as a package — a grant application with all its attachments, say. My Workspace is a working surface for the files you're in the middle of. And Notes attach to files, so the context lives with the document instead of in an email.",
        path: "/filemanager/collections",
        target: { selector: 'a[href="/filemanager/collections"]' }
      },
      {
        title: "Time to practice",
        body: "That's the tour! The practice checklist has three short tasks: upload a file with a category and an access level, find it again with search and filters, and run a bulk import. Most of it you'll never need day to day — but now you know where it is when you do."
      }
    ],
    tasks: [
      {
        id: "fm-upload",
        title: "Upload a file to the vault",
        body: "Upload any document with a display name, a category, an access level and a keyword or two.",
        hint: "Open Upload Files, drop a file in, then fill in the Display Name, pick a Category, choose an Access Level (try Universal), add a description and a keyword, and press Upload.",
        path: "/filemanager/upload",
        verify: { kind: "created", entity: "File" }
      },
      {
        id: "fm-find",
        title: "Find a file with search and filters",
        body: "Open All Files and narrow the list down with the search box and the filters.",
        hint: "Open All Files, type part of a name into the search box, then use the filters for file type, category or access level to narrow the list further.",
        path: "/filemanager/files",
        verify: { kind: "self" }
      },
      {
        id: "fm-bulk",
        title: "Try a bulk import",
        body: "Add two or three files at once in Bulk Import and give them a category.",
        hint: "Open Bulk Import, drag in a couple of files, set a category for each row (or leave them to be sorted later), then press Upload.",
        path: "/filemanager/bulk",
        verify: { kind: "self" }
      }
    ]
  }
];