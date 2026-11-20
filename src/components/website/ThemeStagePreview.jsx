import { useEffect, useState } from "react";
import { Ghost, Moon, Snowflake, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function useCountdown(target) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!target) return;
    const tick = () => setLeft(Math.max(0, new Date(target).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
}

function formatLeft(ms) {
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const pad = (value) => String(value).padStart(2, "0");
  return `${days}d ${pad(Math.floor((total % 86400) / 3600))}h ${pad(
    Math.floor((total % 3600) / 60)
  )}m ${pad(total % 60)}s`;
}

function Ornaments({ motif, accent }) {
  if (motif === "bats_and_pumpkins") {
    return (
      <>
        <Ghost className="absolute top-4 right-5 w-7 h-7 opacity-60" style={{ color: accent }} />
        <Moon className="absolute bottom-5 left-5 w-6 h-6 opacity-50" style={{ color: accent }} />
      </>
    );
  }
  if (motif === "snow_and_lights") {
    return (
      <>
        <Snowflake className="absolute top-4 right-5 w-7 h-7 opacity-60" style={{ color: accent }} />
        <Sparkles className="absolute bottom-5 left-5 w-6 h-6 opacity-50" style={{ color: accent }} />
      </>
    );
  }
  if (motif === "countdown") {
    return <Clock className="absolute top-4 right-5 w-7 h-7 opacity-60" style={{ color: accent }} />;
  }
  if (motif === "fireworks") {
    return (
      <>
        {[
          { top: "18%", left: "12%", delay: "0s" },
          { top: "28%", left: "72%", delay: "0.5s" },
          { top: "62%", left: "28%", delay: "1s" },
          { top: "52%", left: "84%", delay: "1.4s" },
        ].map((dot, index) => (
          <span
            key={index}
            className="absolute w-2.5 h-2.5 rounded-full animate-ping"
            style={{ top: dot.top, left: dot.left, background: accent, animationDelay: dot.delay }}
          />
        ))}
      </>
    );
  }
  return null;
}

// A small stand-in for the home page hero, drawn in the stage's own colours, so
// a stage can be judged before it is switched on.
export default function ThemeStagePreview({ stage, fallbackHeadline }) {
  const left = useCountdown(stage?.countdown_to);
  const palette = stage?.palette;
  const headline = stage?.hero_headline || fallbackHeadline || "Welcome to Candora";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 min-h-[150px] flex flex-col justify-end",
        !palette && "bg-muted/40 border-border"
      )}
      style={
        palette
          ? {
              background: `linear-gradient(155deg, ${palette.surface} 0%, ${palette.secondary} 100%)`,
              color: palette.ink,
              borderColor: palette.secondary,
            }
          : undefined
      }
    >
      <Ornaments motif={stage?.motif} accent={palette?.accent} />
      <div className="relative space-y-2">
        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold opacity-70">
          {stage?.label || "No theme"}
        </p>
        <p className="font-display text-xl font-bold leading-tight">{headline}</p>
        {stage?.countdown_to ? (
          <p
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold tabular-nums"
            style={{ background: palette?.primary, color: palette?.surface }}
          >
            <Clock className="w-3.5 h-3.5" /> {formatLeft(left)}
          </p>
        ) : (
          <p className="text-[11px] opacity-70">
            {stage?.fireworks
              ? "Fireworks behind the hero"
              : stage?.motif === "none" || !stage?.motif
              ? "Normal site colours"
              : "Seasonal decoration across the site"}
          </p>
        )}
      </div>
    </div>
  );
}