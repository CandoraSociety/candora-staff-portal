import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Maximize2, MonitorUp } from "lucide-react";
import SpotlightTour from "@/components/training/SpotlightTour";
import { getTrainingModule } from "@/lib/training/trainingModules";
import { isPresenterWindow, readPresentation, subscribePresentation } from "@/lib/training/presenter";

const noopUpdate = async () => {};

// Shown only in the window the facilitator opened for the plugged-in screen.
// Nothing here writes progress or session state: it is a display.
function PresenterBar() {
  const [full, setFull] = useState(() => !!document.fullscreenElement);

  useEffect(() => {
    const onChange = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (full) return null;

  return (
    <div
      className="fixed bottom-3 right-3 z-[10020] flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-lg print:hidden"
      style={{ background: "hsl(230, 70%, 12%)", borderColor: "hsl(45, 60%, 45%)", color: "hsl(45, 60%, 85%)" }}
    >
      <MonitorUp className="h-3.5 w-3.5" style={{ color: "hsl(45, 92%, 53%)" }} />
      <span className="text-[11px] font-semibold">Presentation screen</span>
      <button
        onClick={() => document.documentElement.requestFullscreen?.()}
        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
        style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
      >
        <Maximize2 className="h-3 w-3" /> Full screen
      </button>
    </div>
  );
}

export default function TrainingPresenter() {
  const active = isPresenterWindow();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState(() => (active ? readPresentation() : null));

  useEffect(() => {
    if (!active) return;
    setState(readPresentation());
    return subscribePresentation(setState);
  }, [active]);

  // Follow the facilitator around the app — the room sees the same page.
  const path = state?.path;
  useEffect(() => {
    if (!active || !path) return;
    if (path !== `${location.pathname}${location.search}`) navigate(path);
  }, [active, path, location.pathname, location.search, navigate]);

  // This window carries the screen, so it drops the staff chrome: no sidebar,
  // top bar or tab bar — just the portal and the slide. Slides that teach the
  // sidebar or the top bar bring them back for that step.
  const chromeRevealed = useMemo(() => {
    const m = state?.module_key ? getTrainingModule(state.module_key) : null;
    const step = m?.steps?.[state?.step_index || 0];
    const selectors = [].concat(step?.target?.selector || [], step?.target?.selectors || []);
    return selectors.some(s => /sidebar|topbar|global-tabbar|tabbar/.test(String(s)));
  }, [state?.module_key, state?.step_index]);

  useEffect(() => {
    if (!active) return undefined;
    document.body.classList.add("presenter-screen");
    return () => {
      document.body.classList.remove("presenter-screen");
      document.body.classList.remove("presenter-chrome");
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    document.body.classList.toggle("presenter-chrome", chromeRevealed);
  }, [active, chromeRevealed]);

  if (!active) return null;

  const module = state?.module_key ? getTrainingModule(state.module_key) : null;
  const showSlide = !!module && !!state?.open && state?.stage === "slide";

  return (
    <>
      <PresenterBar />
      <SpotlightTour
        open={showSlide}
        module={module}
        progress={null}
        updateProgress={noopUpdate}
        mirror
        presenter
        mirrorStep={state?.step_index || 0}
        onClose={() => {}}
      />
    </>
  );
}