import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ArrowLeft, ArrowRight, Presentation } from "lucide-react";

// Find the element to spotlight. Falls back to null (centered card) so a
// tour never breaks when the UI shifts.
function findTarget(target) {
  if (!target) return null;
  const visible = (el) => el && el.getClientRects().length > 0;
  for (const selector of [].concat(target.selector || [])) {
    try {
      const el = document.querySelector(selector);
      if (visible(el)) return el;
    } catch { /* invalid selector — ignore */ }
  }
  if (target.text) {
    const nodes = [...document.querySelectorAll("a,button,h1,h2,h3,th,label,span,div")]
      .filter(el => visible(el) && (el.textContent || "").trim().startsWith(target.text));
    nodes.sort((a, b) => (a.textContent || "").trim().length - (b.textContent || "").trim().length);
    return nodes[0] || null;
  }
  return null;
}

export default function SpotlightTour({ open, module, progress, updateProgress, onClose, facilitator, onStepChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [presentation, setPresentation] = useState(false);

  const steps = module?.steps || [];
  const step = steps[index];
  // Facilitator tours keep their own step position so running a session never
  // disturbs the facilitator's own learner progress for the same module.
  const stepKey = `candora-tour-step${facilitator ? "-f" : ""}-${module?.key}`;
  const presentationKey = facilitator ? "candora-tour-presentation-f" : "candora-tour-presentation";

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

  // Navigate + spotlight the current step's target
  useEffect(() => {
    if (!open || !step) return;
    let cancelled = false;
    setRect(null);
    (async () => {
      if (step.path && !window.location.pathname.startsWith(step.path)) {
        navigate(step.path);
        await new Promise(r => setTimeout(r, 400));
      }
      if (cancelled) return;
      // Keep looking for the target for a few seconds — after a navigation the
      // page may still be mounting widgets or loading its data.
      let el = null;
      for (let i = 0; i < 16 && !cancelled; i++) {
        el = step.target ? findTarget(step.target) : null;
        if (el) break;
        await new Promise(r => setTimeout(r, 250));
      }
      if (cancelled) return;
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        await new Promise(r => setTimeout(r, 400));
      }
      if (cancelled) return;
      const el2 = step.target ? findTarget(step.target) : null;
      if (el2) {
        const r = el2.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
    })();
    return () => { cancelled = true; };
  }, [open, index, location.pathname]);

  // Keep the spotlight glued to the target while scrolling/resizing
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const s = steps[index];
      const el = s && s.target ? findTarget(s.target) : null;
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, index]);

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

  const pad = 8;
  const spotlightStyle = rect ? {
    position: "fixed",
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    borderRadius: 14,
    border: "2px solid hsl(45, 92%, 53%)",
    boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.74)",
    transition: "all 300ms ease",
    pointerEvents: "none",
    zIndex: 98,
  } : null;

  const cardW = presentation ? 580 : 440;
  const cardStyle = { position: "fixed", width: cardW, maxWidth: "calc(100vw - 32px)", zIndex: 100 };
  if (rect) {
    const below = rect.top + rect.height < window.innerHeight * 0.58;
    cardStyle.left = Math.min(Math.max(16, rect.left), Math.max(16, window.innerWidth - cardW - 16));
    if (below) cardStyle.top = rect.top + rect.height + 20;
    else cardStyle.bottom = window.innerHeight - rect.top + 20;
  } else {
    cardStyle.left = "50%";
    cardStyle.top = "50%";
    cardStyle.transform = "translate(-50%, -50%)";
  }

  return (
    <>
      {!rect && <div className="fixed inset-0 z-[97] bg-slate-950/75" />}
      {spotlightStyle && <div style={spotlightStyle} />}
      <div style={cardStyle}>
        <div className="rounded-2xl border shadow-2xl overflow-hidden" style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(230, 50%, 22%)" }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "hsl(230, 70%, 14%)", borderBottom: "1px solid hsl(230, 50%, 22%)" }}>
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
    </>
  );
}