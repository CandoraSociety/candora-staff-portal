import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play, Pause, RotateCcw, Volume2, VolumeX,
  Building2, Layers, LayoutDashboard, Hammer,
} from "lucide-react";

// ── "What is the Candora Staff Portal?" explainer ──────────────────────────
// A scripted, scene-based intro that plays like a video inside the training
// card — using Candora's real logo and branding. Narration is the browser's
// built-in text-to-speech (toggleable), so the copy is the single source of
// truth for what's said and shown.

const LOGO_URL = "https://media.base44.com/images/public/6a249282cb496579542673b7/418f6d576_logo.png";

const SCENES = [
  {
    kicker: "Candora Staff Portal",
    title: "This is where your workday begins.",
    body: "The one place you'll sign into at the start of every work day.",
    seconds: 7,
    logo: true,
  },
  {
    kicker: "First things first",
    title: "What's an \"ERP\"?",
    body: "ERP stands for Enterprise Resource Planning — a fancy name for the one central system an organization runs its day-to-day operations on, instead of a pile of separate programs. The Candora Staff Portal is our complete ERP.",
    seconds: 11,
    Icon: Building2,
  },
  {
    kicker: "Our complete software suite",
    title: "All of Candora's software, in one place.",
    body: "Client files, programs, HR, finance, training, the board — almost everything we do administratively, day to day, is completed right here in the portal.",
    seconds: 10,
    Icon: Layers,
  },
  {
    kicker: "Your workspace",
    title: "One portal for each part of the job.",
    body: "Inside, the work is organized into portals — like Pathways, the Resource Centre or Finance. Each one is its own workspace, with its own pages, tools and records.",
    seconds: 10,
    Icon: LayoutDashboard,
  },
  {
    kicker: "Still growing",
    title: "A few functions are still being built.",
    body: "They'll live here too. For now, remember: one login, everything you need.",
    seconds: 8,
    Icon: Hammer,
  },
];

const TOTAL = SCENES.reduce((s, x) => s + x.seconds, 0);
const sceneAt = (t) => {
  let acc = 0;
  for (let i = 0; i < SCENES.length; i++) {
    acc += SCENES[i].seconds;
    if (t < acc) return { index: i, within: t - (acc - SCENES[i].seconds) };
  }
  return { index: SCENES.length - 1, within: SCENES[SCENES.length - 1].seconds };
};

export default function PortalIntroExplainer() {
  const [playing, setPlaying] = useState(true);
  const [narrate, setNarrate] = useState(false);
  const [t, setT] = useState(0); // seconds elapsed
  const spokenScene = useRef(-1);

  // Playback clock
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setT((prev) => {
        const next = +(prev + 0.1).toFixed(1);
        if (next >= TOTAL) { setPlaying(false); return TOTAL; }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing]);

  const { index, within } = sceneAt(t);
  const scene = SCENES[index];
  const ended = t >= TOTAL;

  // Narration — the browser's built-in speech, per scene
  const speak = (s) => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`${s.title} ${s.body}`);
      u.rate = 1;
      window.speechSynthesis.speak(u);
    } catch { /* speech not available — silent fallback */ }
  };
  useEffect(() => {
    if (!narrate || !playing || ended) {
      try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
      spokenScene.current = -1;
      return;
    }
    if (spokenScene.current !== index) {
      spokenScene.current = index;
      speak(scene);
    }
  }, [narrate, playing, index, ended, scene]);
  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } }, []);

  const togglePlay = () => {
    if (ended) { setT(0); setPlaying(true); return; }
    spokenScene.current = -1; // re-speak current scene on resume
    setPlaying(!playing);
  };
  const replay = () => { setT(0); spokenScene.current = -1; setPlaying(true); };
  const toggleNarration = () => {
    const v = !narrate;
    setNarrate(v);
    if (!v) { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } }
  };

  return (
    <div className="mb-3 rounded-xl overflow-hidden border" style={{ borderColor: "hsl(230, 50%, 22%)" }}>
      <div
        className="relative w-full flex flex-col items-center justify-center text-center px-6"
        style={{ aspectRatio: "16 / 9", background: "radial-gradient(circle at 50% 30%, hsl(230, 60%, 18%), hsl(230, 70%, 9%))" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-1.5"
          >
            {scene.logo && (
              <img src={LOGO_URL} alt="Candora" className="h-14 mb-1 object-contain" />
            )}
            {scene.Icon && <scene.Icon className="w-7 h-7 mb-0.5" style={{ color: "hsl(45, 92%, 60%)" }} />}
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(45, 92%, 60%)" }}>
              {scene.kicker}
            </p>
            <p className="text-sm font-bold max-w-md" style={{ color: "hsl(45, 50%, 96%)" }}>
              {scene.title}
            </p>
            <p className="text-[11px] leading-snug max-w-md" style={{ color: "hsl(45, 45%, 85%)" }}>
              {scene.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress + controls */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: "hsl(230, 70%, 14%)" }}>
        <button onClick={togglePlay} className="p-1 rounded hover:opacity-70" style={{ color: "hsl(45, 92%, 60%)" }} title={ended ? "Replay" : playing ? "Pause" : "Play"}>
          {ended ? <RotateCcw className="w-4 h-4" /> : playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <div className="flex gap-1 flex-1">
          {SCENES.map((s, i) => (
            <div key={i} className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: "hsl(230, 40%, 30%)" }}>
              <div className="h-full rounded-full" style={{ width: `${i < index ? 100 : i === index ? Math.min(100, (within / s.seconds) * 100) : 0}%`, background: "hsl(45, 92%, 53%)" }} />
            </div>
          ))}
        </div>
        <button onClick={toggleNarration} className="p-1 rounded hover:opacity-70" style={{ color: narrate ? "hsl(45, 92%, 60%)" : "hsl(230, 30%, 60%)" }} title="Voice narration">
          {narrate ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
        <span className="text-[10px] tabular-nums" style={{ color: "hsl(230, 25%, 55%)" }}>
          {index + 1}/{SCENES.length}
        </span>
      </div>
    </div>
  );
}