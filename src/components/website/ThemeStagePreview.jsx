import { useEffect, useState } from "react";
import { Snowflake, Clock } from "lucide-react";
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

// A bat silhouette: body, two swept wings and the ears, drawn from primitives so
// it always reads as a bat rather than a stand-in icon.
function Bat({ className, style }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
      <ellipse cx="12" cy="12" rx="2.2" ry="2.6" />
      <polygon points="9.9,11 2,7.6 4.3,13.8 9.9,14.2" />
      <polygon points="14.1,11 22,7.6 19.7,13.8 14.1,14.2" />
      <polygon points="10.6,9.6 10,6.8 12,9.1" />
      <polygon points="13.4,9.6 14,6.8 12,9.1" />
    </svg>
  );
}

// A carved jack-o'-lantern, so the Halloween stage shows a pumpkin and not an
// abstract autumn icon.
function JackOLantern({ className, style }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <rect x="10.9" y="4.2" width="2.2" height="3.4" rx="1" fill="#4d7c0f" />
      <ellipse cx="12" cy="14" rx="9" ry="7.6" fill="#f97316" />
      <ellipse cx="12" cy="14" rx="3.6" ry="7.6" fill="#ea580c" opacity="0.55" />
      <ellipse cx="6.4" cy="14" rx="2" ry="6.6" fill="#fb923c" opacity="0.5" />
      <ellipse cx="17.6" cy="14" rx="2" ry="6.6" fill="#fb923c" opacity="0.5" />
      <polygon points="8.6,12.2 11.2,12.2 9.9,14.4" fill="#1b1030" />
      <polygon points="12.8,12.2 15.4,12.2 14.1,14.4" fill="#1b1030" />
      <polygon points="9.4,16.2 14.6,16.2 13.2,19 10.8,19" fill="#1b1030" />
    </svg>
  );
}

function Ornaments({ motif, accent }) {
  if (motif === "bats_and_pumpkins") {
    return (
      <>
        <Bat className="absolute top-3 left-4 w-8 h-8 opacity-70" style={{ color: "#0b0714" }} />
        <Bat className="absolute top-7 left-16 w-5 h-5 opacity-50" style={{ color: "#0b0714" }} />
        <Bat className="absolute top-4 right-24 w-6 h-6 opacity-45" style={{ color: "#0b0714" }} />
        <JackOLantern className="absolute bottom-2 right-3 w-12 h-12" />
        <JackOLantern className="absolute bottom-1 right-14 w-7 h-7 opacity-80" />
      </>
    );
  }
  if (motif === "snow_and_lights") {
    return (
      <>
        <Snowflake className="absolute top-4 right-5 w-7 h-7 opacity-70" style={{ color: accent }} />
        <span className="absolute top-4 left-4 right-16 h-[2px]" style={{ background: accent, opacity: 0.5 }} />
        {[10, 28, 46, 64, 82].map((left, index) => (
          <span
            key={left}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{ top: 18, left: `${left}%`, background: accent, animationDelay: `${index * 0.3}s` }}
          />
        ))}
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

// A small stand-in for the home page hero, drawn in the stage's own colours and
// with its own hero photo, so a stage can be judged before it is switched on.
export default function ThemeStagePreview({ stage, fallbackHeadline, fallbackImage }) {
  const left = useCountdown(stage?.countdown_to);
  const palette = stage?.palette;
  const headline = stage?.hero_headline || fallbackHeadline || "Welcome to Candora";
  const heroImage = stage?.hero_image_url || fallbackImage || "";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 min-h-[150px] flex items-center gap-4",
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

      <div className="relative space-y-2 min-w-0 flex-1">
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
              : stage?.hero_image_url
              ? "Seasonal hero photo replaces the sunflower"
              : stage?.motif === "none" || !stage?.motif
              ? "Normal site colours"
              : "Seasonal decoration across the site"}
          </p>
        )}
      </div>

      {heroImage && (
        <div className="relative shrink-0 w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/15">
          <img src={heroImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}