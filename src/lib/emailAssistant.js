import { base44 } from "@/api/base44Client";

// Shared vocabulary and helpers for the AI Email Assistant.

export const KIND_META = {
  task: { label: "Suggested task", plural: "Tasks", tone: "bg-highlight/10 text-highlight border-highlight/20" },
  follow_up: { label: "Follow-up", plural: "Follow-ups", tone: "bg-accent/10 text-accent border-accent/20" },
  calendar: { label: "Calendar", plural: "Calendar", tone: "bg-primary/15 text-foreground border-primary/30" },
  decision: { label: "Decision", plural: "Decisions", tone: "bg-success/10 text-success border-success/20" },
  question: { label: "Open question", plural: "Questions", tone: "bg-destructive/10 text-destructive border-destructive/20" },
  commitment: { label: "Commitment", plural: "Commitments", tone: "bg-purple-600/10 text-purple-600 border-purple-600/20" },
  knowledge: { label: "Worth keeping", plural: "Knowledge", tone: "bg-muted text-foreground border-border" },
  summary: { label: "Summary", plural: "Summaries", tone: "bg-muted text-foreground border-border" },
};

export const CERTAINTY_META = {
  confirmed: { label: "Stated in the email", tone: "text-success" },
  proposed: { label: "Proposed", tone: "text-highlight" },
  unclear: { label: "Unclear — check the email", tone: "text-warning" },
};

export const TONES = [
  { value: "warm_professional", label: "Warm and professional" },
  { value: "formal", label: "Formal" },
  { value: "concise", label: "Short and to the point" },
  { value: "friendly", label: "Friendly" },
  { value: "direct", label: "Direct" },
];

export const FEATURES = [
  { key: "analysis", label: "Email analysis", hint: "Find tasks, deadlines and decisions in a conversation" },
  { key: "summaries", label: "Summaries", hint: "Condense a conversation, with what is confirmed and what is not" },
  { key: "drafting", label: "Drafting help", hint: "Write replies and new messages you can edit" },
  { key: "tasks", label: "Task suggestions", hint: "Turn actions into tasks in your own task list" },
  { key: "follow_ups", label: "Follow-up tracking", hint: "Notice what you owe someone and what you are waiting on" },
  { key: "calendar", label: "Calendar suggestions", hint: "Pick out meetings, dates and deadlines" },
  { key: "knowledge", label: "Information capture", hint: "Flag information worth recording in the portal" },
  { key: "briefing", label: "Daily briefing", hint: "A short priority briefing for the day" },
  { key: "chat", label: "Ask questions", hint: "Ask about your own correspondence in plain language" },
];

export const DEFAULT_PREFS = {
  automation_level: "manual",
  features: {
    analysis: true,
    summaries: true,
    drafting: true,
    tasks: true,
    follow_ups: true,
    calendar: true,
    knowledge: true,
    briefing: true,
    chat: true,
  },
  preferred_task_manager: "organizer",
  drafting_tone: "warm_professional",
  default_priority: "medium",
  briefing_mode: "on_request",
  follow_up_reminder_days: 3,
  notify_new_suggestions: true,
  exclusion_terms: "",
};

export const DEFAULT_POLICY = {
  is_enabled: true,
  allowed_automation: "proactive",
  features_allowed: { ...DEFAULT_PREFS.features },
  monthly_analysis_limit: 0,
  retention_days: 90,
};

// Organization policy always wins over a personal preference.
export function featureOn(key, prefs, policy) {
  if (policy && policy.is_enabled === false) return false;
  if (policy?.features_allowed && policy.features_allowed[key] === false) return false;
  return prefs?.features?.[key] !== false;
}

export function allowedAutomation(policy) {
  return policy?.allowed_automation === "manual" ? "manual" : "proactive";
}

export function effectiveAutomation(prefs, policy) {
  if (allowedAutomation(policy) === "manual") return "manual";
  return prefs?.automation_level === "proactive" ? "proactive" : "manual";
}

export function formatWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isOverdue(value) {
  if (!value) return false;
  const due = new Date(`${value}T23:59:59`);
  return due.getTime() < Date.now();
}

export function isSnoozed(insight) {
  if (insight.status !== "snoozed") return false;
  if (!insight.snooze_until) return true;
  return new Date(`${insight.snooze_until}T00:00:00`).getTime() > Date.now();
}

export function activeInsights(insights = []) {
  return insights.filter((i) => i.status !== "dismissed" && !isSnoozed(i));
}

// Writes an approved suggestion into the employee's own task list in the portal.
export async function addOrganizerTask(user, { title, dueDate, priority, notes }) {
  const existing = await base44.entities.PersonalOrganizer.filter({ user_email: user.email }, { limit: 1 });
  const record = existing.items?.[0];
  const task = {
    id: crypto.randomUUID(),
    text: title,
    done: false,
    created_at: new Date().toISOString(),
    priority_level: priority || "medium",
    notes: [dueDate ? `Due ${formatWhen(dueDate)}` : "", notes || ""].filter(Boolean).join(" · "),
  };
  if (record) {
    await base44.entities.PersonalOrganizer.update(record.id, { tasks: [...(record.tasks || []), task] });
  } else {
    await base44.entities.PersonalOrganizer.create({ user_email: user.email, tasks: [task] });
  }
  return task.id;
}

export async function completeOrganizerTask(user, taskId) {
  const existing = await base44.entities.PersonalOrganizer.filter({ user_email: user.email }, { limit: 1 });
  const record = existing.items?.[0];
  if (!record || !taskId) return;
  const tasks = (record.tasks || []).map((t) => (t.id === taskId ? { ...t, done: true } : t));
  await base44.entities.PersonalOrganizer.update(record.id, { tasks });
}

// Writes an approved calendar suggestion into the employee's own Week calendar
// in the organizer — not into Outlook, which is not connected yet.
export async function addOrganizerEvent(user, { title, date, time, notes }) {
  const existing = await base44.entities.PersonalOrganizer.filter({ user_email: user.email }, { limit: 1 });
  const record = existing.items?.[0];
  const item = {
    id: crypto.randomUUID(),
    text: title,
    scheduled_date: date,
    time: time || "",
    done: false,
    notes: notes || "",
    status: "scheduled",
    reminder_sent: false,
  };
  const weekly = [...(record?.weekly_plan || []), item];
  if (record) {
    await base44.entities.PersonalOrganizer.update(record.id, { weekly_plan: weekly });
  } else {
    await base44.entities.PersonalOrganizer.create({ user_email: user.email, weekly_plan: weekly });
  }
  return item.id;
}

export async function logAction(user, action, detail, extra = {}) {
  await base44.entities.EmailAssistantLog.create({
    owner_email: user.email,
    action,
    detail,
    ...extra,
  });
}

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString();
};

// Clearly labelled sample correspondence so the assistant can be tried before
// any email connection exists. Never presented as real email.
export function sampleMessages(user) {
  const base = { owner_email: user.email, source: "sample", is_demo: true };
  return [
    {
      ...base,
      thread_id: "sample-appeal",
      thread_subject: "Winter Warmth Appeal — program numbers for the donation page",
      subject: "Winter Warmth Appeal — program numbers for the donation page",
      from_name: "Renée Bouchard",
      from_email: "renee.bouchard@candorasociety.com",
      recipients: user.full_name || "you",
      direction: "inbound",
      received_at: day(-2),
      body_text:
        "Hi,\n\nWe're finalizing the Winter Warmth Appeal page and I need a few numbers from your program to make the case. Could you send me:\n\n1. How many households your program served last winter.\n2. The average cost of a week of lunches per participant.\n3. One short client story I can quote (first name only).\n\nThe page goes live on the 1st, so I'd really like this by Friday.\n\nThanks!\nRenée",
      attachments: [{ name: "Winter Warmth Appeal — draft copy.docx", summary: "Two-page draft of the appeal page, with a placeholder for program statistics." }],
    },
    {
      ...base,
      thread_id: "sample-appeal",
      thread_subject: "Winter Warmth Appeal — program numbers for the donation page",
      subject: "Re: Winter Warmth Appeal — program numbers for the donation page",
      from_name: user.full_name || "You",
      from_email: user.email,
      recipients: "Renée Bouchard",
      direction: "outbound",
      received_at: day(-1),
      body_text:
        "Hi Renée,\n\nHappy to help. I'll pull the household count and the lunch cost from our records and send both over. I'll ask the team about a story we can share with a first name only.\n\nI should have this to you by Thursday.\n\nThanks,",
    },
    {
      ...base,
      thread_id: "sample-fcss",
      thread_subject: "FCSS Q3 narrative report — due date and attachments",
      subject: "FCSS Q3 narrative report — due date and attachments",
      from_name: "Derek Okafor",
      from_email: "derek.okafor@edmonton.ca",
      recipients: user.full_name || "you",
      direction: "inbound",
      received_at: day(-5),
      body_text:
        "Good morning,\n\nA reminder that the Q3 narrative report is due on the 28th. The template and the outcomes workbook are attached. Please include the participant totals for each program and a short paragraph on any barriers you encountered.\n\nIf you expect to be late, let me know before the 28th rather than after.\n\nRegards,\nDerek Okafor\nFCSS Program Liaison",
      attachments: [
        { name: "FCSS Q3 Narrative Template.docx", summary: "Template with sections for program summary, participant totals, barriers and outcomes." },
        { name: "FCSS Q3 Outcomes Workbook.xlsx", summary: "Workbook with participant counts per program; the totals tab needs updating." },
      ],
    },
    {
      ...base,
      thread_id: "sample-room",
      thread_subject: "Room for Tuesday's digital literacy session",
      subject: "Room for Tuesday's digital literacy session",
      from_name: "Priya Raman",
      from_email: "priya.raman@candorasociety.com",
      recipients: user.full_name || "you",
      direction: "inbound",
      received_at: day(-1),
      body_text:
        "Hi,\n\nWe might need the large classroom on Tuesday morning for the digital literacy group, roughly 10 to noon. Nothing is confirmed yet — I'm waiting to hear how many learners are coming.\n\nWould that space be free? If not, the small classroom could work, though it's a tight fit.\n\nPriya",
    },
    {
      ...base,
      thread_id: "sample-volunteers",
      thread_subject: "Volunteer orientation schedule",
      subject: "Re: Volunteer orientation schedule",
      from_name: "Marcus Hale",
      from_email: "marcus.hale@candorasociety.com",
      recipients: user.full_name || "you",
      direction: "inbound",
      received_at: day(-4),
      body_text:
        "Thanks for jumping in on the orientation. Could you send me the schedule for the December sessions once it's set? I'd like to include it in the volunteer newsletter that goes out on the 25th.\n\nMarcus",
    },
    {
      ...base,
      thread_id: "sample-volunteers",
      thread_subject: "Volunteer orientation schedule",
      subject: "Re: Volunteer orientation schedule",
      from_name: user.full_name || "You",
      from_email: user.email,
      recipients: "Marcus Hale",
      direction: "outbound",
      received_at: day(-3),
      body_text:
        "Hi Marcus,\n\nWill do. I'll send the December schedule as soon as the dates are confirmed with the facilitators, and before your newsletter deadline.\n\nThanks,",
    },
  ];
}