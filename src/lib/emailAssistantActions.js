import { base44 } from "@/api/base44Client";
import { addOrganizerTask, completeOrganizerTask, formatWhen, logAction } from "@/lib/emailAssistant";

// Every change an employee makes to a suggestion goes through here, so the
// approval, the audit record and the task write always happen together.

const APPROVED_TEXT = {
  task: "Added to your task list",
  follow_up: "Kept on your follow-up list",
  commitment: "Kept on your follow-up list",
  calendar: "Details ready — add it to your calendar yourself",
  knowledge: "Kept as information for now",
  decision: "Kept as a decision",
  question: "Kept as an open question",
};

// What accepting each kind of suggestion actually does, spelled out in the
// button and above it, so nobody has to guess what "Approve" means.
export const APPROVAL_LABEL = {
  task: "Add to my tasks",
  follow_up: "Keep on my follow-ups",
  commitment: "Keep on my follow-ups",
  calendar: "Keep these details",
  knowledge: "Keep as information",
  decision: "Keep as a decision",
  question: "Keep as an open question",
};

export const APPROVAL_OUTCOME = {
  task: "This becomes a task in your own list, with the date and priority shown above.",
  follow_up: "This is kept on your follow-up list so you can chase it later.",
  commitment: "This is kept on your follow-up list so you can track who owes what.",
  calendar: "The date and details are kept for you to add to your calendar yourself — nothing is added automatically.",
  knowledge: "This is kept as information you can look back at.",
  decision: "This is kept on record as a decision.",
  question: "This is kept as an open question to answer later.",
};

export async function approveInsight(insight, user) {
  const patch = {
    status: "approved",
    approved_action: APPROVED_TEXT[insight.kind] || "Approved",
  };

  if (insight.kind === "task") {
    const taskId = await addOrganizerTask(user, {
      title: insight.title,
      dueDate: insight.due_date,
      priority: insight.priority,
      notes: insight.detail,
    });
    patch.linked_task_id = taskId;
  }

  await base44.entities.EmailInsight.update(insight.id, patch);
  await logAction(user, "task_approved", `${insight.kind}: ${insight.title}`.slice(0, 180), {
    related_insight_id: insight.id,
    is_demo: insight.is_demo,
  });
}

export async function dismissInsight(insight, user) {
  await base44.entities.EmailInsight.update(insight.id, { status: "dismissed" });
  await logAction(user, "suggestion_dismissed", `${insight.kind}: ${insight.title}`.slice(0, 180), {
    related_insight_id: insight.id,
    is_demo: insight.is_demo,
  });
}

export async function snoozeInsight(insight, user, untilDate) {
  await base44.entities.EmailInsight.update(insight.id, {
    status: "snoozed",
    snooze_until: untilDate,
  });
  await logAction(user, "suggestion_snoozed", `Until ${formatWhen(untilDate)}`, {
    related_insight_id: insight.id,
    is_demo: insight.is_demo,
  });
}

export async function reopenInsight(insight) {
  await base44.entities.EmailInsight.update(insight.id, { status: "suggested", snooze_until: "" });
}

export async function markDone(insight, user) {
  await base44.entities.EmailInsight.update(insight.id, { status: "done", approved_action: "Marked done" });
  if (insight.linked_task_id) await completeOrganizerTask(user, insight.linked_task_id);
  await logAction(user, "follow_up_done", `${insight.kind}: ${insight.title}`.slice(0, 180), {
    related_insight_id: insight.id,
    is_demo: insight.is_demo,
  });
}

export async function saveInsightEdits(insight, patch) {
  await base44.entities.EmailInsight.update(insight.id, patch);
}

// Turns a follow-up, commitment or question into a task in the employee's list.
export async function convertToTask(insight, user, prefs) {
  const taskId = await addOrganizerTask(user, {
    title: insight.title,
    dueDate: insight.due_date,
    priority: insight.priority || prefs?.default_priority,
    notes: insight.detail,
  });
  await base44.entities.EmailInsight.update(insight.id, {
    status: "approved",
    approved_action: "Added to your task list",
    linked_task_id: taskId,
  });
  await logAction(user, "task_approved", `From ${insight.kind}: ${insight.title}`.slice(0, 180), {
    related_insight_id: insight.id,
    is_demo: insight.is_demo,
  });
}