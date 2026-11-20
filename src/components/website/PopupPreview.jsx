import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import PopupMock from "@/components/website/PopupMock";

// The page behind the pop-up: the background photo, dimmed, exactly as it sits
// on the website.
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

// A small live preview that opens the pop-up full size, the way a visitor sees
// it — over the background image with the page dimmed behind it.
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
        <Stage form={form} className="min-h-[300px]">
          <PopupMock form={form} />
        </Stage>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white">
          <Maximize2 className="w-3 h-3" /> Click to open the pop-up
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-[92vw] p-0 gap-0 border-0 bg-transparent shadow-none [&>button]:text-white [&>button]:opacity-90">
          <DialogTitle className="sr-only">Pop-up preview</DialogTitle>
          <Stage form={form} className="min-h-[70vh] py-10">
            <PopupMock form={form} size="full" onClose={() => setOpen(false)} />
          </Stage>
        </DialogContent>
      </Dialog>
    </>
  );
}