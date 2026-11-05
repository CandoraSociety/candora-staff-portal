// ── Food Services portal training ──────────────────────────────────────────
// Two modules: the working day inside the Food Services portal (social
// enterprises, food programs, sales, schedule, internal placements), and the
// client-facing catering portal whose bookings land in Catering.
// Steps point at the labels that are actually on the screens.

export const FOOD_SERVICES_MODULES = [
  {
    key: "food_services",
    title: "Food Services Portal",
    shortTitle: "Food Services",
    blurb: "The Food Services working day: Cafe Candeur, Catering, Auntie Bev's, Community Lunch and the Food Bank, with inventory, sales reports, the staff schedule and Pathways internal placements.",
    path: "/food",
    steps: [
      {
        title: "Welcome to Food Services",
        body: "Food Services runs Candora's social enterprises and food programs in one portal: Cafe Candeur, Catering, Auntie Bev's, Community Lunch and the Food Bank. Sales, the staff schedule and internal placements sit alongside them. You are in Training Mode, so every order, figure and placement you touch is simulated demo data — explore freely.",
        path: "/food"
      },
      {
        title: "The dashboard in four numbers",
        body: "Total Revenue is everything completed orders have brought in; Today's Revenue is the same for today only. Active Orders counts work not yet handed over, and Low Stock Items flags anything at or under its reorder level. Below them, the fourteen-day sales line and the revenue-by-category pie tell you where the money came from.",
        path: "/food",
        target: { text: "Total Revenue", scope: "main" }
      },
      {
        title: "Cafe Candeur — your own cafe",
        body: "Cafe Candeur is Candora's cafe: counter service, Monday to Friday, eight in the morning until four in the afternoon. It closes through May, June, July and August, so an empty summer week is normal rather than a mistake. Each area opens on its own set of tabs, and Cafe Candeur's are Overview, Menu, Orders, Recipes and Schedule.",
        path: "/food/cafe-candeur",
        target: { text: "Overview", scope: "main" }
      },
      {
        title: "Menu, orders and recipes, per area",
        body: "Every area keeps its own menu, its own orders and its own recipes — what Cafe Candeur sells is not what Auntie Bev's sells. Open Orders to see today's counter trade, and Recipes to keep the method and the costing for the things you make. Nothing is shared between areas unless you copy it across.",
        path: "/food/cafe-candeur/orders",
        target: { text: "Orders", scope: "main" }
      },
      {
        title: "Catering — quotes and bookings",
        body: "Catering holds the quotes and bookings that people send in through the public catering site. Each one carries the event date, the space, the menu chosen and the guest count. You price it, send it back, and the customer accepts or declines. Recent Bookings, the booking calendar, catering menu items, rental equipment and analytics all sit on this one page.",
        path: "/food/catering",
        target: { text: "Catering Overview", scope: "main" }
      },
      {
        title: "Auntie Bev's and Community Lunch",
        body: "Auntie Bev's is the second food counter, with the same tabs as the cafe. Community Lunch is the program side: a set meal on set days for the community, where the numbers that matter are how many plates went out rather than revenue. Both use the same menu, order and recipe tools you have just seen.",
        path: "/food/auntie-bevs",
        target: { text: "Overview", scope: "main" }
      },
      {
        title: "The Food Bank program",
        body: "The Food Bank has its home in the portal but its program is not set up yet — no distribution days, hampers or household records are tracked until it is. When it is ready, this is where its schedule, the households served and its stock and donations will live, next to the rest of the food programs.",
        path: "/food/food-bank",
        target: { text: "Food Bank", scope: "main" }
      },
      {
        title: "Inventory, menu and customers",
        body: "Inventory is the stockroom: quantities, reorder levels and the items already flagged low, which is where the dashboard warning comes from. Menu Items is the master list every area draws on, and Customers keeps the people and organizations who buy from you — the same records catering quotes are addressed to.",
        path: "/food/inventory",
        target: { text: "Inventory", scope: "main" }
      },
      {
        title: "Sales and revenue reports",
        body: "Sales & revenue is where the money is reconciled for Finance. Import a Square report for a date range and the portal reads the figures from the file: gross sales, discounts, refunds, tax and tips, with net sales as the revenue number. Once filed, the report is already visible in the Finance portal — you never enter it twice.",
        path: "/food/sales",
        target: { text: "Sales & revenue", scope: "main" }
      },
      {
        title: "The schedule for every area",
        body: "Schedule is one calendar for all of Food Services, filtered by area: cafe shifts, catering events, production, community lunch and food bank days. Use the area picker at the top to narrow it. Anything marked as an internal placement also shows here, so you can see who is on site and when before you build the week.",
        path: "/food/schedule"
      },
      {
        title: "Hours worked become timesheets",
        body: "Open the Cafe Candeur area in the schedule and each shift carries the hours for the people on it: clock-in, clock-out and any unpaid break. Adjust a row when someone came in early or stayed late, then submit the week. Each person's hours become a timesheet in the Finance portal, waiting for their supervisor's approval — that is how cafe work reaches payroll.",
        path: "/food/schedule?area=cafe-candeur"
      },
      {
        title: "Internal placements from Pathways",
        body: "Internal Placements is where Pathways referrals land: a career counsellor refers a client into Food Services, on site or off site, and the placement appears here with its start date, goals and assigned worker. You record the checkpoints — orientation, health and safety, the midpoint check-in and completion — and the final evaluation. What you record goes back to the Pathways worker on the client's file.",
        path: "/food/internal-placements"
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now import a sales report, schedule a cafe shift with hours on it, add a menu item and record a checkpoint on an internal placement — all on simulated data."
      }
    ],
    tasks: [
      {
        title: "File a sales report",
        body: "Open Sales & revenue, press Import report, choose an operation and a period, and save it. Then confirm it appears in the filed reports list.",
        hint: "Sales & revenue → Import report → enter the figures → Save.",
        path: "/food/sales",
        verify: { kind: "created", entity: "FoodSalesReport" }
      },
      {
        title: "Schedule a cafe shift with hours",
        body: "On the Cafe Candeur schedule, add a shift, pick a staff member, adjust their clock-in and clock-out, and save it.",
        hint: "Schedule → Cafe Candeur → Add Shift → tick a staff member → edit the hours.",
        path: "/food/schedule?area=cafe-candeur",
        verify: { kind: "created", entity: "FoodServiceSchedule" }
      },
      {
        title: "Add a menu item",
        body: "Open Menu Items and create one item with a name, category and price. Check it now appears in the list.",
        hint: "Menu → New item → fill in the name and price.",
        path: "/food/menu",
        verify: { kind: "created", entity: "MenuItem" }
      },
      {
        title: "Record a placement checkpoint",
        body: "Open an internal placement and tick orientation (or health and safety), then save. Look at how the checkpoint progress on the card changes.",
        hint: "Internal Placements → open a card → tick a checkpoint → Save.",
        path: "/food/internal-placements",
        verify: { kind: "self" }
      }
    ]
  },
  {
    key: "food_catering_portal",
    title: "Catering — Public Booking Portal",
    shortTitle: "Catering Portal",
    blurb: "The client-facing side of catering: what a customer sees when they browse the menu and spaces, and how their booking request becomes a quote in the Food Services portal.",
    path: "/food/catering-portal",
    steps: [
      {
        title: "The site a customer sees",
        body: "This is the public catering site — the client-facing side, with no sign-in and none of the staff portal around it. Someone booking an event sees Candora's spaces, its catering menu and a booking form, and nothing about the internal work behind them. You are seeing it inside training so you know exactly what they are looking at.",
        path: "/food/catering-portal"
      },
      {
        title: "The menu they browse",
        body: "The public menu lists catering items with their description and per-person price, grouped so a customer can build a spread. What you publish here is the same catering menu the portal uses for quotes, so an item removed from the menu is an item a customer can no longer order.",
        path: "/food/catering-portal/menu"
      },
      {
        title: "The spaces they can book",
        body: "The spaces page shows each room with its capacity, layout and what comes with it. This is what stops an enquiry for eighty people arriving for a room that seats forty — the limits are visible before anyone fills in the form.",
        path: "/food/catering-portal/spaces"
      },
      {
        title: "Starting a booking request",
        body: "The booking form opens with the type: an event held in a Candora space, or catering delivered off site. Then come the contact details — name, email, phone — and, for an in-house event, the guest count, which is checked against the room straight away.",
        path: "/food/catering-portal/book"
      },
      {
        title: "Date, space and menu",
        body: "The customer picks the date and the hours they need, chooses a space, then the menu and any extra services such as rental equipment. Each step has to be complete before they can move on, so what reaches you is a request you can actually price rather than one you have to chase.",
        path: "/food/catering-portal/book"
      },
      {
        title: "Review and submit",
        body: "The last step is a plain review of everything chosen: type, contact, date, room, menu and services. When they submit, the request is filed and they get a reference they can use later on the My Booking page to check its progress.",
        path: "/food/catering-portal/book"
      },
      {
        title: "Where the request lands",
        body: "Back in the Food Services portal, the request appears under Catering as a quote. You confirm availability, price it, and send it; the customer accepts or declines, and the accepted ones turn into the bookings on the calendar and the orders the kitchen works from. Nothing is confirmed to a customer until you send the quote.",
        path: "/food/catering",
        target: { text: "Catering Overview", scope: "main" }
      },
      {
        title: "Time to practice",
        body: "That's the public portal. Now walk a booking request through the form yourself, then find it in Catering and move its status — all on simulated data."
      }
    ],
    tasks: [
      {
        title: "Submit a practice booking",
        body: "Work through the public booking form end to end and submit it. Note the reference number you are given.",
        hint: "Catering portal → Book → complete each step → Submit.",
        path: "/food/catering-portal/book",
        verify: { kind: "self" }
      },
      {
        title: "Find it in Catering",
        body: "Open Catering in the portal and locate the request you just submitted. Look at the event date, the space and the guest count it carried across.",
        hint: "Food Services → Catering → Recent Bookings.",
        path: "/food/catering",
        verify: { kind: "self" }
      }
    ]
  }
];