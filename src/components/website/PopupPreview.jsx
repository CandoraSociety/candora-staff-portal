import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import PopupMock from "@/components/website/PopupMock";

function Stage({ form, className, children }) {
  return (
    <div className={cn("relative flex items-center justify-center p-6 bg-slate-900", className)}>
      {form.popup_background_url ? (
        <img
          src={form.popup_background_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-900 to-slate-800" />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full flex items-center justify-center">{children}</div>
    </div>
  );
}

// A small preview that opens the pop-up full-size, the way a visitor sees it:
// over the background image with the page dimmed behind it.
export default function PopupPreview({ form }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full rounded-xl border border-border overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
        title="Open the full-size preview"
      >
        <Stage form={form} className="min-h-[340px]">
          <PopupMock form={form} />
        </Stage>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white opacity-90 group-hover:opacity-100">
          Click to open the pop-up
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-[92vw] p-0 gap-0 border-0 bg-transparent shadow-none overflow-hidden [&>button]:text-white [&>button]:opacity-90">
          <DialogTitle className="sr-only">Pop-up preview</DialogTitle>
          <Stage form={form} className="h-[70vh] min-h-[420px]">
            <PopupMock form={form} onClose={() => setOpen(false)} />
          </Stage>
        </DialogContent>
      </Dialog>
    </>
  );
}