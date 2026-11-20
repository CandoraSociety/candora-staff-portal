import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// The pop-up card itself, exactly as a visitor sees it. Used both in the small
// preview and in the full-size preview that opens over the page.
export default function PopupMock({ form, onClose, className }) {
  return (
    <div className={cn("relative w-full max-w-xs rounded-xl bg-card shadow-2xl overflow-hidden", className)}>
      {form.popup_image_url && (
        <img src={form.popup_image_url} alt="" className="w-full h-32 object-cover" />
      )}

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          title="Close pop-up"
          className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <span className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white">
          <X className="w-3 h-3" />
        </span>
      )}

      <div className="p-4 space-y-2">
        <p className="font-display font-bold text-foreground leading-snug">
          {form.popup_title || "Your pop-up title"}
        </p>
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {form.popup_message || "What the pop-up says to visitors."}
        </p>
        {form.popup_button_label && (
          <span className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            {form.popup_button_label}
          </span>
        )}
      </div>
    </div>
  );
}