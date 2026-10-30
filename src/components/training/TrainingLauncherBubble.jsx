import { useState } from "react";
import { GraduationCap, ArrowLeft } from "lucide-react";

/**
 * Compact training launcher that lives in the bottom-left corner.
 * Collapsed it is a single 44px gold-ringed cap button, so it never covers the
 * page underneath. Hovering (desktop) or tapping it reveals the full prompt and
 * its action button, and it folds back down when the pointer leaves.
 */
export default function TrainingLauncherBubble({ label, actionLabel, onAction, showArrow = false }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed bottom-4 left-4 z-[60] print:hidden"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div
        className="rounded-full border shadow-lg flex items-center gap-2 transition-all duration-200"
        style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(230, 50%, 22%)" }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          title={open ? "Hide training" : "Training"}
          className="p-2.5 rounded-full transition-colors hover:opacity-80"
        >
          <GraduationCap className="w-4 h-4" style={{ color: "hsl(45, 92%, 53%)" }} />
        </button>

        {open && (
          <div className="flex items-center gap-2 pr-2 pl-0.5 whitespace-nowrap">
            <span className="text-xs" style={{ color: "hsl(230, 25%, 65%)" }}>{label}</span>
            <button
              type="button"
              onClick={onAction}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-colors hover:opacity-80"
              style={{ background: "hsl(230, 55%, 20%)", color: "hsl(45, 60%, 85%)" }}
            >
              {actionLabel}
              {showArrow && <ArrowLeft className="w-3 h-3 rotate-180" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}