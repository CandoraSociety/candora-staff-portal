import { useMemo, useRef } from "react";
import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buildTrainingPlanDocumentHtml } from "./trainingPlanDocumentHtml";

// Previews the printable run-sheet in an iframe and prints from inside it, so
// the app's scroll containers and transforms never clip the pages.
export default function PlanPrintDialog({ open, onClose, plan }) {
  const iframeRef = useRef(null);
  const html = useMemo(() => (plan ? buildTrainingPlanDocumentHtml(plan) : ""), [plan, open]);

  const print = () => {
    const w = iframeRef.current?.contentWindow;
    if (w) { w.focus(); w.print(); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col print:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print run-sheet
          </DialogTitle>
        </DialogHeader>
        <iframe ref={iframeRef} srcDoc={html} title="Training day run-sheet" className="flex-1 w-full border rounded-md bg-white" />
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
          <Button onClick={print} className="gap-2"><Printer className="w-4 h-4" /> Print / Save as PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}