// ── Reception (front desk) training module ─────────────────────────────────
// The front desk is the first person most visitors meet, so this module is
// written for someone using the portal a few times a day and needing the same
// three moves every time: find the appointment, sign the visitor in, and get
// them to the right person. Everything else — client visits, program
// registration, the resource finder — follows in the order a busy desk meets it.

export const RECEPTION_MODULES = [
  {
    key: "reception",
    title: "Reception (Front Desk)",
    shortTitle: "Reception",
    blurb: "The front desk end to end: appointments, drop-ins, client visits, program registration, the staff directory and resource finder, urgent alerts — and how simple mode trims it to three cards.",
    path: "/reception",
    steps: [
      {
        title: "Welcome to the front desk",
        body: "This is the Reception portal — the workspace the front desk runs on. It answers the questions visitors actually arrive with: who am I here to see, where do I go, can you sign me in, can you register me, and who can help me with this. Everything you record here lands on the client's file in the central client database, so no one has to write the same story twice. Training runs on simulated data, so try anything you like.",
        path: "/reception",
        target: { selector: 'a[href="/reception"]' }
      },
      {
        title: "Your dashboard at a glance",
        body: "The dashboard is the first screen of the day. The four cards count today's appointments and drop-ins, how many people are checked in right now, and how many program registrations are waiting for approval — each one is a shortcut into that list. Below them you get today's appointments and who's currently in the building, then the calendar, then the staff directory, resource finder and program registration cards. When the lobby is empty, this page tells you the desk is clear.",
        path: "/reception",
        target: { text: "Today's Appointments" }
      },
      {
        title: "Appointments — visitor and client",
        body: "Appointments is where the day's bookings live, split into two tabs: Visitor Appointments for outside guests and Client Appointments for people already in our programs. Both tabs have a search box and a status filter, so you can find a name quickly or just look at today's confirmed bookings. Click any row's pencil to change details, or check someone in straight from their row.",
        path: "/reception/appointments",
        target: { selector: 'a[href="/reception/appointments"]' }
      },
      {
        title: "Booking a visitor appointment",
        body: "When someone calls ahead, press New Visitor Appointment. Fill in the visitor's name and contact details, the date and time, and which staff member they're coming to see, plus the purpose of the visit — that purpose is what the staff member sees when they look at their day. Save it and the booking appears in the list as scheduled. If anything changes, open the same appointment and update it rather than creating a second one.",
        path: "/reception/appointments",
        target: { text: "New Visitor Appointment" }
      },
      {
        title: "Checking a visitor in",
        body: "When the visitor arrives, find their row and press Check In. That marks the appointment as attended, so the staff member knows their visitor is in the building, and the count on the dashboard reflects it. This is the moment that matters most at the desk: a booking nobody checked in looks like a no-show, and a visitor nobody told anyone about sits in the lobby waiting.",
        path: "/reception/appointments",
        target: { text: "Check In" }
      },
      {
        title: "Drop-ins and walk-ins",
        body: "Not everyone has an appointment. A walk-in is recorded as a drop-in: press New Drop-in, enter the person's name, the arrival time, who they're here to see and the purpose of their visit, then save. The list shows who has arrived, and when they leave press Check Out so the record shows how long they were here. The dashboard's checked-in count comes from exactly this list — so keep it honest as people come and go.",
        path: "/reception/dropins",
        target: { selector: 'a[href="/reception/dropins"]' }
      },
      {
        title: "Client Visit — one flow for every visit",
        body: "When the person at the desk is already our client, the Client Visit page is the tool. Search by name or phone and the client's central database file comes up — check the details against the person in front of you. If they're brand new, use Create Client Profile so the visit still has a file to attach to. Never guess at a name if a search comes back empty: a mis-typed file becomes two records for one person.",
        path: "/reception/client-visit",
        target: { selector: 'a[href="/reception/client-visit"]' }
      },
      {
        title: "Logging what actually happened",
        body: "With the client selected, choose the kind of visit. Grab and Go Resources records something handed over — bus tickets, a food hamper, other supports — and how much. Drop-In Casework and Scheduled Visit open the fuller casework form, where you record the service category, the services provided and what was discussed. Whichever you use, it's written straight into that client's service history, which is what the caseworkers and our funder reporting read later. Choose the closest category, and be specific in the notes.",
        path: "/reception/client-visit",
        target: { text: "Drop-In Casework" }
      },
      {
        title: "Program registration",
        body: "The desk is also where people sign up. Programs & Registration lists Candora's programs and their sessions, and you can register a person into one right here — the same records the Central Registration portal uses, so there's no second list to keep. The Program Calendar tab answers \"what's running today and where\" without leaving the page. If a program is full, the registration goes to its waitlist rather than being lost, and if a program takes self-registration by QR code, those requests land with Central Registration for approval.",
        path: "/reception/registration",
        target: { selector: 'a[href="/reception/registration"]' }
      },
      {
        title: "Staff Directory — who do they need to see",
        body: "Most conversations at this desk end with someone asking for a person. The Staff Directory holds Candora's staff with their department, extension and contact details, and the call buttons work straight from the page — so you can connect the visitor with the right person instead of walking the building. The program roles listed under each name tell you who to route a program question to.",
        path: "/reception/staff",
        target: { selector: 'a[href="/reception/staff"]' }
      },
      {
        title: "Resource Finder — help beyond our own programs",
        body: "Sometimes the answer isn't one of our programs. Resource Finder collects the outside supports — food, housing, childcare, legal help, counselling — and you can describe the situation in plain words (\"a single mother needs help with food and childcare\") to get matching organizations. Search the list, narrow it by category or type, then hand over the contact details. Add Resource keeps the directory growing as you learn about new services.",
        path: "/reception/resources",
        target: { selector: 'a[href="/reception/resources"]' }
      },
      {
        title: "Urgent alerts",
        body: "Rarely, but importantly: something happens at the desk that a manager needs to know about now. Press Urgent Alert, give it a clear title and message, set the urgency, and choose who receives it — all managers, all staff, a department, or named people. Saving records the alert and emails everyone you selected straight away. Write it the way you'd want to read it on a phone: what happened, where, and who's involved.",
        path: "/reception/urgent",
        target: { selector: 'a[href="/reception/urgent"]' }
      },
      {
        title: "Simple mode for the front desk",
        body: "If the full portal feels like too much on a busy shift, turn Simple mode on with the switch in the Reception header. The dashboard becomes three big cards — Appointments, Drop-Ins and Program Registration — and the top menu shrinks to those same three, with nothing to read through first. It only changes your own view, so a supervisor can keep the full dashboard while the desk uses the simple one. Flip the switch off whenever you need more.",
        path: "/reception",
        target: { selector: '[data-tour="reception-simple-mode"]' }
      },
      {
        title: "Time to practice",
        body: "That's the tour. The practice checklist has four short tasks that mirror a real shift: book and check in an appointment, sign a drop-in in and out, log a client visit, and register someone for a program. You're in Training Mode, so no real visitor, client or registration is created."
      }
    ],
    tasks: [
      {
        id: "rec-appt",
        title: "Book and check in a visitor appointment",
        body: "Create a visitor appointment for any time today, then check it in from the list.",
        hint: "Open Appointments, press New Visitor Appointment, fill in a name, the date and time and the staff member they're seeing, and save. Then press Check In on the row you just created.",
        path: "/reception/appointments",
        verify: { kind: "created", entity: "ReceptionAppointment" }
      },
      {
        id: "rec-dropin",
        title: "Sign a drop-in in and back out",
        body: "Record a walk-in as a drop-in, then check them out again when they leave.",
        hint: "Open Drop-ins, press New Drop-in, enter the visitor's name, arrival time and who they're here to see, and save. Then press Check Out on that row.",
        path: "/reception/dropins",
        verify: { kind: "created", entity: "DropInVisit" }
      },
      {
        id: "rec-visit",
        title: "Log a client visit",
        body: "Find a demo client in Client Visit and record a visit — a Grab and Go resource, or a drop-in casework visit.",
        hint: "Open Client Visit, search for a demo client and select them, then choose Grab and Go Resources (pick a resource and quantity) or Drop-In Casework (pick the service category, services and notes) and press Submit.",
        path: "/reception/client-visit",
        verify: { kind: "created", entity: "RCClientVisit" }
      },
      {
        id: "rec-register",
        title: "Register someone for a program",
        body: "Register a demo participant into any program session from the front desk.",
        hint: "Open Program Registration, find a program under Programs & Registration, and register a participant into one of its sessions. If it's full, the registration lands on the waitlist — that's correct too.",
        path: "/reception/registration",
        verify: { kind: "created", entity: "ProgramRegistration" }
      }
    ]
  }
];