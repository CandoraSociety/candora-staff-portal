import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Snowflake, Clock, Sparkles, RotateCcw, Phone, Mail } from "lucide-react";

// The site's own colours, used for the "No theme" stage so the preview always
// shows the home page the way the website draws it.
const NORMAL_PALETTE = {
  surface: "#f2eee5",
  primary: "#f6d666",
  secondary: "#e5ddcd",
  accent: "#2b2de8",
  ink: "#2c2e43",
};

const FALLBACK_MENU = ["Home", "About", "Programs", "Contact"];

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

function countdownParts(ms) {
  const total = Math.floor(ms / 1000);
  const pad = (value) => String(value).padStart(2, "0");
  return [
    { label: "Days", value: pad(Math.floor(total / 86400)) },
    { label: "Hours", value: pad(Math.floor((total % 86400) / 3600)) },
    { label: "Minutes", value: pad(Math.floor((total % 3600) / 60)) },
    { label: "Seconds", value: pad(total % 60) },
  ];
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
        <Bat className="absolute top-4 left-6 w-9 h-9 opacity-80" style={{ color: "#0b0714" }} />
        <Bat className="absolute top-12 left-20 w-6 h-6 opacity-60" style={{ color: "#0b0714" }} />
        <Bat className="absolute top-5 left-1/2 w-8 h-8 opacity-50" style={{ color: "#0b0714" }} />
        <JackOLantern className="absolute bottom-4 left-6 w-12 h-12" />
        <JackOLantern className="absolute bottom-4 left-20 w-8 h-8 opacity-80" />
      </>
    );
  }
  if (motif === "snow_and_lights") {
    return (
      <>
        <Snowflake className="absolute top-5 left-6 w-8 h-8 opacity-80" style={{ color: accent }} />
        <Snowflake className="absolute top-12 left-20 w-5 h-5 opacity-60" style={{ color: accent }} />
        <span className="absolute top-3 left-4 right-4 h-[2px]" style={{ background: accent, opacity: 0.45 }} />
        {[10, 22, 34, 46, 58, 70, 82, 94].map((left, index) => (
          <span
            key={left}
            className="absolute w-2 h-2 rounded-full animate-pulse"
            style={{ top: 8, left: `${left}%`, background: accent, animationDelay: `${index * 0.25}s` }}
          />
        ))}
      </>
    );
  }
  if (motif === "countdown") {
    return (
      <>
        <Clock className="absolute top-5 left-6 w-8 h-8 opacity-70" style={{ color: accent }} />
        {[
          { top: "22%", left: "14%", delay: "0.2s" },
          { top: "64%", left: "8%", delay: "1.1s" },
          { top: "30%", left: "92%", delay: "0.7s" },
        ].map((dot) => (
          <span
            key={dot.left}
            className="absolute w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ top: dot.top, left: dot.left, background: accent, animationDelay: dot.delay }}
          />
        ))}
      </>
    );
  }
  if (motif === "fireworks") {
    return (
      <>
        {[
          { top: "14%", left: "8%", delay: "0s" },
          { top: "22%", left: "30%", delay: "0.5s" },
          { top: "12%", left: "58%", delay: "1s" },
          { top: "26%", left: "80%", delay: "1.4s" },
          { top: "64%", left: "18%", delay: "0.9s" },
          { top: "70%", left: "46%", delay: "1.7s" },
          { top: "58%", left: "72%", delay: "0.3s" },
        ].map((dot, index) => (
          <span
            key={index}
            className="absolute w-3 h-3 rounded-full animate-ping"
            style={{ top: dot.top, left: dot.left, background: accent, animationDelay: dot.delay }}
          />
        ))}
      </>
    );
  }
  return null;
}

// A full-size rendering of the website's home page — the real header with the
// long-form logo and contact line, the real hero copy and sunflower, and the
// real top menu — wearing the chosen stage's colours, so a stage can be judged
// here before it is switched on.
export default function ThemeStagePreview({ stage, site }) {
  // A countdown stage has a second half the calendar cannot show: the moment the
  // clock reaches zero. This flips the same page past midnight so the fireworks
  // and the new-year headline can be seen before December 31.
  const [atZero, setAtZero] = useState(false);
  useEffect(() => setAtZero(false), [stage?.id]);

  const { data: menu } = useQuery({
    queryKey: ["website-preview-menu"],
    queryFn: () =>
      base44.entities.WebsitePage.filter({ is_archived: false }, { sort: "display_order", limit: 40 }),
    staleTime: 5 * 60 * 1000,
    select: (res) =>
      (res.items || res)
        .filter((page) => !page.parent_page_key && page.is_visible !== false)
        .map((page) => page.label),
  });

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
  const logo = site?.logo_url || "";
  const showCountdown = !!stage?.countdown_to && !celebrating;
  const navItems = menu && menu.length ? menu : FALLBACK_MENU;

  return (
    <div className="space-y-2">
      <div
        className="relative overflow-hidden rounded-xl border shadow-sm"
        style={{
          background: `linear-gradient(150deg, ${palette.surface} 0%, ${palette.secondary} 100%)`,
          color: palette.ink,
          borderColor: palette.secondary,
        }}
      >
        <Ornaments motif={celebrating ? "fireworks" : stage?.motif} accent={palette.accent} />

        {/* The site's header: long-form logo and contact line */}
        <div className="relative flex items-center justify-between gap-3 px-5 pt-4 pb-2">
          {logo ? (
            <img src={logo} alt="Candora" className="h-9 object-contain" />
          ) : (
            <span className="font-display text-lg font-bold tracking-wide">{site?.site_name || "CANDORA"}</span>
          )}
          <div className="flex items-center gap-4 text-[10px] font-medium opacity-80">
            {site?.contact_phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> {site.contact_phone}
              </span>
            )}
            {site?.contact_email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> {site.contact_email}
              </span>
            )}
          </div>
        </div>

        {/* The home page hero */}
        <div className="relative flex items-center gap-5 px-6 py-5 min-h-[190px]">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold opacity-70">
              {celebrating ? `${stage.label} — just after midnight` : stage?.label || "No theme"}
            </p>
            <h3 className="font-display text-2xl font-extrabold leading-tight">{headline}</h3>
            {subheadline && (
              <p className="text-[11px] leading-relaxed opacity-80 line-clamp-3 max-w-xl">{subheadline}</p>
            )}

            {showCountdown ? (
              <div className="flex items-end gap-2 pt-1">
                {countdownParts(left).map((part) => (
                  <div
                    key={part.label}
                    className="rounded-md px-2.5 py-1.5 text-center tabular-nums"
                    style={{ background: palette.primary, color: palette.surface }}
                  >
                    <span className="block text-base font-extrabold leading-none">{part.value}</span>
                    <span className="block text-[8px] font-bold uppercase tracking-wider opacity-80 mt-0.5">
                      {part.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              ctaLabel && (
                <span
                  className="inline-flex rounded-md px-3.5 py-1.5 text-[11px] font-bold"
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
              className="relative shrink-0 h-32 w-32 object-contain drop-shadow-lg"
            />
          )}
        </div>

        {/* The site's top menu, in the stage's own colour */}
        <div
          className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-3 py-2"
          style={{ background: palette.primary, color: palette.surface }}
        >
          {navItems.map((item) => (
            <span key={item} className="text-[9px] font-bold uppercase tracking-wide whitespace-nowrap">
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