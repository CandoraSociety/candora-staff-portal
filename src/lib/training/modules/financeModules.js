// ── Finance portal training ───────────────────────────────────────────────
// Two modules: the working day (payroll, claims, MasterCard, invoices) and the
// planning side (Pathways payables, cash flow, budgets, food services).
// Steps point at the labels that are actually on the screens.

export const FINANCE_MODULES = [
  {
    key: "finance",
    title: "Finance Portal",
    shortTitle: "Finance",
    blurb: "The working day in Finance: payroll from timesheets, reviewing staff expense claims and MasterCard receipts, generating invoices, and e-signatures.",
    path: "/finance",
    steps: [
      {
        title: "Welcome to the Finance portal",
        body: "Finance is the money side of the Candora staff portal: payroll, the payables that come out of Pathways, staff expense claims, the organization's MasterCard, invoices, cash flow and food-services revenue. Everything you process here arrives from another portal — nothing starts in Finance. You are in Training Mode, so every figure you touch is simulated.",
        path: "/finance"
      },
      {
        title: "The dashboard in two numbers",
        body: "Outstanding Payables is the total of unpaid financial records, with the count of records behind it; Active Staff is how many people are on payroll. Below those, the three cards are the way in: Payroll, Pathways and Food Services.",
        path: "/finance",
        target: { text: "Outstanding Payables", scope: "main" }
      },
      {
        title: "Payroll — five tabs",
        body: "Payroll gathers the pay period: Timesheet Submissions, Vacation Requests, Sick Time, Benefits and Staff Listing. Timesheets and vacation are live records the staff app feeds; Sick Time and Benefits are still being built, so do not expect data there yet.",
        path: "/finance/payroll",
        target: { text: "Timesheet Submissions", scope: "main" }
      },
      {
        title: "Timesheet submissions",
        body: "Each row is one staff member's submission for a pay period: their regular hours, any vacation, sick or personal hours filled in from approved time off, and any additional hours. What you approve here is what payroll runs on — a submission sitting unanswered is a paycheque that is late.",
        path: "/finance/payroll",
        target: { text: "Timesheet Submissions", scope: "main" }
      },
      {
        title: "Vacation requests and the staff listing",
        body: "Vacation Requests shows approved time off as it affects pay, so you can see who is being paid for leave rather than hours. Staff Listing is the payroll-side view of every employee with their wage and grade — use it to confirm a rate before you process anything that depends on it.",
        path: "/finance/payroll",
        target: { text: "Vacation Requests", scope: "main" }
      },
      {
        title: "Expense claims arrive as submissions",
        body: "Staff Reimbursements lists each claim a supervisor has approved, with the receipts inside it. The status moves in one direction: Pending, Processing, Approved, Paid — and Rejected when something is wrong, with a reason that goes back to the staff member. Processing locks the claim so they can no longer edit it while you work on it.",
        path: "/finance/reimbursements",
        target: { text: "Pending", scope: "main" }
      },
      {
        title: "Approving and paying",
        body: "Approve signs the claim off with your e-signature. Pay locks it as Processing and opens Scotiabank so the transfer can be made, then you confirm it as paid in the portal. Reverse paid status sends a claim back to Processing if something was marked paid in error — the status has to match what actually left the bank.",
        path: "/finance/reimbursements",
        target: { text: "Pending", scope: "main" }
      },
      {
        title: "The Candora MasterCard",
        body: "The MasterCard page has two halves. At the top, each monthly statement lists its line items — attach the matching receipt to a line and mark the statement complete once nothing is missing. Below it, the same review list in card mode: what staff submitted for their card purchases, reconciled against those statement lines. A receipt nobody attached is what holds up a month.",
        path: "/finance/mastercard"
      },
      {
        title: "Invoice Generator — two directions",
        body: "Invoices to Customers are invoices people owe Candora. On-Behalf Vendor Invoices are the ones Candora issues for a service provider who does not invoice for themselves, such as a musician hired for an event — that is our payables side. Both live in the same list with the same statuses: Draft, To Be Sent, Sent / Issued, Paid and Void.",
        path: "/finance/invoice-generator",
        target: { text: "Invoices to Customers", scope: "main" }
      },
      {
        title: "Moving an invoice through its life",
        body: "An invoice starts as a draft while you build it. Mark it as sent when it actually goes out — for a receivable that means it reached the customer, for a vendor invoice it means it was submitted for payment. Paid closes it, and Void is for one issued in error. The statuses are the record of what happened, so only move one when it did.",
        path: "/finance/invoice-generator",
        target: { text: "Invoices to Customers", scope: "main" }
      },
      {
        title: "E-signatures on file",
        body: "E-Signatures is your verification log: every signature you have applied in the portal, with what it was for. It is the audit trail — if someone asks who approved a claim or a timesheet and when, the answer is here and on the document itself.",
        path: "/finance/e-signatures",
        target: { text: "Verification Log", scope: "main" }
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now review a pending expense claim, look at a MasterCard statement, create a draft invoice and mark it sent — all on simulated data."
      }
    ],
    tasks: [
      {
        id: "fin-claim",
        title: "Review a staff expense claim",
        body: "Open a pending claim, look at its entries and receipts, and move it to Processing.",
        hint: "Open Expense Claims → Staff Reimbursements, find a Pending row and use the processing action. Approving asks for your e-signature.",
        path: "/finance/reimbursements",
        verify: { kind: "self" }
      },
      {
        id: "fin-statement",
        title: "Reconcile a MasterCard statement",
        body: "Open a card statement, check its line items, and mark the statement complete.",
        hint: "Open Expense Claims → Candora MasterCard, view a statement, attach any missing receipts and use the complete action.",
        path: "/finance/mastercard",
        verify: { kind: "self" }
      },
      {
        id: "fin-invoice",
        title: "Create an invoice and send it",
        body: "Draft an invoice to a customer, then mark it as sent.",
        hint: "Open Invoice Generator, choose Invoices to Customers, create the invoice, save it as a draft, then use the mark-as-sent action on its row.",
        path: "/finance/invoice-generator",
        verify: { kind: "created", entity: "FinanceInvoice" }
      }
    ]
  },
  {
    key: "finance_planning",
    title: "Finance — Payables & Planning",
    shortTitle: "Finance Planning",
    blurb: "Where the money goes and what comes next: Pathways payables and invoice packages, the cash flow projection, budgets, and food-services revenue.",
    path: "/finance/pathways",
    steps: [
      {
        title: "The planning side of Finance",
        body: "This module covers the money that flows out through Pathways, the cash flow projection, budgets and food services. These pages do not create the numbers — they read what other portals record and turn it into a payment or a forecast.",
        path: "/finance/pathways"
      },
      {
        title: "Pathways payables — four tabs",
        body: "Pathways holds the payables that originate in the Pathways portal: Work Exposure Payments to employers, Employment Supports, Exposure Courses, and Invoices. Marking a record paid here also marks it paid in Pathways Billing — one payment, recorded once and visible in both places.",
        path: "/finance/pathways",
        target: { text: "Work Exposure Payments", scope: "main" }
      },
      {
        title: "Work exposure and employment supports",
        body: "Work Exposure Payments are what an employer is owed for hosting a client's placement, calculated from the hours the placement recorded. Employment Supports are the smaller purchases — safety boots, a bus pass, a licence fee. In both cases the amount comes from the placement or the purchase request, not from Finance typing a figure.",
        path: "/finance/pathways",
        target: { text: "Employment Supports", scope: "main" }
      },
      {
        title: "Invoice packages",
        body: "Under Invoices you see the monthly packages Pathways has prepared and approved. Finance only sees packages that have reached approved or paid — anything earlier is still being assembled in Pathways Billing. Open a package to read what is inside it and to view the invoice it produces.",
        path: "/finance/pathways",
        target: { text: "Invoices", scope: "main" }
      },
      {
        title: "Cash Flow Projection",
        body: "Cash Flow opens with three numbers that matter: opening cash, projected ending cash, and the lowest projected balance with the date it lands on. That lowest point is the one to watch — an ending figure that looks healthy can hide a squeeze in the middle of the period.",
        path: "/finance/cash-flow",
        target: { text: "Overview", scope: "main" }
      },
      {
        title: "Assumptions and scenarios",
        body: "A projection is only as good as its assumptions. The Assumptions tab is where the inflows and outflows you expect are listed and edited, and Scenarios lets you test a version — a delayed grant, a new hire — without touching the base case. Change an assumption and the projection recalculates, so the forecast is a working document rather than a saved guess.",
        path: "/finance/cash-flow",
        target: { text: "Scenarios", scope: "main" }
      },
      {
        title: "Budgets",
        body: "Budgets is not built yet — the page is a placeholder. When it is finished it will hold the organization's budget lines and compare them with actual spending. Until then, the cash flow projection is the planning tool, and spending is checked against the records on the Pathways and payroll pages.",
        path: "/finance/budgets",
        target: { text: "Coming soon", scope: "main" }
      },
      {
        title: "Food services",
        body: "Food Services reads the four operations — Café Candeur, Auntie Bev's, Catering and Community Lunch. Revenue arrives as the Square reports the food team files for each operation in the Food Services portal, so what you read here is the same report they recorded, not a figure Finance types in. Expenses are the half still missing: capturing food cost, wages and supplies so each operation shows a real net profit is something we want to do, and it is not built yet — until it is, read these figures as revenue rather than profit.",
        path: "/finance/food",
        target: { text: "Café Candeur", scope: "main" }
      },
      {
        title: "Where these numbers come from",
        body: "Every figure in this module originates somewhere else: hours from Childminding and work exposure, purchases from Pathways purchase requests, orders from the food portal, invoices from billing. If a number looks wrong, the fix belongs at the source — correcting it here would leave the two records disagreeing.",
        path: "/finance/pathways"
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now open a Pathways payables tab, read a month of cash flow, change one assumption and see the projection move, then open the food services page — all on simulated data."
      }
    ],
    tasks: [
      {
        id: "fin-we",
        title: "Read the work exposure payments",
        body: "Open the Work Exposure Payments tab and find what an employer is owed this month.",
        hint: "Open Pathways, then the Work Exposure Payments tab — each row is a placement with its hours and amount.",
        path: "/finance/pathways",
        verify: { kind: "self" }
      },
      {
        id: "fin-package",
        title: "Open an invoice package",
        body: "Open an approved package and read the contents before viewing its invoice.",
        hint: "On the Pathways page, open the Invoices tab, expand a package and use its view action to see the invoice.",
        path: "/finance/pathways",
        verify: { kind: "self" }
      },
      {
        id: "fin-cashflow",
        title: "Change an assumption",
        body: "Adjust one assumption in the cash flow projection and watch the projected ending cash change.",
        hint: "Open Cash Flow, go to the Assumptions tab, edit an inflow or outflow amount, then check Overview for the recalculated figures.",
        path: "/finance/cash-flow",
        verify: { kind: "self" }
      }
    ]
  }
];