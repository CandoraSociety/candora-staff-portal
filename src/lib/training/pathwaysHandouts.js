import { withTimes } from "@/lib/training/planTimeline";
import { PLAN_DOC_CSS } from "@/components/training/plan/trainingPlanDocumentHtml";

const LOGO = "https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const prettyDate = (d) => {
  if (!d) return "";
  const dt = new Date(`${d}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
};

// Room handouts share the run-sheet's stylesheet, plus the bits only handouts
// need: tick boxes, a callout box, signature rows and ruled writing lines.
export const HANDOUT_EXTRA_CSS = `
.tp-doc .box { border: 1px solid #e5e7eb; border-left: 3px solid #f5be19; background: #fffdf6; padding: 8px 10px; margin: 10px 0; }
.tp-doc .box h3 { margin: 0 0 3px; font-size: 9.5pt; text-transform: uppercase; letter-spacing: .05em; }
.tp-doc .check { list-style: none; padding-left: 0; }
.tp-doc .check li { position: relative; padding-left: 22px; margin-bottom: 8px; }
.tp-doc .check li:before { content: ""; position: absolute; left: 0; top: 2px; width: 11px; height: 11px; border: 1.4px solid #1b2350; border-radius: 2px; }
.tp-doc .sig th { text-align: left; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .05em; color: #555c73; padding: 5px 7px; border-bottom: 1.5px solid #0a0f29; }
.tp-doc .sig td { height: 24px; }
.tp-doc .lines p { border-bottom: 1px solid #dfe2e8; height: 20px; margin: 0 0 12px; }
.tp-doc .note { font-size: 9pt; color: #555c73; }
.tp-doc .inline { display: inline-block; min-width: 1.1in; border-bottom: 1px solid #9aa0ae; }
`;

// Header lockup shared by every handout — same brand band as the run-sheet.
export const handoutHeader = (kicker) => `
  <header>
    <img src="${LOGO}" alt="Candora" />
    <div>
      <div class="brand">Candora</div>
      <div class="brand" style="font-weight:600;color:#7a7f92">${esc(kicker)}</div>
    </div>
  </header>`;

export const buildHandoutDocumentHtml = ({ title, bodyHtml }) => `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<title>${esc(title)}</title>
<style>${HANDOUT_CSS}</style>
</head><body><div class="tp-doc">${bodyHtml}</div></body></html>`;

export const HANDOUT_CSS = PLAN_DOC_CSS + HANDOUT_EXTRA_CSS;

const planMeta = (plan) => [
  plan.audience ? esc(plan.audience) : "",
  plan.plan_date ? prettyDate(plan.plan_date) : "",
  plan.start_time ? `Starts ${plan.start_time}` : "",
].filter(Boolean).join(" · ");

// ── 1. Attendee agenda — the room's copy of the day ─────────────────────────
const attendeeAgenda = {
  id: "agenda",
  title: "Attendee agenda",
  blurb: "Times and block titles for the room. No facilitator cues.",
  build: (plan) => {
    const { blocks, endTime } = withTimes(plan);
    const rows = blocks.map(b => `
      <tr class="${b.type === "break" ? "kind-break" : ""}">
        <td class="time">${esc(b.time)}</td>
        <td><div class="btitle">${esc(b.title)}</div>
          ${b.type === "session" && b.module ? `<div class="kicker">${esc(b.module.title)}</div>` : ""}
        </td>
      </tr>`).join("");

    const owed = (plan.follow_up || []).filter(f => f.module_key).map(f => {
      const label = blocks.find(b => b.module_key === f.module_key)?.module?.title || f.module_key;
      return `<li><strong>${esc(label)}</strong>${f.who ? ` — ${esc(f.who)}` : ""}${f.why ? `<br /><span class="note">${esc(f.why)}</span>` : ""}</li>`;
    }).join("");

    return `${handoutHeader("Training day · your copy")}
      <h1>${esc(plan.title || "Training day")}</h1>
      <div class="meta">${planMeta(plan)}${planMeta(plan) ? " · " : ""}ends ${endTime}</div>
      ${plan.summary ? `<p class="summary">${esc(plan.summary)}</p>` : ""}

      <div class="box">
        <h3>Before you start</h3>
        <ul>
          <li>Your own device, already signed in. Test Mode is switched on for the room until the live-work block — nothing you click in Test Mode touches real data.</li>
          <li>Keep one question in your pocket for the parking lot; the last hour is where the room fixes what it found.</li>
          <li>You are not expected to remember all of it. The modules and their quizzes stay in the training catalog for whenever you need them.</li>
        </ul>
      </div>

      <h2>The day</h2>
      <table>${rows || "<tr><td>No blocks yet.</td></tr>"}</table>

      <h2>Finish on your own this week</h2>
      <ul>${owed || "<li>Nothing set aside — everything is taught in the room.</li>"}</ul>

      <footer>${esc(plan.title || "Training day")} · your copy · printed ${new Date().toLocaleDateString("en-CA")}</footer>`;
  },
};

// ── 2. Quick reference — one page for the desk ─────────────────────────────
const quickReference = {
  id: "quickref",
  title: "Quick reference card",
  blurb: "Where things live, the three roads, and the statuses — one page for the desk.",
  build: (plan) => `${handoutHeader("Pathways · quick reference")}
    <h1>Pathways in one page</h1>
    <div class="meta">Keep this at the desk. All of it is covered in the training modules.</div>

    <h2>Names that catch people out</h2>
    <ul>
      <li><strong>The Candora Staff Portal</strong> is the whole app. The workspaces inside it are also called portals.</li>
      <li><strong>The central client database</strong> is the one shared record per person. It is never called the Resource Centre.</li>
      <li><strong>Pathways</strong> is the employment program: one client file per participant, with their barriers, plan, placements and outcomes.</li>
      <li><strong>Compass</strong> is the government system. The portal records that work was done there — it does not replace it.</li>
    </ul>

    <h2>Where things live</h2>
    <table>
      <tr><td class="time">My Clients</td><td>Only the clients assigned to you. Caseloads route by your email address, so a missing client is an assignment question, not a search problem.</td></tr>
      <tr><td class="time">Master List</td><td>Every client in the program, whatever their worker. New clients pushed in from the Cross-Reference List wait in the holding section until a counsellor, stream and program status are set.</td></tr>
      <tr><td class="time">Intake</td><td>Where a journey starts, whether a staff member completes it or the client fills the public form themselves. Duplicate check first, every time.</td></tr>
      <tr><td class="time">Assessment</td><td>The Service Navigator records barriers in the Barrier Identification Tool and confirms the ERA was completed in Compass.</td></tr>
      <tr><td class="time">Program Status</td><td>The stage the file is in now — this is what moves a file forward.</td></tr>
      <tr><td class="time">Program Progress</td><td>The whole journey on one timeline: plan items, barrier windows, placements, outcomes.</td></tr>
      <tr><td class="time">Action plan</td><td>Built from plan items. Saving it is what unlocks the rest of the flow.</td></tr>
      <tr><td class="time">90-Day Follow-Up</td><td>The milestone that closes every road, whichever route the client took.</td></tr>
    </table>

    <h2>Three roads out of one determination</h2>
    <table>
      <tr><td class="time">WD</td><td>Workforce Development. The client works the plan, and the road may include an internal Candora placement or an external work exposure placement.</td></tr>
      <tr><td class="time">DEA</td><td>Disability Employment. The fast track toward employment, with the plan still driving the milestones.</td></tr>
      <tr><td class="time">Not eligible</td><td>Recorded as the determination, with the reason — never left blank.</td></tr>
    </table>

    <h2>Barrier states</h2>
    <ul>
      <li><strong>Unresolved</strong> — recorded, not yet being worked.</li>
      <li><strong>In progress</strong> — the work has started; use the timeline dates.</li>
      <li><strong>Resolved</strong> — only when the need is genuinely met, with an end date and a resolution note that says what worked.</li>
    </ul>

    <div class="box">
      <h3>The two rules</h3>
      <ol>
        <li><strong>Duplicate check before you type a new name.</strong> One person, one record — link the existing file instead of creating a second.</li>
        <li><strong>Test Mode off means live data.</strong> Check the ribbon has gone before touching a real client.</li>
      </ol>
    </div>

    <footer>Pathways · quick reference · printed ${new Date().toLocaleDateString("en-CA")}</footer>`,
};

// ── 3. Practice worksheet — the afternoon in Test Mode ─────────────────────
const practiceWorksheet = {
  id: "practice",
  title: "Practice worksheet",
  blurb: "The Test Mode walkthrough as a tick-list, with room to write what confused you.",
  build: (plan) => `${handoutHeader("Pathways · practice in Test Mode")}
    <h1>Practice worksheet</h1>
    <div class="meta">Work on a demo client. Nothing here touches real data. Tick each step as you finish it.</div>

    <div class="box">
      <h3>Before you start</h3>
      <p class="note">Confirm Test Mode is on (the ribbon is across the top). Pick one demo client and stay with them for the whole list — the point is that the steps hand off to each other.</p>
    </div>

    <h2>The walkthrough</h2>
    <ol class="check">
      <li><strong>Open the demo client</strong> — find your client in the Master List and open the file.</li>
      <li><strong>Run Intake</strong> — complete the form and accept the duplicate check when it finds the demo record.</li>
      <li><strong>Record the determination</strong> — choose the road: WD, DEA, or not eligible.</li>
      <li><strong>Build and save the action plan</strong> — notice that the rest of the flow only unlocks once it saves.</li>
      <li><strong>Move the program status</strong> — change the stage, then read what updated behind it.</li>
      <li><strong>Record two barriers</strong> — with action steps, challenges and a timeline, not just a label.</li>
      <li><strong>Confirm the ERA</strong> — on the client waiting in Awaiting Assessment, mark the Compass assessment as completed.</li>
      <li><strong>Resolve one barrier</strong> — with an end date and a resolution note that says what worked.</li>
      <li><strong>Raise an internal referral</strong> — hand part of the work to another Candora program.</li>
      <li><strong>Record a 90-day follow-up</strong> — on a completed client, so you have seen the milestone that closes every road.</li>
      <li><strong>Finish the quizzes</strong> — the modules taught today, 70% to pass, retakes are free.</li>
    </ol>

    <h2>What confused me</h2>
    <p class="note">Write it down now — the last block of the day turns these into fixes and change requests.</p>
    <div class="lines"><p></p><p></p><p></p></div>

    <h2>My next step after today</h2>
    <p>The one module I will finish first: <span class="inline">&nbsp;</span> by <span class="inline">&nbsp;</span></p>
    <p class="note">The modules this crew owes before touching a live file: the assessment, service navigation, and the central client database.</p>

    <footer>${esc(plan.title || "Pathways training")} · practice worksheet · printed ${new Date().toLocaleDateString("en-CA")}</footer>`,
};

export const PATHWAYS_HANDOUTS = [attendeeAgenda, quickReference, practiceWorksheet];