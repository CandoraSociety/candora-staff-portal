import { useEffect, useState } from "react";
import { Snowflake, Clock, Sparkles, RotateCcw } from "lucide-react";

// The site's own colours, used for the "No theme" stage so the preview always
// shows the home page the way the website draws it.
const NORMAL_PALETTE = {
  surface: "#f2eee5",
  primary: "#f6d666",
  secondary: "#e5ddcd",
  accent: "#2b2de8",
  ink: "#2c2e43",
};

const NAV_ITEMS = ["Home", "About", "Programs", "Events", "Get Involved", "Contact", "Donate"];

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

// The decorations the website lays over the hero for each stage.
function Ornaments({ motif, accent }) {
  if (motif === "bats_and_pumpkins") {
    return (
      <>
        <Bat className="absolute top-2 left-3 w-7 h-7 opacity-80" style={{ color: "#0b0714" }} />
        <Bat className="absolute top-8 left-14 w-5 h-5 opacity-60" style={{ color: "#0b0714" }} />
        <Bat className="absolute top-3 left-1/2 w-6 h-6 opacity-50" style={{ color: "#0b0714" }} />
        <JackOLantern className="absolute bottom-8 left-4 w-9 h-9" />
        <JackOLantern className="absolute bottom-8 left-14 w-6 h-6 opacity-80" />
      </>
    );
  }
  if (motif === "snow_and_lights") {
    return (
      <>
        <Snowflake className="absolute top-3 left-4 w-6 h-6 opacity-80" style={{ color: accent }} />
        <Snowflake className="absolute top-9 left-14 w-4 h-4 opacity-60" style={{ color: accent }} />
        <span className="absolute top-2 left-3 right-3 h-[2px]" style={{ background: accent, opacity: 0.45 }} />
        {[12, 30, 48, 66, 84].map((left, index) => (
          <span
            key={left}
            className="absolute w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ top: 6, left: `${left}%`, background: accent, animationDelay: `${index * 0.3}s` }}
          />
        ))}
      </>
    );
  }
  if (motif === "countdown") {
    return <Clock className="absolute top-3 left-4 w-6 h-6 opacity-70" style={{ color: accent }} />;
  }
  if (motif === "fireworks") {
    return (
      <>
        {[
          { top: "16%", left: "10%", delay: "0s" },
          { top: "26%", left: "38%", delay: "0.5s" },
          { top: "18%", left: "70%", delay: "1s" },
          { top: "60%", left: "24%", delay: "1.4s" },
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

// A miniature of the website's home page hero, drawn with the real site content
// (headline, supporting line, button, hero photo, menu bar) in the stage's own
// colours, so a stage looks here exactly as it does on the site before it is
// switched on.
export default function ThemeStagePreview({ stage, site }) {
  // A countdown stage has a second half the calendar cannot show here: the
  // moment the clock reaches zero. This flips the same preview past midnight so
  // the fireworks and the new-year headline can be seen before December 31.
  const [atZero, setAtZero] = useState(false);
  useEffect(() => setAtZero(false), [stage?.id]);

  const left = useCountdown(stage?.countdown_to);
  const celebrating = !!stage?.countdown_to && atZero;
  const newYear = stage?.countdown_to ? new Date(stage.countdown_to).getUTCFullYear() : null;

  const palette = stage?.palette || NORMAL_PALETTE;
  const headline = celebrating
    ? `Happy New Year ${newYear}!`
    : stage?.hero_headline || site?.hero_headline || "Welcome to Candora";
  const subheadline = site?.hero_subheadline || "";
  const ctaLabel = site?.hero_cta_label || "";
  const heroImage = stage?.hero_image_url || site?.hero_image_url || "";
  const showCountdown = !!stage?.countdown_to && !celebrating;

  return (
    <div className="space-y-2">
      <div
        className="relative overflow-hidden rounded-xl border shadow-sm"
        style={{
          background: `linear-gradient(155deg, ${palette.surface} 0%, ${palette.secondary} 100%)`,
          color: palette.ink,
          borderColor: palette.secondary,
        }}
      >
        <Ornaments motif={celebrating ? "fireworks" : stage?.motif} accent={palette.accent} />

        <div className="relative flex items-center gap-3 p-4 pb-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-[9px] uppercase tracking-[0.18em] font-semibold opacity-70">
              {celebrating ? `${stage.label} — just after midnight` : stage?.label || "No theme"}
            </p>
            <p className="font-display text-base font-bold leading-tight">{headline}</p>
            {subheadline && (
              <p className="text-[10px] leading-snug opacity-75 line-clamp-2">{subheadline}</p>
            )}
            {showCountdown ? (
              <p
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold tabular-nums"
                style={{ background: palette.primary, color: palette.surface }}
              >
                <Clock className="w-3 h-3" /> {formatLeft(left)}
              </p>
            ) : (
              ctaLabel && (
                <span
                  className="inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold"
                  style={{ background: palette.primary, color: palette.surface }}
                >
                  {ctaLabel}
                </span>
              )
            )}
          </div>

          {heroImage && (
            <img
              src={heroImage}
              alt=""
              className="relative shrink-0 h-24 w-24 object-contain drop-shadow-md"
            />
          )}
        </div>

        {/* The site's menu bar, in the stage's own colour */}
        <div
          className="relative flex items-center justify-center gap-2.5 px-2 py-1.5"
          style={{ background: palette.primary, color: palette.surface }}
        >
          {NAV_ITEMS.map((item) => (
            <span key={item} className="text-[8px] font-bold uppercase tracking-wide whitespace-nowrap">
              {item}
            </span>
          ))}
        </div>
      </div>

      {stage?.countdown_to && (
        <button
          type="button"
          onClick={() => setAtZero((value) => !value)}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted"
        >
          {atZero ? (
            <>
              <RotateCcw className="w-3 h-3" /> Back to the countdown
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" /> See the moment it hits zero
            </>
          )}
        </button>
      )}
    </div>
  );
}