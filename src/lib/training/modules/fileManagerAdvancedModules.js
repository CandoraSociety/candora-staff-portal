// ── Advanced File Manager training module ──────────────────────────────────
// The first File Manager module is written for the staff member who only meets
// the vault through a portal upload card. This one is for the people who keep
// it in order: full-vault search, the sorting queue, collections, the personal
// workspace, the editor and notes. Same tour mechanics, deeper tools.

export const FILE_MANAGER_ADVANCED_MODULES = [
  {
    key: "filemanager_advanced",
    title: "File Manager — Advanced",
    shortTitle: "Advanced Files",
    blurb: "For the people who keep the vault in order: full-vault search, the sorting queue, collections, your workspace, the editor and notes.",
    path: "/filemanager",
    steps: [
      {
        title: "Beyond the basics",
        body: "This second File Manager module is for whoever keeps the vault in order — administrative staff, finance, HR, and anyone who files on behalf of a team. The first module covered finding one file and uploading it properly. This one covers the tools that do the heavy lifting: searching the whole vault, clearing the sorting queue, building collections, using your workspace, annotating in the editor, and keeping notes with the work. Everything here runs on simulated demo files, so nothing you touch is real.",
        path: "/filemanager",
        target: { selector: '[data-tour="fm-stats"]' }
      },
      {
        title: "Search the whole vault",
        body: "Search is the tool for the file you only half remember. Unlike the box on All Files, it searches every field you fill in when filing: the display name, the original file name, the description, the summary and the keywords. Type a person, a supplier, a month, or a phrase you remember from inside the document, then narrow the results by category or access level. It only ever returns files you are allowed to open, so a short result list usually means permissions, not a missing file.",
        path: "/filemanager/search",
        target: { selector: '[data-tour="fm-search"]' }
      },
      {
        title: "Clearing the sorting queue",
        body: "Files that arrive without a category — a receipt photographed at the counter, a bulk import you didn't have time to sort — wait in this amber banner. Clicking it opens the sorting queue, which takes the files one at a time: read the name, pick a category, save, and it moves straight to the next. That is the fastest way through a backlog, and the banner clears itself once the queue is empty. A tidy queue is what keeps the category filters and the dashboard breakdown worth trusting.",
        path: "/filemanager",
        target: { selector: '[data-tour="fm-sorting"]', additionalSelectors: ['[data-tour="fm-stats"]'] }
      },
      {
        title: "Collections — handing over a package",
        body: "A collection gathers existing files into one set for a single purpose: a grant application with all of its attachments, an audit with every supporting receipt, a package for a new board member. You create the collection, add files from the vault, and the whole set opens together when someone needs it. Nothing is copied or moved — the files stay exactly where they are filed — and deleting a collection afterwards never deletes the files inside it.",
        path: "/filemanager/collections",
        target: { selector: '[data-tour="fm-collections"]' }
      },
      {
        title: "My Workspace — the desk you're working at",
        body: "Your workspace is the surface between the vault and the job in front of you. Group files by the piece of work they belong to — a board meeting, a funding deadline, a hire — and pin files from anywhere in the vault into those groups without moving them. It belongs to you alone: nobody else works from your groups, and what you pin here stays available when the meeting is over.",
        path: "/filemanager/workspace",
        target: { selector: '[data-tour="fm-workspace"]' }
      },
      {
        title: "The File Editor",
        body: "The editor is where you mark up a document instead of printing it. Open a PDF or an image, then draw, highlight, add text or stamp your saved signature on it, and save the result into the vault as a new file — the original stays untouched. It is the quickest way to sign a form, mark up a proof, or circle the one line someone actually needs to read.",
        path: "/filemanager/editor",
        target: { selector: '[data-tour="fm-editor"]' }
      },
      {
        title: "Notes that stay with the work",
        body: "Notes carry the context a file can't hold on its own: why a contract was amended, who asked for the invoice, what still needs doing before it goes out. They live in the notes list, searchable, instead of scattered across email threads. The floating note button follows you through the portal, so a thought can be written down the moment it arrives and attached to the work later.",
        path: "/filemanager/notes",
        target: { selector: '[data-tour="fm-notes"]' }
      },
      {
        title: "Working a file from the list",
        body: "Every card in All Files puts four actions within reach: open the file, download it, share a link, or edit its details. Sharing copies a viewer link — and the link is not a way around permissions: whoever opens it still needs the right access level, so a finance file shared with the wrong person simply won't open. Editing details covers the one field still changeable after upload, which is the category, so a misfiled document can be rescued without re-uploading it.",
        path: "/filemanager/files",
        target: { selector: '[data-tour="fm-grid"]' }
      },
      {
        title: "Folders, portal tabs and permissions",
        body: "Each portal has its own folder, and the file tabs in this sidebar mirror the portals you can access, so you can jump straight to Pathways or Finance files instead of scrolling the whole vault. Anything uploaded from a portal dashboard files itself into that portal's folder. Creating, renaming and securing those folders is admin work, done in Users and Access — so if a folder needs to exist or change, that is where it happens.",
        path: "/filemanager/files",
        target: { selector: '[data-tour="fm-portal-folders"]' }
      },
      {
        title: "Time to practice",
        body: "That's the advanced tour. The practice checklist has three tasks: find a file with a keyword on the search page, build a small collection from files in the vault, and clear a file out of the sorting queue. Between them you've used the four tools that keep a vault usable at scale."
      }
    ],
    tasks: [
      {
        id: "fm-adv-search",
        title: "Find a file with the search page",
        body: "Open Search and find a file using a word from its description, summary or keywords rather than its name.",
        hint: "Open Search in the File Manager sidebar, type a supplier, a person or a phrase you'd expect inside a document, then narrow the results with the category or access filters.",
        path: "/filemanager/search",
        verify: { kind: "self" }
      },
      {
        id: "fm-adv-collection",
        title: "Build a collection",
        body: "Create a collection and add at least two files to it.",
        hint: "Open Collections, press New Collection, give it a name, then add files from the vault into it.",
        path: "/filemanager/collections",
        verify: { kind: "created", entity: "Collection" }
      },
      {
        id: "fm-adv-sort",
        title: "Clear a file out of the sorting queue",
        body: "Open the sorting banner on the File Manager dashboard and give a pending file its category.",
        hint: "Open the File Manager dashboard, click the amber sorting banner, choose a category for the file it shows and save — the queue moves to the next file.",
        path: "/filemanager",
        verify: { kind: "self" }
      }
    ]
  }
];