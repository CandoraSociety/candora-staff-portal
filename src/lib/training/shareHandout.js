import { base44 } from "@/api/base44Client";
import { buildHandoutDocumentHtml } from "@/lib/training/pathwaysHandouts";

// Handouts exist only as printable documents, so both actions build the same
// self-contained HTML: one saves it to the facilitator's machine, the other
// uploads it and puts the link in every attendee's dashboard notifications.

const slug = (s) => String(s || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "") || "handout";

const fileName = (handout, plan) => `${slug(handout.title)}-${slug(plan?.title || "training-day")}.html`;

const documentHtml = (handout, plan) => buildHandoutDocumentHtml({
  title: `${handout.title} — ${plan?.title || "Training day"}`,
  bodyHtml: handout.build(plan),
});

export const downloadHandout = ({ handout, plan }) => {
  const blob = new Blob([documentHtml(handout, plan)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName(handout, plan);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

// Sends one handout to everyone listed on the training day. Returns the number
// of people it reached so the facilitator can see the share land.
export const shareHandoutWithParticipants = async ({ handout, plan }) => {
  const attendees = (plan?.attendees || []).filter(a => a?.email);
  if (!attendees.length) return { count: 0 };

  const title = `${handout.title} — ${plan?.title || "Training day"}`;
  const html = documentHtml(handout, plan);
  const file = new File([html], fileName(handout, plan), { type: "text/html" });
  // Stored privately: the dashboard alert asks for a short-lived signed URL
  // when the recipient opens it, so the link never outlives the day.
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });

  const when = plan?.plan_date
    ? new Date(`${plan.plan_date}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })
    : "";

  await base44.entities.DashboardNotification.bulkCreate(attendees.map(a => ({
    recipient_email: a.email,
    recipient_name: a.name || "",
    kind: "training_material",
    title,
    message: `Shared by your facilitator for ${plan?.title || "the training day"}${when ? ` (${when})` : ""}. Open it to preview or print your copy.`,
    link: file_uri,
  })));

  return { count: attendees.length };
};