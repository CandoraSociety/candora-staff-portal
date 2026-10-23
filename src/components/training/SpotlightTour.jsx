import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ArrowLeft, ArrowRight, Presentation, Volume2, Square } from "lucide-react";
import useSpotlightTarget from "@/components/training/useSpotlightTarget";
import { spotlightPath } from "@/components/training/spotlightTarget";
import { STEP_AUDIO } from "@/lib/training/portalStepAudio";
import { useTrainingTour } from "@/components/training/TrainingTourProvider";
import SpotlightOverlay from "@/components/training/SpotlightOverlay";
import useTrainingWindowDrag from "@/components/training/useTrainingWindowDrag";
import TourVideo from "@/components/training/TourVideo";
import DemoClientScene from "@/components/training/DemoClientScene";
import PortalIntroExplainer from "@/components/training/PortalIntroExplainer";


export default function SpotlightTour({ open, module, progress, updateProgress, onClose, facilitator, onStepChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setRevealedWidget, setRevealedNavPath, setWidgetsWalkthrough, jumpRequest } = useTrainingTour();
  const [index, setIndex] = useState(0);
  const [presentation, setPresentation] = useState(false);
  const [reading, setReading] = useState(false);
  const audioRef = useRef(null);
  const drag = useTrainingWindowDrag(open, module?.key);

  // Read-aloud narration for the current slide (intro steps play their own)
  const stepAudioUrl = STEP_AUDIO[module?.key]?.[index] || null;
  const stopReading = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setReading(false);
  };
  useEffect(() => { stopReading(); }, [index, module?.key]);
  useEffect(() => () => stopReading(), []);
  const toggleRead = () => {
    if (reading) { stopReading(); return; }
    if (!stepAudioUrl) return;
    const audio = new Audio(stepAudioUrl);
    audioRef.current = audio;
    audio.onended = () => stopReading();
    audio.onerror = () => setReading(false);
    audio.play().then(() => setReading(true)).catch(() => setReading(false));
  };

  const steps = module?.steps || [];
  const step = steps[index];
  const path = spotlightPath(module, index);
  // Steps that live on dynamic pages (a client file sits at /pathways/client/:id)
  // declare a routePrefix instead of a fixed path: the slide stays on whichever
  // matching page the learner opened, and falls back to the last fixed route
  // when none is open.
  const onRoute = step?.routePrefix
    ? location.pathname.startsWith(step.routePrefix)
    : location.pathname === path;
  // Every step that lands on a page also highlights the sidebar tab that page
  // lives under, so learners see where the function lives in the navigation.
  // Steps that already list the nav item (or target it directly) are skipped.
  const target = useMemo(() => {
    if (!step?.target || !path || path === "/") return step?.target;
    const navSelector = `[data-tour-path="${path}"]`;
    if (step.target.selector === navSelector || (step.target.additionalSelectors || []).includes(navSelector)) return step.target;
    return { ...step.target, additionalSelectors: [...(step.target.additionalSelectors || []), navSelector] };
  }, [step, path]);
  // The intro "video" plays centered with the full screen for itself: docking
  // it beside its spotlight target caps the window's height to the space left
  // around that sidebar item, which is far too short for the scene and forced
  // the slide to scroll. Intro steps get no spotlight; the card centers instead.
  const isIntro = !!step?.introExplainer;
  // Demo-client scene slides play like a short video; like the intro, they get
  // the whole screen for the card so the scene and its text never scroll.
  const isFullCard = isIntro || !!step?.demoClient;
  const focus = useSpotlightTarget(open && !isFullCard && onRoute, target, `${module?.key}:${index}`);
  const rect = isFullCard ? null : focus?.rect || null;
  // Demo-client scene slides are narrated like a video: the audio starts by
  // itself (there is still the read-aloud button to pause or replay it).
  useEffect(() => {
    if (!open || !step?.demoClient || !stepAudioUrl) return;
    const audio = new Audio(stepAudioUrl);
    audioRef.current = audio;
    audio.onended = () => stopReading();
    audio.onerror = () => setReading(false);
    audio.play().then(() => setReading(true)).catch(() => setReading(false));
    return () => { if (audioRef.current === audio) { audio.pause(); audioRef.current = null; } };
  }, [open, step?.demoClient, stepAudioUrl]);
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

  // While the Dashboard Widgets walkthrough spotlights a specific widget card,
  // the Add Functions page shows every card as it looks when turned on.
  useEffect(() => {
    const on = open && module?.key === "dashboard_widgets"
      && String(step?.target?.selector || "").includes("data-tour-widget");
    setWidgetsWalkthrough(on);
    return () => setWidgetsWalkthrough(false);
  }, [open, module?.key, step?.target?.selector, setWidgetsWalkthrough]);

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
  // The tour routes only when the step changes — once the slide's page is
  // open, the learner can click around freely (the slides invite them to)
  // without the tour snapping them back to the slide's route.
  const routedStep = useRef(null);
  useEffect(() => {
    if (!open || !step || onRoute) return;
    const stepId = `${module?.key}:${index}`;
    if (routedStep.current === stepId) return;
    routedStep.current = stepId;
    // A routePrefix slide with no matching page open (e.g. the learner never
    // opened a client file) opens its demo fallback instead, so the slide
    // always has something real to spotlight.
    navigate(step.routeFallback || path);
  }, [open, step, path, index, location.pathname, navigate]);

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

  const cardW = isFullCard ? 760 : presentation ? 660 : 560;
  const cardStyle = { position: "fixed", width: cardW, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100vh - 32px)", display: "flex", flexDirection: "column", overflowY: "hidden", zIndex: 100 };
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
        <div className="rounded-2xl border shadow-2xl overflow-hidden training-window-glow flex min-h-0 w-full flex-1 flex-col" style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(230, 50%, 22%)" }}>
          <div {...drag.handleProps} className="flex shrink-0 items-center justify-between px-4 py-2.5 cursor-grab active:cursor-grabbing select-none touch-none" style={{ background: "hsl(230, 70%, 14%)", borderBottom: "1px solid hsl(230, 50%, 22%)" }}>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}>
                {module.shortTitle || module.title}
              </span>
              <span className={`font-semibold ${presentation ? "text-base" : "text-xs"}`} style={{ color: "hsl(45, 60%, 80%)" }}>
                Step {index + 1} of {steps.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {stepAudioUrl && (
                <button
                  onClick={toggleRead}
                  className="p-1.5 rounded-lg hover:opacity-70 flex items-center gap-1"
                  style={{ color: reading ? "hsl(45, 92%, 53%)" : "hsl(230, 30%, 60%)" }}
                  title={reading ? "Stop reading aloud" : "Read this slide aloud"}
                >
                  {reading ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {reading && <span className="text-[10px] font-semibold">Reading</span>}
                </button>
              )}
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

          <div className={`flex-1 min-h-0 overflow-y-auto ${presentation ? "p-6" : "p-4"}`}>
            {!step.introExplainer && (
              <h3 className={`font-bold mb-2 ${presentation ? "text-2xl" : "text-base"}`} style={{ color: "hsl(45, 92%, 65%)" }}>
                {step.title}
              </h3>
            )}
            {step.introExplainer && <PortalIntroExplainer moduleKey={module.key} />}
            {step.video && <TourVideo src={step.video} />}
            {step.demoClient && <DemoClientScene client={step.demoClient} playing={reading} />}
            <p className={presentation ? "text-lg leading-relaxed" : "text-sm leading-relaxed"} style={{ color: "hsl(45, 45%, 88%)" }}>
              {step.body}
            </p>
            {rect && focus?.interactive && (
              <p className="mt-2 text-[11px] italic" style={{ color: "hsl(230, 25%, 55%)" }}>
                The highlighted area is live — click it to try it yourself, then come back and press Next.
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between px-4 py-3" style={{ borderTop: "1px solid hsl(230, 50%, 22%)" }}>
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