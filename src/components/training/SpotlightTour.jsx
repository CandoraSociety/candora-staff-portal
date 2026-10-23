import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ArrowLeft, ArrowRight, Presentation } from "lucide-react";
import useSpotlightTarget from "@/components/training/useSpotlightTarget";
import { spotlightPath } from "@/components/training/spotlightTarget";
import { useTrainingTour } from "@/components/training/TrainingTourProvider";
import SpotlightOverlay from "@/components/training/SpotlightOverlay";
import useTrainingWindowDrag from "@/components/training/useTrainingWindowDrag";


export default function SpotlightTour({ open, module, progress, updateProgress, onClose, facilitator, onStepChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setRevealedWidget, setRevealedNavPath, jumpRequest } = useTrainingTour();
  const [index, setIndex] = useState(0);
  const [presentation, setPresentation] = useState(false);
  const drag = useTrainingWindowDrag(open, module?.key);

  const steps = module?.steps || [];
  const step = steps[index];
  const path = spotlightPath(module, index);
  const rect = useSpotlightTarget(open && location.pathname === path, step?.target, `${module?.key}:${index}`);
  // Facilitator tours keep their own step position so running a session never
  // disturbs the facilitator's own learner progress for the same module.
  const stepKey = `candora-tour-step${facilitator ? "-f" : ""}-${module?.key}`;
  const presentationKey = facilitator ? "candora-tour-presentation-f" : "candora-tour-presentation";

  // Sidebar navigation — jump straight to a chosen step of this module's tour
  useEffect(() => {
    if (!jumpRequest || jumpRequest.moduleKey !== module?.key) return;
    const total = module.steps?.length || 1;
    const i = Math.max(0, Math.min(total - 1, jumpRequest.stepIndex));
    setIndex(i);
    try { sessionStorage.setItem(stepKey, String(i)); } catch { /* ignore */ }
  }, [jumpRequest?.token]);

  // Optional widgets must exist on screen before the spotlight can measure them.
  useEffect(() => {
    setRevealedWidget(open ? step?.revealWidget || null : null);
    return () => setRevealedWidget(null);
  }, [open, step?.revealWidget, setRevealedWidget]);

  // Keep hover-only sidebar sub-tabs visible while their tour step is open.
  useEffect(() => {
    setRevealedNavPath(open ? step?.revealNav || null : null);
    return () => setRevealedNavPath(null);
  }, [open, step?.revealNav, setRevealedNavPath]);

  // Report the current step to the facilitator's talking-points panel
  useEffect(() => {
    if (open) onStepChange?.(index);
  }, [open, index]);

  // Restore position + presentation preference when the tour opens
  useEffect(() => {
    if (!open || !module) return;
    try {
      const saved = Number(sessionStorage.getItem(stepKey)) || 0;
      setIndex(saved < steps.length ? saved : 0);
      setPresentation(facilitator ? sessionStorage.getItem(presentationKey) !== "0" : sessionStorage.getItem(presentationKey) === "1");
    } catch { /* ignore */ }
  }, [open, module?.key]);

  // Slides without their own route inherit the last route in the module,
  // not whichever page happened to be open when training was started.
  useEffect(() => {
    if (open && step && location.pathname !== path) navigate(path);
  }, [open, step, path, location.pathname, navigate]);

  if (!open || !module || !step) return null;

  const saveStep = (i) => {
    try { sessionStorage.setItem(stepKey, String(i)); } catch { /* ignore */ }
  };

  const next = async () => {
    if (index < steps.length - 1) {
      const i = index + 1;
      saveStep(i);
      setIndex(i);
    } else {
      try { sessionStorage.removeItem(stepKey); } catch { /* ignore */ }
      await updateProgress({ tour_done: true, tour_step_index: 0 });
      onClose(true);
    }
  };

  const back = () => {
    const i = Math.max(0, index - 1);
    saveStep(i);
    setIndex(i);
  };

  const togglePresentation = () => {
    const v = !presentation;
    setPresentation(v);
    try { sessionStorage.setItem(presentationKey, v ? "1" : "0"); } catch { /* ignore */ }
  };

  const cardW = presentation ? 580 : 440;
  const cardStyle = { position: "fixed", width: cardW, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100vh - 32px)", overflowY: "auto", zIndex: 100 };
  if (rect) {
    const below = window.innerHeight - rect.top - rect.height - 20;
    const above = rect.top - 20;
    const needed = presentation ? 400 : 300;
    cardStyle.left = Math.min(Math.max(16, rect.left), Math.max(16, window.innerWidth - cardW - 16));
    if (step.revealNav && window.innerWidth - rect.left - rect.width - 36 >= cardW) {
      cardStyle.left = rect.left + rect.width + 20;
      cardStyle.top = Math.max(16, Math.min(rect.top, window.innerHeight - needed - 16));
      cardStyle.maxHeight = window.innerHeight - cardStyle.top - 16;
    } else if (below >= needed) {
      cardStyle.top = rect.top + rect.height + 20;
      cardStyle.maxHeight = below - 16;
    } else if (above >= needed) {
      cardStyle.bottom = window.innerHeight - rect.top + 20;
      cardStyle.maxHeight = above - 16;
    } else {
      // Tall sections leave no room above or below; keep the slide controls on screen.
      cardStyle.bottom = 16;
    }
  } else {
    cardStyle.left = "50%";
    cardStyle.top = "50%";
    cardStyle.transform = "translate(-50%, -50%)";
  }

  return createPortal(
    <div data-training-tour className="print:hidden">
      <SpotlightOverlay rect={rect} />
      <div ref={drag.ref} style={{ ...cardStyle, ...drag.style }}>
        <div className="rounded-2xl border shadow-2xl overflow-hidden training-window-glow" style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(230, 50%, 22%)" }}>
          <div {...drag.handleProps} className="flex items-center justify-between px-4 py-2.5 cursor-grab active:cursor-grabbing select-none touch-none" style={{ background: "hsl(230, 70%, 14%)", borderBottom: "1px solid hsl(230, 50%, 22%)" }}>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}>
                {module.shortTitle || module.title}
              </span>
              <span className={`font-semibold ${presentation ? "text-base" : "text-xs"}`} style={{ color: "hsl(45, 60%, 80%)" }}>
                Step {index + 1} of {steps.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={togglePresentation}
                className="p-1.5 rounded-lg hover:opacity-70 flex items-center gap-1"
                style={{ color: presentation ? "hsl(45, 92%, 53%)" : "hsl(230, 30%, 60%)" }}
                title="Presentation mode — larger text for facilitated group training"
              >
                <Presentation className="w-4 h-4" />
                {presentation && <span className="text-[10px] font-semibold">Presenting</span>}
              </button>
              <button
                onClick={() => { saveStep(index); onClose(false); }}
                className="p-1.5 rounded-lg hover:opacity-70"
                style={{ color: "hsl(230, 30%, 60%)" }}
                title="Exit tour (progress is saved)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={presentation ? "p-6" : "p-4"}>
            <h3 className={`font-bold mb-2 ${presentation ? "text-2xl" : "text-base"}`} style={{ color: "hsl(45, 92%, 65%)" }}>
              {step.title}
            </h3>
            <p className={presentation ? "text-lg leading-relaxed" : "text-sm leading-relaxed"} style={{ color: "hsl(45, 45%, 88%)" }}>
              {step.body}
            </p>
            {rect && (
              <p className="mt-2 text-[11px] italic" style={{ color: "hsl(230, 25%, 55%)" }}>
                The highlighted area is live — click it to try it yourself, then come back and press Next.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid hsl(230, 50%, 22%)" }}>
            <button
              onClick={back}
              disabled={index === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80 disabled:opacity-30"
              style={{ color: "hsl(230, 30%, 60%)" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === index ? "hsl(45, 92%, 53%)" : "hsl(230, 40%, 30%)" }} />
              ))}
            </div>
            <button
              onClick={next}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold text-xs transition-colors hover:opacity-80"
              style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
            >
              {index === steps.length - 1 ? "Start practice" : "Next"} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}