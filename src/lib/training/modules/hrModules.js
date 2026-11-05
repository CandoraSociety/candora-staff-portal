// ── HR Management portal training ─────────────────────────────────────────
// The people side of the staff portal: every employee file, the reviews,
// incidents and training records that hang off it, and the records HR keeps
// for compliance and pay. Steps point at labels that are on the screens.

export const HR_MODULES = [
  {
    key: "hr_management",
    title: "HR Management",
    shortTitle: "HR Management",
    blurb: "The people side of the portal: employee files, performance reviews, incidents, training records, timesheets, recognition and onboarding.",
    path: "/nexushr",
    steps: [
      {
        title: "Welcome to HR Management",
        body: "The HR Management portal is where Candora keeps its employee records: one file per person, with their reviews, incidents, training, documents and pay details gathered around it. It is a staff-only portal, so you will only see it if your access includes it. You are in Training Mode for this whole module, which means every employee you open and every record you create is simulated.",
        path: "/nexushr"
      },
      {
        title: "The dashboard answers four questions",
        body: "The four cards are the whole picture at a glance: how many employees are active, how many incidents are open or under investigation, how many performance reviews are still drafts, and how many employee records exist in total. Every card is a link — press it and you land on the list behind the number.",
        path: "/nexushr",
        target: { text: "Active Employees", scope: "main" }
      },
      {
        title: "Below the counts",
        body: "Recent Incidents and Recent Reviews sit under the cards, newest first, each with its status badge — so the things that need attention are visible without opening a single page. The upload card at the top files a document straight into the HR folder in the vault, which is where contracts and letters belong.",
        path: "/nexushr",
        target: { text: "Recent Incidents", scope: "main" }
      },
      {
        title: "Employees is the master list",
        body: "Every person who works at Candora is here: active, on leave, concluded. The search box filters as you type, and Add Employee creates the record — the personal details, the address, the emergency contact, the pay grade and salary, the probation end date. A new hire always starts here, because everything else in this portal hangs off the employee record.",
        path: "/nexushr/employees",
        target: { text: "Employees", scope: "main" }
      },
      {
        title: "Reports To is the field that runs the staff app",
        body: "In the employee form, Reports To decides who approves that person's timesheets, time off and expense claims. Get it wrong and their requests go to the wrong supervisor or nowhere at all. Set it when the person is created, and keep it current through any restructuring.",
        path: "/nexushr/employees",
        target: { text: "Employees", scope: "main" }
      },
      {
        title: "The employee's email links them to the staff app",
        body: "The email on the employee record is what ties a person's file to the account they sign in with — which is how their training, their timesheets and their approvals find them. If someone can sign in but sees an empty or confusing dashboard, check that their employee record carries the same email, and that they have been invited to the app.",
        path: "/nexushr/employees"
      },
      {
        title: "Inside an employee's file",
        body: "Clicking a row opens that person's file. The tabs across the top are Overview, Performance, Documents and Access. Overview gathers personal details, pay grade, salary, emergency contact and probation, plus their recent time logs, recognitions and any upcoming service milestones. Performance lists their reviews, Documents holds their letters and certificates, and Access shows which portal permissions are allowed or denied.",
        path: "/nexushr/employees"
      },
      {
        title: "Editing and status changes",
        body: "From the top of the file, Edit reopens the employee form, Status moves the person between active, on leave and concluded, and Welcome Msg sends them the welcome text with their sign-in details. Delete is only for a record created by mistake — someone who has left the organization keeps their record and gets a concluded status, because their history belongs in the portal.",
        path: "/nexushr/employees"
      },
      {
        title: "Performance reviews",
        body: "Performance Reviews holds every review with the employee, the review period, the rating and a status. Unfinished reviews sit as drafts — that is the number on the dashboard — and a completed review is what shows on the employee's Performance tab. Write the review against the period, not the person's whole history, so each one is a fair snapshot.",
        path: "/nexushr/reviews",
        target: { text: "Performance Reviews", scope: "main" }
      },
      {
        title: "Incident reports",
        body: "Anything that needs a record — a safety event, a conduct issue, an injury — goes here: who was involved, what happened, the type and the status. An incident stays open or under investigation until it is resolved, and the resolution is recorded against it, so the file tells the whole story rather than half of it.",
        path: "/nexushr/incidents",
        target: { text: "Incident Reports", scope: "main" }
      },
      {
        title: "Training and certifications",
        body: "Training & Certifications tracks the courses and certificates each employee holds, with the dates that matter for expiry. This is the record you check before assigning someone to work that requires a current certificate — and the one a funder or auditor asks to see.",
        path: "/nexushr/training",
        target: { text: "Training & Certifications", scope: "main" }
      },
      {
        title: "Timesheets from the HR side",
        body: "Timesheets lists staff submissions in three groups: Pending Approval, Approved and Rejected. It reads the same records the staff member submitted and Finance reads for payroll — approving here and approving from a dashboard banner are the same decision, so never do both.",
        path: "/nexushr/timesheets",
        target: { text: "Pending Approval", scope: "main" }
      },
      {
        title: "Recognition and Email Employees",
        body: "Recognition records the moments worth marking — who was recognized, by whom, and for what — and each one appears on that person's employee file. Email Employees sends a message to the staff you select from the list, so a short notice reaches exactly the people it concerns instead of everyone.",
        path: "/nexushr/recognition",
        target: { text: "Recognition", scope: "main" }
      },
      {
        title: "Service awards",
        body: "Service Awards tracks the milestones: Upcoming Milestones lists who is approaching a year count, and Acknowledged / Presented keeps what has already been marked. It is the record behind the award, so update it when the milestone is actually marked.",
        path: "/nexushr/service-awards",
        target: { text: "Upcoming Milestones", scope: "main" }
      },
      {
        title: "Onboarding",
        body: "Onboarding Manager has three tabs. Templates are the steps a new hire works through — acknowledge a policy, read a document, complete a form — and each can be required. Employee Tracker shows how far each new employee has got. NDA Signatures holds the confidentiality agreements staff have signed, which is the first thing a new hire completes.",
        path: "/nexushr/onboarding",
        target: { text: "Onboarding Manager", scope: "main" }
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now open an employee's file, create a performance review, log an incident and record a recognition — all on simulated data."
      }
    ],
    tasks: [
      {
        id: "hr-emp-open",
        title: "Open an employee's full file",
        body: "Search for an employee, open their file and click through the Overview, Performance, Documents and Access tabs.",
        hint: "Open Employees, type a name in the search box, then click the row — the tabs are across the top of the file.",
        path: "/nexushr/employees",
        verify: { kind: "self" }
      },
      {
        id: "hr-review",
        title: "Create a performance review",
        body: "Write a review for a demo employee covering a review period, with a rating.",
        hint: "Open Performance Reviews, create a new review, choose the employee and the period, add the rating and save.",
        path: "/nexushr/reviews",
        verify: { kind: "created", entity: "PerformanceReview" }
      },
      {
        id: "hr-incident",
        title: "Log an incident report",
        body: "Record an incident with the employees involved, the type and a description.",
        hint: "Open Incident Reports, create one, pick the employees involved and the incident type, describe what happened and save.",
        path: "/nexushr/incidents",
        verify: { kind: "created", entity: "IncidentReport" }
      },
      {
        id: "hr-recognition",
        title: "Recognize a staff member",
        body: "Record a recognition for someone on the team.",
        hint: "Open Recognition, create an entry for an employee with the reason, and save — it appears on their employee file.",
        path: "/nexushr/recognition",
        verify: { kind: "created", entity: "EmployeeRecognition" }
      }
    ]
  },
  {
    key: "hr_records",
    title: "HR Records, Pay & Compliance",
    shortTitle: "HR Records",
    blurb: "The record-keeping side of HR: contracts, corrective actions, pay grades, career and succession planning, legal cases and employee documents.",
    path: "/nexushr/contracts",
    steps: [
      {
        title: "The record-keeping side of HR",
        body: "This module covers the pages that keep the organization defensible: employment contracts, corrective actions, the pay grid, development and succession plans, legal cases and the documents attached to each employee. These are the records someone will ask for a year from now, so the habit that matters is writing them when the event happens.",
        path: "/nexushr/contracts"
      },
      {
        title: "Contracts",
        body: "Contracts holds each employee's employment agreement: the terms, the dates and the attached document. Keep the current contract on file and record the new one when terms change, so there is never a question about which version applies.",
        path: "/nexushr/contracts",
        target: { text: "Contracts", scope: "main" }
      },
      {
        title: "Corrective actions",
        body: "A corrective action is the formal record that a concern was raised, discussed and followed up. Each one names the employee, what the concern was, the action agreed and its status. A conversation that never got written here did not happen as far as HR is concerned.",
        path: "/nexushr/corrective-actions",
        target: { text: "Corrective Actions", scope: "main" }
      },
      {
        title: "The pay grid",
        body: "The Pay Grid sets the grades and the wage range attached to each one. Salary on an employee's file should follow a grade here — that is what keeps pay consistent across the organization and gives a defensible answer when someone asks why two similar roles are paid differently.",
        path: "/nexushr/pay-grid",
        target: { text: "Pay Grid", scope: "main" }
      },
      {
        title: "Career and succession",
        body: "Career & Succession has two tabs. Development Plans record where a staff member is heading and what they are working on to get there. Succession Matrix looks at the roles instead: which key positions have someone ready to step in, and which do not — the uncomfortable answer that is worth knowing before it is urgent.",
        path: "/nexushr/career-plans",
        target: { text: "Development Plans", scope: "main" }
      },
      {
        title: "Legal cases",
        body: "Legal Cases is for the matters that have moved beyond an internal concern — the parties, the type, the status and the key dates. Access is limited for a reason: record the facts and the dates, and keep the file current so the organization can answer questions with evidence rather than memory.",
        path: "/nexushr/legal",
        target: { text: "Legal Cases", scope: "main" }
      },
      {
        title: "Employee documents",
        body: "Documents holds the paperwork that belongs to a person: letters, certificates, signed forms and ID copies. Upload it against the employee rather than into a personal folder, because access follows the employee record — the right people can find it and the wrong people cannot.",
        path: "/nexushr/documents",
        target: { text: "Documents", scope: "main" }
      },
      {
        title: "Time logs",
        body: "Time Logs is the running record of hours worked against an employee. It is what supports hours questions between timesheet periods and what payroll reads when something does not add up.",
        path: "/nexushr/time-logs",
        target: { text: "Time Logs", scope: "main" }
      },
      {
        title: "One rule across all of these pages",
        body: "Everything in this module points back at an employee record, so the record has to be right first. If a name, an email or a Reports To is wrong on the employee file, the contract, the corrective action, the review and the approval all inherit the mistake.",
        path: "/nexushr/employees"
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now record a corrective action, add a development plan, open the pay grid and upload a document against an employee — all on simulated data."
      }
    ],
    tasks: [
      {
        id: "hr-corrective",
        title: "Record a corrective action",
        body: "Create a corrective action for a demo employee, with the concern and the agreed action.",
        hint: "Open Corrective Actions, create a new entry, choose the employee, describe the concern and the action, and save.",
        path: "/nexushr/corrective-actions",
        verify: { kind: "created", entity: "CorrectiveAction" }
      },
      {
        id: "hr-career",
        title: "Add a development plan",
        body: "Create a development plan for a staff member on the Career & Succession page.",
        hint: "Open Career & Succession, use Development Plans, create a plan for an employee with their goal and steps.",
        path: "/nexushr/career-plans",
        verify: { kind: "created", entity: "CareerPlan" }
      },
      {
        id: "hr-paygrid",
        title: "Check the pay grid",
        body: "Open the Pay Grid and find the grade and wage range that matches a role.",
        hint: "Open Pay Grid from the sidebar and read the grades and their ranges.",
        path: "/nexushr/pay-grid",
        verify: { kind: "self" }
      },
      {
        id: "hr-doc",
        title: "Upload a document against an employee",
        body: "Add a document to an employee's file.",
        hint: "Open Documents, upload a file, and attach it to an employee rather than leaving it unassigned.",
        path: "/nexushr/documents",
        verify: { kind: "created", entity: "EmployeeDocument" }
      }
    ]
  }
];