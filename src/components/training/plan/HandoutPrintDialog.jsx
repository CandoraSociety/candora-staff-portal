import { useMemo } from "react";
import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HANDOUT_CSS, buildHandoutDocumentHtml } from "@/lib/training/pathwaysHandouts";

// Inline preview of one room handout, with the print/save action beside it.
// Same approach as the run-sheet: rendered straight into the panel, printed
// from a popup window so the saved PDF is named after the handout.
export default function HandoutPrintDialog({ open, onClose, handout, plan }) {
  const body = useMemo(() => (open && handout ? handout.build(plan) : ""), [open, handout, plan]);

  const print = () => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) { window.print(); return; }
    w.document.open();
    w.document.write(buildHandoutDocumentHtml({ title: handout.title, bodyHtml: body }));
    w.document.close();
    w.document.title = `${handout.title} — ${plan?.title || "Pathways training"}`;
    w.addEventListener("afterprint", () => setTimeout(() => w.close(), 100));
    setTimeout(() => { w.focus(); w.print(); }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-4 h-4" /> {handout?.title || "Handout"}
          </DialogTitle>
        </DialogHeader>

        <style>{HANDOUT_CSS}</style>
        <div className="flex-1 overflow-auto rounded-md border bg-white">
          <div className="tp-doc mx-auto" style={{ maxWidth: "7.6in" }} dangerouslySetInnerHTML={{ __html: body }} />
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
          <Button onClick={print} className="gap-2"><Printer className="w-4 h-4" /> Print / Save as PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}