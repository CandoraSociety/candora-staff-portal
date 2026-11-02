import { useState } from "react";
import { GraduationCap, ListChecks, ClipboardCheck, LogOut, Map, PanelRightOpen, MonitorPlay } from "lucide-react";
import SpotlightTour from "@/components/training/SpotlightTour";
import PracticeChecklist from "@/components/training/PracticeChecklist";
import ConfirmDialog from "@/components/training/ConfirmDialog";
import FacilitatorSidebar from "@/components/training/facilitator/FacilitatorSidebar";
import FacilitatorStartPrompt from "@/components/training/facilitator/FacilitatorStartPrompt";
import { useTrainingTour } from "@/components/training/TrainingTourProvider";
import {
  readFacilitatorSession, endFacilitatedSession, goToFacilitatorBlock, wasBriefed, markBriefed,
} from "@/lib/training/facilitatorSession";
import { useMirrorBroadcast, clearMirrorRecord } from "@/lib/training/liveMirror";

// In-facilitation progress writes go nowhere: a facilitated session never
// creates or updates the facilitator's own TrainingProgress record.
const noopUpdate = async () => {};

// The facilitator's live control centre while a session runs on this portal:
// the projected tour in presentation mode, their own sidebar with the day's
// agenda and every section's talking point, and the practice checklist.
export default function FacilitatorSession({ module }) {
  const session = readFacilitatorSession();
  const { requestJump } = useTrainingTour();
  const [briefing, setBriefing] = useState(() => !wasBriefed(module.key));
  const [tourOpen, setTourOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [confirmExit, setConfirmExit] = useState(false);
  // "What the room sees" — reported by the tour: slide, wrap-up, or closed.
  const [stage, setStage] = useState("closed");
  const [mirrorOn, setMirrorOn] = useState(() => {
    try { return sessionStorage.getItem("candora-mirror-on") === "1"; } catch { return false; }
  });

  const plan = session?.plan || null;

  // Participants' screens follow this session only while a slide is on screen;
  // practice, tests, the quiz and the wrap-up pause it automatically.
  const broadcastStage = checklistOpen ? "practice" : stage;
  useMirrorBroadcast({ module, plan, on: mirrorOn, stepIndex, stage: broadcastStage });

  const mirrorLive = mirrorOn && broadcastStage === "slide";
  const mirrorCount = (plan?.attendees || []).length;

  const toggleMirror = () => {
    setMirrorOn(v => {
      const next = !v;
      try { sessionStorage.setItem("candora-mirror-on", next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  };

  const endSession = async () => {
    await clearMirrorRecord();
    endFacilitatedSession();
  };

  const begin = () => {
    markBriefed(module.key);
    setBriefing(false);
    setTourOpen(true);
  };

  // Jumping writes the position first so the tour's own restore can't land on
  // an older step; the request itself follows one tick later.
  const jumpTo = (index) => {
    setChecklistOpen(false);
    setTourOpen(true);
    try { sessionStorage.setItem(`candora-tour-step-f-${module.key}`, String(index)); } catch { /* ignore */ }
    setTimeout(() => requestJump(module.key, index), 0);
  };

  const openPractice = () => {
    setTourOpen(false);
    setChecklistOpen(true);
  };

  return (
    <>
      {/* Small screens only — the sidebar itself is docked on wider screens */}
      <div className="fixed bottom-4 left-4 z-[60] print:hidden md:hidden">
        <div className="training-window-glow rounded-2xl border shadow-2xl px-3 py-2.5 flex items-center gap-2 flex-wrap max-w-[calc(100vw-32px)]" style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(45, 60%, 45%)" }}>
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "hsl(45, 60%, 85%)" }}>
            <GraduationCap className="w-4 h-4" style={{ color: "hsl(45, 92%, 53%)" }} /> Facilitating
          </span>
          <button onClick={() => setTourOpen(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}>
            <Map className="w-3.5 h-3.5" /> Tour
          </button>
          <button onClick={toggleMirror} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold" style={mirrorOn ? { background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" } : { background: "hsl(230, 55%, 20%)", color: "hsl(45, 60%, 85%)" }}>
            <MonitorPlay className="w-3.5 h-3.5" /> Mirror {mirrorOn ? "on" : "off"}
          </button>
          <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: "hsl(230, 55%, 20%)", color: "hsl(45, 60%, 85%)" }}>
            <PanelRightOpen className="w-3.5 h-3.5" /> Notes
          </button>
          <button onClick={openPractice} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: "hsl(230, 55%, 20%)", color: "hsl(45, 60%, 85%)" }}>
            <ListChecks className="w-3.5 h-3.5" /> Practice
          </button>
          <button onClick={() => setBriefing(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: "hsl(230, 55%, 20%)", color: "hsl(45, 60%, 85%)" }}>
            <ClipboardCheck className="w-3.5 h-3.5" /> Checklist
          </button>
          <button onClick={() => setConfirmExit(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: "hsl(0, 45%, 28%)", color: "hsl(0, 0%, 95%)" }}>
            <LogOut className="w-3.5 h-3.5" /> End
          </button>
        </div>
      </div>

      <FacilitatorSidebar
        module={module}
        session={session}
        stepIndex={stepIndex}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        onJumpStep={jumpTo}
        onOpenTour={() => setTourOpen(true)}
        onOpenPractice={openPractice}
        onOpenBriefing={() => setBriefing(true)}
        onEndSession={() => setConfirmExit(true)}
        onGoToBlock={goToFacilitatorBlock}
        mirrorOn={mirrorOn}
        mirrorLive={mirrorLive}
        mirrorCount={mirrorCount}
        onToggleMirror={toggleMirror}
      />

      <FacilitatorStartPrompt
        open={briefing}
        module={module}
        plan={plan}
        onBegin={begin}
      />

      <SpotlightTour
        open={tourOpen}
        module={module}
        progress={null}
        updateProgress={noopUpdate}
        facilitator
        onStepChange={setStepIndex}
        onStage={setStage}
        onClose={(finished) => { setTourOpen(false); if (finished) openPractice(); }}
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
        onConfirm={endSession}
      />
    </>
  );
}