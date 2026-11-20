import { X } from "lucide-react";

// Shows the pop-up the way a visitor sees it: over the background image with the
// page dimmed behind it.
export default function PopupPreview({ form }) {
  const hasBackground = !!form.popup_background_url;

  return (
    <div className="relative rounded-xl border border-border overflow-hidden min-h-[340px] flex items-center justify-center p-6 bg-slate-900">
      {hasBackground ? (
        <img
          src={form.popup_background_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-900 to-slate-800" />
      )}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative w-full max-w-xs rounded-xl bg-card shadow-2xl overflow-hidden">
        {form.popup_image_url && (
          <img src={form.popup_image_url} alt="" className="w-full h-32 object-cover" />
        )}
        <button
          type="button"
          tabIndex={-1}
          className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white"
          aria-hidden="true"
        >
          <X className="w-3 h-3" />
        </button>
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
    </div>
  );
}