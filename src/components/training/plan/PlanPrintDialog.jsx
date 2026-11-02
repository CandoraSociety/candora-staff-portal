import { useMemo } from "react";
import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PLAN_DOC_CSS, buildTrainingPlanBodyHtml, buildTrainingPlanDocumentHtml } from "./trainingPlanDocumentHtml";

// Shows the printable run-sheet inline (no nested iframe, so nothing can render
// blank in the preview) and prints it from a popup window when asked.
export default function PlanPrintDialog({ open, onClose, plan }) {
  const body = useMemo(() => (plan ? buildTrainingPlanBodyHtml(plan) : ""), [plan, open]);

  const print = () => {
    const html = buildTrainingPlanDocumentHtml(plan);
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
      // Popup blocked — print the visible preview instead
      window.print();
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.document.title = plan.title || "Training day";
    w.addEventListener("afterprint", () => setTimeout(() => w.close(), 100));
    setTimeout(() => { w.focus(); w.print(); }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print run-sheet
          </DialogTitle>
        </DialogHeader>

        <style>{PLAN_DOC_CSS}</style>
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