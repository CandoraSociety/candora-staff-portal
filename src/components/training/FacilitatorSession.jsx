import { useState } from "react";
import { GraduationCap, ListChecks, Map, LogOut, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import SpotlightTour from "@/components/training/SpotlightTour";
import PracticeChecklist from "@/components/training/PracticeChecklist";
import ConfirmDialog from "@/components/training/ConfirmDialog";
import { getFacilitatorGuide } from "@/lib/training/facilitatorGuide";
import { endFacilitatedSession } from "@/lib/training/facilitatorSession";
import useTrainingWindowDrag from "@/components/training/useTrainingWindowDrag";

// In-facilitation progress writes go nowhere: a facilitated session never
// creates or updates the facilitator's own TrainingProgress record.
const noopUpdate = async () => {};

// The facilitator's live control centre, shown (by TrainingPill) while a
// facilitated session is running on the current portal: the projected tour in
// presentation mode, a private talking-points panel, and the practice
// checklist for the hands-on portion.
export default function FacilitatorSession({ module }) {
  const [tourOpen, setTourOpen] = useState(true);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [notesOpen, setNotesOpen] = useState(true);
  const [confirmExit, setConfirmExit] = useState(false);
  const notesDrag = useTrainingWindowDrag(notesOpen, module.key);
  const controlsDrag = useTrainingWindowDrag(true, module.key);

  const guide = getFacilitatorGuide(module.key);
  const step = module.steps[stepIndex];
  const stepNote = guide?.stepNotes?.[step?.title] || "No extra talking points for this step — follow the on-screen text.";

  const exit = () => setConfirmExit(true);

  return (
    <>
      {/* Facilitator control bar */}
      <div ref={controlsDrag.ref} style={controlsDrag.style} className="fixed bottom-4 left-4 z-[60] print:hidden">
        <div {...controlsDrag.handleProps} className="training-window-glow rounded-2xl border shadow-2xl px-3 py-2.5 flex items-center gap-2 flex-wrap max-w-[calc(100vw-32px)] cursor-grab active:cursor-grabbing select-none touch-none" style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(45, 60%, 45%)" }}>
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "hsl(45, 60%, 85%)" }}>
            <GraduationCap className="w-4 h-4" style={{ color: "hsl(45, 92%, 53%)" }} /> Facilitating
          </span>
          <button
            onClick={() => { setChecklistOpen(false); setTourOpen(true); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors hover:opacity-80"
            style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
          >
            <Map className="w-3.5 h-3.5" /> Tour
          </button>
          <button
            onClick={() => { setTourOpen(false); setChecklistOpen(true); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors hover:opacity-80"
            style={{ background: "hsl(230, 55%, 20%)", color: "hsl(45, 60%, 85%)" }}
          >
            <ListChecks className="w-3.5 h-3.5" /> Practice
          </button>
          <button
            onClick={() => setNotesOpen(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors hover:opacity-80"
            style={{ background: notesOpen ? "hsl(45, 70%, 22%)" : "hsl(230, 55%, 20%)", color: "hsl(45, 60%, 85%)" }}
            title="Show or hide your talking-points panel"
          >
            {notesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />} Notes
          </button>
          <button
            onClick={exit}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors hover:opacity-80"
            style={{ background: "hsl(0, 45%, 28%)", color: "hsl(0, 0%, 95%)" }}
          >
            <LogOut className="w-3.5 h-3.5" /> End session
          </button>
        </div>
      </div>

      {/* Talking points — private to the facilitator, never projected */}
      {notesOpen && (
        <div ref={notesDrag.ref} style={notesDrag.style} className="fixed top-4 right-4 z-[99] w-[330px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] overflow-y-auto print:hidden">
          <div className="rounded-2xl border shadow-2xl overflow-hidden training-window-glow" style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(45, 60%, 45%)" }}>
            <div {...notesDrag.handleProps} className="flex items-center gap-2 px-4 py-2.5 cursor-grab active:cursor-grabbing select-none touch-none" style={{ background: "hsl(230, 70%, 14%)", borderBottom: "1px solid hsl(230, 50%, 22%)" }}>
              <Lightbulb className="w-4 h-4" style={{ color: "hsl(45, 92%, 53%)" }} />
              <span className="text-xs font-bold" style={{ color: "hsl(45, 60%, 85%)" }}>Your talking points</span>
            </div>
            <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
              {tourOpen && step && (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "hsl(45, 70%, 65%)" }}>
                    Step {stepIndex + 1} of {module.steps.length} — {step.title}
                  </p>
                  <p className="text-sm leading-relaxed mt-1.5" style={{ color: "hsl(45, 45%, 88%)" }}>{stepNote}</p>
                </>
              )}
              {checklistOpen && !!module.tasks?.length && (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "hsl(45, 70%, 65%)" }}>Practice — circulate and coach</p>
                  <div className="mt-2 space-y-2">
                    {module.tasks.map(t => (
                      <div key={t.id} className="rounded-xl p-2.5" style={{ background: "hsl(230, 60%, 13%)", border: "1px solid hsl(230, 45%, 22%)" }}>
                        <p className="text-xs font-semibold" style={{ color: "hsl(45, 50%, 90%)" }}>{t.title}</p>
                        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "hsl(230, 25%, 65%)" }}>
                          {guide?.practiceNotes?.[t.id] || t.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {!tourOpen && !checklistOpen && (
                <p className="text-sm" style={{ color: "hsl(230, 25%, 65%)" }}>
                  Open the Tour or Practice to see your notes for it.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <SpotlightTour
        open={tourOpen}
        module={module}
        progress={null}
        updateProgress={noopUpdate}
        facilitator
        onStepChange={setStepIndex}
        onClose={(finished) => { setTourOpen(false); if (finished) setChecklistOpen(true); }}
      />
      <PracticeChecklist
        open={checklistOpen}
        module={module}
        progress={null}
        updateProgress={noopUpdate}
        onClose={() => setChecklistOpen(false)}
      />

      <ConfirmDialog
        open={confirmExit}
        onOpenChange={(o) => !o && setConfirmExit(false)}
        title="End the facilitated session?"
        description="Demo data created during the session is discarded."
        confirmLabel="End session"
        destructive
        onConfirm={endFacilitatedSession}
      />
    </>
  );
}