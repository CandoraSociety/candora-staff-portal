import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays, ChevronDown, ChevronRight, ClipboardCheck, FileText, GraduationCap,
  ListChecks, LogOut, MonitorPlay, MonitorUp, PanelRightClose, PanelRightOpen, Play, Printer,
} from "lucide-react";
import { toast } from "sonner";
import { openPresenterWindow } from "@/lib/training/presenter";
import { withTimes } from "@/lib/training/planTimeline";
import { getSectionNote, getPracticeNote, getModuleTips, getRoomHandouts, getModuleObjectives, getModuleDuration } from "@/lib/training/facilitatorResources";
import HandoutPrintDialog from "@/components/training/plan/HandoutPrintDialog";

const NAVY = "hsl(230, 70%, 10%)";
const NAVY_DEEP = "hsl(230, 60%, 13%)";
const LINE = "1px solid hsl(230, 45%, 24%)";
const GOLD = "hsl(45, 92%, 53%)";
const MUTED = "hsl(230, 25%, 65%)";

const Row = ({ children, className = "" }) => (
  <div className={`rounded-xl px-3 py-2.5 ${className}`} style={{ background: NAVY_DEEP, border: LINE }}>{children}</div>
);

// The facilitator's own sidebar while a session runs: the day's agenda, every
// section of the module with its talking point, the practice coaching notes,
// and the material that goes with the room. Docked right, never projected.
export default function FacilitatorSidebar({
  module, session, stepIndex, open, onClose, onOpen,
  onJumpStep, onOpenTour, onOpenPractice, onOpenBriefing, onEndSession, onGoToBlock,
  mirrorOn, mirrorLive, mirrorCount, onToggleMirror,
}) {
  const [expanded, setExpanded] = useState(stepIndex);
  const [agendaOpen, setAgendaOpen] = useState(true);
  const [handout, setHandout] = useState(null);

  const plan = session?.plan || null;
  const steps = module?.steps || [];
  const tips = getModuleTips(module);
  const objectives = getModuleObjectives(module);
  const duration = getModuleDuration(module);
  const handouts = getRoomHandouts(module, plan);
  const agenda = plan ? withTimes(plan).blocks : [];
  // The block the facilitator is on now — what to say, why it sits there, and
  // the activity the room does in Test Mode while it runs.
  const currentBlock = agenda.find(b => b.index === (session?.blockIndex || 0))
    || agenda.find(b => b.module?.key === module?.key)
    || null;
  const blockActivities = currentBlock?.activities || [];

  // The sidebar follows the tour: the section being taught is the one open.
  useEffect(() => { setExpanded(stepIndex); }, [stepIndex]);

  // Docked, so the app's working space sits beside it instead of underneath.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("has-training-sidebar");
    return () => document.body.classList.remove("has-training-sidebar");
  }, [open]);

  if (!open) {
    return createPortal(
      <button
        onClick={onOpen}
        title="Show facilitator sidebar"
        className="fixed right-0 top-1/2 z-[10011] flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-l-xl border border-sidebar-primary/50 bg-sidebar px-1.5 py-3 text-sidebar-primary shadow-lg print:hidden"
      >
        <PanelRightOpen className="h-4 w-4" />
        <span className="text-[10px] font-bold [writing-mode:vertical-rl]">Facilitator</span>
      </button>,
      document.body
    );
  }

  return createPortal(
    <>
      <aside aria-label="Facilitator notes" className="fixed bottom-20 right-3 top-16 z-[10011] flex w-[88vw] max-w-[300px] flex-col md:bottom-4 md:top-20 md:w-[250px] print:hidden">
        <div className="training-window-glow flex min-h-0 flex-col overflow-hidden rounded-2xl border shadow-2xl" style={{ background: NAVY, borderColor: "hsl(45, 60%, 45%)" }}>
          <div className="flex shrink-0 items-start justify-between gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid hsl(230, 50%, 22%)" }}>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "hsl(45, 60%, 88%)" }}>
                <GraduationCap className="h-4 w-4" style={{ color: GOLD }} /> Facilitating
              </p>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: MUTED }}>{module.shortTitle || module.title}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "hsl(45, 60%, 62%)" }}>Your notes — never projected</p>
            </div>
            <button onClick={onClose} title="Hide sidebar" className="rounded-lg p-1 hover:opacity-70" style={{ color: MUTED }}>
              <PanelRightClose className="h-4 w-4" />
            </button>
          </div>

          {/* Mirror the facilitator's slide onto the participants' screens */}
          <div className="shrink-0 px-2 pt-2">
            <button
              onClick={onToggleMirror}
              title="Show the slide you are presenting on the screens of everyone listed as a participant"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:opacity-90"
              style={mirrorOn
                ? { background: GOLD, color: "hsl(230, 70%, 12%)", border: "1px solid hsl(45, 92%, 45%)" }
                : { background: NAVY_DEEP, border: LINE, color: "hsl(45, 55%, 85%)" }}
            >
              <MonitorPlay className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold leading-snug">Mirror my screen</span>
                <span className="block text-[10px] leading-snug opacity-80">
                  {mirrorOn
                    ? (mirrorLive
                      ? `Live · ${mirrorCount || "all"} participant${mirrorCount === 1 ? "" : "s"}`
                      : "Paused — practice, test or quiz")
                    : "Participants follow the slide when on"}
                </span>
              </span>
              <span
                className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                style={mirrorOn
                  ? { background: "hsl(230, 70%, 12%)", color: GOLD }
                  : { background: "hsl(230, 45%, 24%)", color: "hsl(45, 55%, 82%)" }}
              >
                {mirrorOn ? "ON" : "OFF"}
              </span>
            </button>

            {/* The screen plugged into this device — projector, TV, second monitor */}
            <button
              onClick={() => {
                if (!openPresenterWindow()) toast.error("Allow pop-ups for this site to open the presentation screen.");
              }}
              title="Opens a clean window for the plugged-in screen: the app, its sidebar and the training window, with none of your notes"
              className="mt-1.5 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:opacity-90"
              style={{ background: NAVY_DEEP, border: LINE, color: "hsl(45, 55%, 85%)" }}
            >
              <MonitorUp className="h-3.5 w-3.5 shrink-0" style={{ color: GOLD }} />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold leading-snug">Open presentation screen</span>
                <span className="block text-[10px] leading-snug opacity-80">For the projector — no notes on it</span>
              </span>
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-2">
            {/* What this session is for — the facilitator's instructions */}
            {(duration || objectives.length > 0) && (
              <section aria-label="Session plan">
                <h2 className="mb-1.5 border-b px-2 pb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "hsl(45, 70%, 68%)", borderColor: "hsl(230, 45%, 24%)" }}>
                  Session
                </h2>
                {duration && (
                  <p className="px-2 text-[10px] font-semibold leading-snug" style={{ color: "hsl(45, 60%, 72%)" }}>{duration}</p>
                )}
                {objectives.length > 0 && (
                  <ul className="mt-1.5 space-y-1 px-2">
                    {objectives.map((o, i) => (
                      <li key={i} className="flex gap-1.5 text-[10px] leading-snug" style={{ color: "hsl(45, 30%, 84%)" }}>
                        <span style={{ color: GOLD }}>•</span><span>{o}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* The training day this session belongs to */}
            {plan && (
              <section aria-label="Day agenda">
                <button onClick={() => setAgendaOpen(v => !v)} className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left" style={{ background: "hsl(230, 55%, 18%)", color: "hsl(45, 70%, 78%)" }}>
                  {agendaOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wide truncate">{plan.title}</span>
                </button>
                {agendaOpen && (
                  <div className="mt-1.5 space-y-1">
                    {agenda.map(block => {
                      const current = block.index === (session?.blockIndex || 0);
                      const label = block.module?.shortTitle || block.title;
                      const content = (
                        <>
                          <span className="block text-[10px] font-semibold tabular-nums" style={{ color: current ? "hsl(230, 70%, 12%)" : MUTED }}>
                            {block.startHHMM}
                          </span>
                          <span className="block text-[11px] font-medium leading-snug" style={{ color: current ? "hsl(230, 70%, 12%)" : "hsl(45, 40%, 88%)" }}>
                            {label}
                          </span>
                        </>
                      );
                      return block.module ? (
                        <button
                          key={block.index}
                          onClick={() => onGoToBlock(block.module, block.index)}
                          className="w-full rounded-lg px-2 py-1.5 text-left hover:opacity-90"
                          style={current ? { background: GOLD } : { background: NAVY_DEEP, border: LINE }}
                          title={`Start ${block.module.title}`}
                        >
                          {content}
                        </button>
                      ) : (
                        <div key={block.index} className="rounded-lg px-2 py-1.5" style={{ background: "hsl(230, 55%, 16%)" }}>
                          {content}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* The block running right now — what to say and what the room does */}
            {currentBlock && (currentBlock.cue || currentBlock.why || blockActivities.length > 0) && (
              <section aria-label="This block" className="space-y-1">
                <h2 className="mb-1.5 border-b px-2 pb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "hsl(45, 70%, 68%)", borderColor: "hsl(230, 45%, 24%)" }}>
                  This block
                </h2>
                {currentBlock.cue && (
                  <Row>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: GOLD }}>Say this</p>
                    <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "hsl(45, 40%, 90%)" }}>{currentBlock.cue}</p>
                  </Row>
                )}
                {currentBlock.why && (
                  <Row>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "hsl(45, 70%, 68%)" }}>Why here</p>
                    <p className="mt-1 text-[10px] leading-snug" style={{ color: "hsl(45, 30%, 84%)" }}>{currentBlock.why}</p>
                  </Row>
                )}
                {blockActivities.length > 0 && (
                  <Row>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "hsl(45, 70%, 68%)" }}>Room does in Test Mode</p>
                    <ul className="mt-1 space-y-1">
                      {blockActivities.map((a, i) => (
                        <li key={i} className="flex gap-1 text-[10px] leading-snug" style={{ color: "hsl(45, 30%, 84%)" }}>
                          <span style={{ color: GOLD }}>•</span>{a}
                        </li>
                      ))}
                    </ul>
                  </Row>
                )}
              </section>
            )}

            {/* Room briefing */}
            <button
              onClick={onOpenBriefing}
              className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left hover:opacity-90"
              style={{ background: "hsl(45, 92%, 53%, 0.14)", border: "1px solid hsl(45, 70%, 45%)", color: "hsl(45, 80%, 78%)" }}
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold leading-snug">Before the room arrives</span>
            </button>

            {/* Sections of the module */}
            <section aria-label="Sections">
              <h2 className="mb-1.5 border-b border-sidebar-border px-2 pb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "hsl(45, 70%, 68%)" }}>
                Sections
              </h2>
              <div className="space-y-1">
                {steps.map((step, i) => {
                  const current = i === stepIndex;
                  const isOpen = expanded === i;
                  return (
                    <div key={`${step.title}-${i}`} className="rounded-xl overflow-hidden" style={{ background: current ? GOLD : NAVY_DEEP, border: current ? "1px solid hsl(45, 92%, 60%)" : LINE }}>
                      <button
                        onClick={() => { setExpanded(isOpen ? null : i); if (!current) onJumpStep(i); }}
                        className="flex w-full items-start gap-1.5 px-2 py-2 text-left"
                      >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold" style={{ background: current ? "hsl(230, 70%, 12%)" : "hsl(230, 55%, 22%)", color: current ? GOLD : "hsl(45, 50%, 80%)" }}>
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 text-[11px] font-semibold leading-snug" style={{ color: current ? "hsl(230, 70%, 12%)" : "hsl(45, 40%, 90%)" }}>
                          {step.title}
                        </span>
                        {isOpen ? <ChevronDown className="h-3 w-3 shrink-0 mt-0.5" style={{ color: current ? "hsl(230, 70%, 25%)" : MUTED }} /> : <ChevronRight className="h-3 w-3 shrink-0 mt-0.5" style={{ color: current ? "hsl(230, 70%, 25%)" : MUTED }} />}
                      </button>
                      {isOpen && (
                        <div className="px-2 pb-2.5">
                          <p className="text-[11px] leading-relaxed" style={{ color: current ? "hsl(230, 60%, 20%)" : "hsl(45, 35%, 86%)" }}>
                            {getSectionNote(module, step)}
                          </p>
                          {!current && (
                            <button onClick={() => onJumpStep(i)} className="mt-1.5 flex items-center gap-1 text-[10px] font-bold" style={{ color: "hsl(45, 80%, 65%)" }}>
                              <Play className="h-3 w-3" /> Jump to this section
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Practice */}
            <section aria-label="Practice">
              <button onClick={onOpenPractice} className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left" style={{ background: "hsl(230, 55%, 18%)", color: "hsl(45, 70%, 78%)" }}>
                <ListChecks className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wide">Practice — coach the room</span>
              </button>
              {!!module.tasks?.length && (
                <div className="mt-1.5 space-y-1">
                  {module.tasks.map(task => (
                    <Row key={task.id}>
                      <p className="text-[11px] font-semibold" style={{ color: "hsl(45, 45%, 90%)" }}>{task.title}</p>
                      <p className="mt-0.5 text-[10px] leading-snug" style={{ color: MUTED }}>{getPracticeNote(module, task)}</p>
                    </Row>
                  ))}
                </div>
              )}
            </section>

            {/* Wrap-up + material */}
            <section aria-label="Tips and resources" className="space-y-1">
              {!!tips.length && (
                <Row>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "hsl(45, 70%, 68%)" }}>Tips</p>
                  <ul className="mt-1 space-y-1">
                    {tips.map((t, i) => (
                      <li key={i} className="text-[10px] leading-snug flex gap-1" style={{ color: "hsl(45, 35%, 86%)" }}>
                        <span style={{ color: GOLD }}>•</span>{t}
                      </li>
                    ))}
                  </ul>
                </Row>
              )}
              <Row>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "hsl(45, 70%, 68%)" }}>Resources</p>
                <div className="mt-1.5 space-y-1">
                  <button onClick={onOpenTour} className="flex w-full items-center gap-1.5 text-left text-[10px] font-medium" style={{ color: "hsl(45, 45%, 88%)" }}>
                    <Play className="h-3 w-3" style={{ color: GOLD }} /> Reopen the guided tour
                  </button>
                  {handouts.map(h => (
                    <button key={h.id} onClick={() => setHandout(h)} className="flex w-full items-center gap-1.5 text-left text-[10px] font-medium" style={{ color: "hsl(45, 45%, 88%)" }}>
                      <Printer className="h-3 w-3" style={{ color: GOLD }} /> {h.title}
                    </button>
                  ))}
                  <button onClick={onOpenBriefing} className="flex w-full items-center gap-1.5 text-left text-[10px] font-medium" style={{ color: "hsl(45, 45%, 88%)" }}>
                    <FileText className="h-3 w-3" style={{ color: GOLD }} /> Room checklist
                  </button>
                </div>
              </Row>
            </section>
          </div>

          <div className="shrink-0 p-2" style={{ borderTop: "1px solid hsl(230, 50%, 22%)" }}>
            <button
              onClick={onEndSession}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-bold hover:opacity-90"
              style={{ background: "hsl(0, 45%, 28%)", color: "hsl(0, 0%, 95%)" }}
            >
              <LogOut className="h-3.5 w-3.5" /> End session
            </button>
          </div>
        </div>
      </aside>

      <HandoutPrintDialog open={!!handout} handout={handout} plan={plan} onClose={() => setHandout(null)} />
    </>,
    document.body
  );
}