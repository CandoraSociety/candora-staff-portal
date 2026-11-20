import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// The pop-up card itself, exactly as a visitor sees it. The small preview and the
// full-size preview render the same card, only larger — same proportions, same
// layout — so what staff see is what opens on the website.
export default function PopupMock({ form, onClose, size = "thumb", className }) {
  const full = size === "full";

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl bg-card shadow-2xl overflow-hidden",
        full ? "max-w-md" : "max-w-xs",
        className
      )}
    >
      {form.popup_image_url && (
        <img src={form.popup_image_url} alt="" className="w-full aspect-[16/9] object-cover" />
      )}

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          title="Close pop-up"
          className={cn(
            "absolute rounded-full bg-black/50 text-white hover:bg-black/70",
            full ? "top-3 right-3 p-1.5" : "top-2 right-2 p-1"
          )}
        >
          <X className={full ? "w-4 h-4" : "w-3 h-3"} />
        </button>
      ) : (
        <span
          className={cn(
            "absolute rounded-full bg-black/50 text-white",
            full ? "top-3 right-3 p-1.5" : "top-2 right-2 p-1"
          )}
        >
          <X className={full ? "w-4 h-4" : "w-3 h-3"} />
        </span>
      )}

      <div className={full ? "p-6 space-y-3" : "p-4 space-y-2"}>
        <p
          className={cn(
            "font-display font-bold text-foreground leading-snug",
            full ? "text-2xl" : "text-base"
          )}
        >
          {form.popup_title || "Your pop-up title"}
        </p>
        <p className={cn("text-muted-foreground whitespace-pre-line", full ? "text-sm leading-relaxed" : "text-sm")}>
          {form.popup_message || "What the pop-up says to visitors."}
        </p>
        {form.popup_button_label && (
          <span
            className={cn(
              "inline-flex items-center rounded-md bg-primary font-semibold text-primary-foreground",
              full ? "px-5 py-2.5 text-sm" : "px-3 py-1.5 text-xs"
            )}
          >
            {form.popup_button_label}
          </span>
        )}
      </div>
    </div>
  );
}