import { withTimes, planStats } from "@/lib/training/planTimeline";

const LOGO = "https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const prettyDate = (d) => {
  if (!d) return "";
  const dt = new Date(`${d}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
};

const list = (items) => (items || []).filter(t => String(t).trim()).map(t => `<li>${esc(t)}</li>`).join("");

// A self-contained printable run-sheet for one training day. Rendered into an
// iframe so the app's own layout never clips the printed pages.
export function buildTrainingPlanDocumentHtml(plan) {
  const { blocks, endTime } = withTimes(plan);
  const stats = planStats(plan);
  const audience = plan.audience_type === "individual" ? plan.audience : plan.audience || "";
  const meta = [
    audience && `${plan.audience_type === "individual" ? "For" : "Group"}: ${esc(audience)}`,
    plan.plan_date && prettyDate(plan.plan_date),
    `${plan.start_time || "09:00"} – ${endTime}`,
    `${Math.floor(stats.teaching / 60)}h ${String(stats.teaching % 60).padStart(2, "0")}m teaching`,
  ].filter(Boolean).join(" · ");

  const rows = blocks.map((b) => {
    const kind = b.type === "session" ? "Module" : b.type === "break" ? "Break" : "Admin";
    const activities = (b.activities || []).filter(a => String(a).trim());
    return `
      <tr class="kind-${b.type}">
        <td class="time">${esc(b.time)}</td>
        <td>
          <div class="btitle">${esc(b.title || kind)}</div>
          <div class="kicker">${kind}${b.module ? ` · ${esc(b.module.title)}` : ""} · ${b.minutes} min</div>
          ${b.why ? `<p class="why">${esc(b.why)}</p>` : ""}
          ${b.cue ? `<p class="cue"><strong>Say:</strong> ${esc(b.cue)}</p>` : ""}
          ${activities.length ? `<ul class="acts">${list(activities)}</ul>` : ""}
        </td>
      </tr>`;
  }).join("");

  const followUp = (plan.follow_up || []).filter(f => f.module_key).map(f => {
    const label = blocks.find(b => b.module_key === f.module_key)?.module?.title || f.module_key;
    return `<tr><td>${esc(label)}</td><td>${esc(f.who || "—")}</td><td>${esc(f.why || "—")}</td></tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<title>${esc(plan.title || "Training day")}</title>
<style>
  @page { size: letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  body { font-family: "Inter", Helvetica, Arial, sans-serif; color: #0a0f29; margin: 0; font-size: 11pt; }
  header { display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #f5be19; padding-bottom: 10px; margin-bottom: 14px; }
  header img { height: 44px; }
  header .brand { font-weight: 800; letter-spacing: .06em; font-size: 10pt; color: #1b2350; text-transform: uppercase; }
  h1 { font-size: 20pt; margin: 0 0 4px; line-height: 1.15; }
  h2 { font-size: 12pt; margin: 20px 0 6px; text-transform: uppercase; letter-spacing: .06em; color: #1b2350; }
  .meta { font-size: 9.5pt; color: #555c73; margin-bottom: 12px; }
  .summary { font-size: 11pt; margin: 0 0 8px; }
  .cols { display: flex; gap: 18px; }
  .cols > div { flex: 1; }
  ul { margin: 4px 0 0; padding-left: 16px; }
  li { margin-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; }
  tr { page-break-inside: avoid; }
  td { vertical-align: top; padding: 7px 8px; border-top: 1px solid #e5e7eb; }
  .time { width: 1.35in; font-weight: 700; font-size: 9.5pt; white-space: nowrap; color: #1b2350; }
  .btitle { font-weight: 700; font-size: 11pt; }
  .kicker { font-size: 8.5pt; text-transform: uppercase; letter-spacing: .05em; color: #7a7f92; margin-top: 1px; }
  .why { margin: 4px 0 0; font-size: 10pt; color: #333a52; }
  .cue { margin: 4px 0 0; font-size: 10pt; background: #fff8e2; border-left: 3px solid #f5be19; padding: 3px 7px; }
  .acts { font-size: 10pt; }
  tr.kind-break td { background: #f6f7f9; }
  tr.kind-admin td { background: #fbfbfd; }
  footer { margin-top: 18px; border-top: 1px solid #e5e7eb; padding-top: 8px; font-size: 8.5pt; color: #7a7f92; }
</style></head>
<body>
  <header>
    <img src="${LOGO}" alt="Candora" />
    <div>
      <div class="brand">Candora</div>
      <div class="brand" style="font-weight:600;color:#7a7f92">Facilitator run-sheet</div>
    </div>
  </header>

  <h1>${esc(plan.title || "Training day")}</h1>
  <div class="meta">${meta}</div>
  ${plan.summary ? `<p class="summary">${esc(plan.summary)}</p>` : ""}

  ${(plan.outcomes || plan.setup || []).length ? `<div class="cols">
    <div>
      <h2>By the end of the day</h2>
      <ul>${list(plan.outcomes) || "<li>—</li>"}</ul>
    </div>
    <div>
      <h2>Room setup</h2>
      <ul>${list(plan.setup) || "<li>—</li>"}</ul>
    </div>
  </div>` : ""}

  <h2>The agenda</h2>
  <table>${rows || `<tr><td>No blocks yet.</td></tr>`}</table>

  ${followUp ? `<h2>Finish this week, on their own</h2>
  <table><tr><td><strong>Module</strong></td><td><strong>Who</strong></td><td><strong>Why it matters</strong></td></tr>${followUp}</table>` : ""}

  <footer>${esc(plan.title || "Training day")} · printed ${new Date().toLocaleDateString("en-CA")}</footer>
</body></html>`;
}