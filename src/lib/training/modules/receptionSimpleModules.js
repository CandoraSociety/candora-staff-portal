// ── Reception Simple Mode training module ─────────────────────────────────
// The front desk on a busy shift. Simple mode strips the Reception portal down
// to four big cards, four nav links and the Urgent Alert button, so this module
// is short and it is written for a person who has a visitor standing in front
// of them while they learn. Every save still lands on the central client file.

export const RECEPTION_SIMPLE_MODULES = [
  {
    key: "reception_simple",
    title: "Reception (Simple Mode)",
    shortTitle: "Simple Mode",
    blurb: "The stripped-back front desk: four cards, four tabs and one urgent alert button. Turn it on, work a shift through Appointments, Drop-Ins, Program Registration and Resource Finder, and see exactly what it leaves out.",
    path: "/reception",
    steps: [
      {
        title: "One portal, turned down",
        body: "This module covers Simple mode: the same front desk portal with the noise taken out. Turn it on and the Reception page becomes four big cards, the top menu becomes four links, and nothing else asks for your attention. It is a view setting, not a different system. The same appointments, drop-ins, registrations and resources sit underneath it, and everything you save still lands on the client's file in the central client database.",
        path: "/reception",
        target: { selector: 'a[href="/reception"]' }
      },
      {
        title: "Turn Simple mode on",
        body: "Turn Simple mode on with the switch in the Reception header. It saves to your own account the moment you flip it, so your screen changes and your supervisor's does not. If it is already on, leave it on for the rest of this tour, because every step from here shows the simple layout. Flip it off the same way whenever a task needs the fuller portal back.",
        path: "/reception",
        target: { selector: '[data-tour="reception-simple-mode"]' }
      },
      {
        title: "Watch the introduction",
        body: "Press Play to hear the introduction. You can pause, replay or move between scenes; each scene stays on screen until its narration finishes. When you're ready, press Next below to continue training.",
        introExplainer: true
      },
      {
        title: "Four cards, no reading",
        body: "Four cards, one question each. Appointments is for someone who called ahead. Drop-Ins is for someone standing in front of you. Program Registration signs a person up for a program. Resource Finder helps when the answer sits outside Candora. Read the small line under each name, pick the card that matches the question in front of you, do the work on that page, and come back here. There are no lists or counts on this page in Simple mode, and that is on purpose: less to scan means fewer wrong clicks at a busy desk.",
        path: "/reception",
        target: { text: "Find, book and check in a visitor" }
      },
      {
        title: "The urgent button stays put",
        body: "The Urgent Alert button stays on this page, top right, in Simple mode and in the full portal. It is the one thing that should never take three clicks to find. Press it, give the alert a title and a message, choose the urgency level, and choose who receives it: all managers, all staff, a department, or named people. Saving emails everyone you picked straight away, so write what happened, where, and who is involved, the way you would want to read it on your phone.",
        path: "/reception",
        target: { text: "Urgent Alert" }
      },
      {
        title: "Appointments — booking the visitor",
        body: "Appointments keeps the same two lists as the full portal: Visitor Appointments for outside guests and Client Appointments for people already in our programs. Search by name, or filter by status to see just today's confirmed bookings. When someone calls to book, press New Visitor Appointment and record the visitor's name and contact details, the date and time, the staff member they are coming to see, and the purpose of the visit. That purpose is what the staff member reads when they look at their day.",
        path: "/reception/appointments",
        target: { text: "New Visitor Appointment" }
      },
      {
        title: "The moment that matters: Check In",
        body: "When the visitor arrives, find their row and press Check In. That marks the appointment as attended, so the staff member knows their visitor is in the building, and the counts on the full dashboard follow. This is the step the desk most often misses: a booking nobody checked in reads as a no-show, and a visitor nobody told anyone about sits in the lobby waiting. If the details are wrong, use the pencil on the row rather than creating a second appointment.",
        path: "/reception/appointments",
        target: { text: "Check In" }
      },
      {
        title: "Drop-Ins — in and back out",
        body: "A walk-in is a drop-in. Press New Drop-in, enter the visitor's name, their arrival time, who they are here to see and the purpose of the visit, then save. When they leave, press Check Out on the same row so the record shows how long they were here. This list is where the checked-in count comes from, so keep it honest as people come and go through the shift.",
        path: "/reception/dropins",
        target: { text: "New Drop-in" }
      },
      {
        title: "Program Registration, same records",
        body: "Program Registration is where people sign up, and in Simple mode it is one card away from the home page. Programs and Registration lists Candora's programs and their sessions, and you can register a person into a session from here. These are the same records the Central Registration portal uses, so there is no second list to keep and nobody to notify afterwards. If a session is full, the registration goes to its waitlist instead of being lost, so tell the person where they stand rather than turning them away.",
        path: "/reception/registration",
        target: { selector: 'a[href="/reception/registration"]' }
      },
      {
        title: "Resource Finder — the fourth card",
        body: "Resource Finder answers the questions our own programs cannot. The AI search takes the situation in plain words, for example a single mother who needs help with food and childcare, and returns matching services across the Edmonton metro area next to the matches in Candora's own directory. Use the search box and the category filters when you already know the name, and press Add Resource when you learn about a service the desk did not have. Hand over the phone number, address or website while the person is still standing there.",
        path: "/reception/resources",
        target: { text: "AI-Powered Search" }
      },
      {
        title: "What simple mode leaves out",
        body: "Simple mode hides the rest of the portal, it does not take your access away. Client Visit, the Staff Directory, the Urgent Alerts list and the Resource Finder page are all still in the full portal, and flipping the switch off, or opening one of those addresses, gets you straight back to them. What changes is that the cards and the top menu on this page stop asking you to choose. Use Simple mode for ordinary shifts and switch it off when a task needs the fuller tools.",
        path: "/reception"
      },
      {
        title: "Time to practice",
        body: "That's the tour. The practice checklist has four short tasks that mirror a simple-mode shift: turn the switch on and work from the cards, book and check in a visitor, sign a walk-in in and back out, and find an outside resource for a real need. You're in Training Mode, so no real visitor, client or registration is created."
      }
    ],
    tasks: [
      {
        id: "rs-simple",
        title: "Turn Simple mode on and work from the cards",
        body: "Flip Simple mode on, then open two of the four cards from the home page.",
        hint: "Use the Simple mode switch in the Reception header. The page should become four large cards — Appointments, Drop-Ins, Program Registration and Resource Finder — with no lists or counts. Then open any two of them.",
        path: "/reception",
        verify: { kind: "self" }
      },
      {
        id: "rs-appt",
        title: "Book a visitor and check them in",
        body: "Create a visitor appointment, then check it in from the list.",
        hint: "Open Appointments, press New Visitor Appointment, fill in a name, the date and time and the staff member they are seeing, and save. Then press Check In on the row you just made.",
        path: "/reception/appointments",
        verify: { kind: "created", entity: "ReceptionAppointment" }
      },
      {
        id: "rs-dropin",
        title: "Sign a walk-in in and back out",
        body: "Record a walk-in as a drop-in, then check them out when they leave.",
        hint: "Open Drop-Ins, press New Drop-in, enter the visitor's name, arrival time and who they are here to see, and save. Then press Check Out on that row.",
        path: "/reception/dropins",
        verify: { kind: "created", entity: "DropInVisit" }
      },
      {
        id: "rs-resource",
        title: "Find an outside resource for a need",
        body: "Use Resource Finder to answer a need our own programs cannot meet.",
        hint: "Open Resource Finder, describe a situation in plain words in the AI search — for example a parent who needs food and childcare — and read the results. Note the contact details you would hand over.",
        path: "/reception/resources",
        verify: { kind: "self" }
      }
    ]
  }
];