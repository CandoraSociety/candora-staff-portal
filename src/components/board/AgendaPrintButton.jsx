import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, Users } from "lucide-react";
import { toast } from "sonner";
import { buildAgendaDocumentHtml } from "./agendaDocumentHtml";

const OPTIONS = [
  {
    value: "full",
    icon: FileText,
    label: "Full working copy",
    desc: "Includes notes and time allocations — for the chair and facilitators.",
  },
  {
    value: "distribution",
    icon: Users,
    label: "Distribution version",
    desc: "Titles and presenters only — notes and durations are excluded.",
  },
];

export default function AgendaPrintButton({ meeting, items }) {
  const [open, setOpen] = useState(false);

  const print = (variant) => {
    const html = buildAgendaDocumentHtml({ meeting, items, variant });
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Please allow pop-ups to save the agenda.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileDown className="w-4 h-4" />Save / Print Agenda
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save agenda as PDF</DialogTitle>
          <DialogDescription>
            Choose which version to generate — the print dialog will open with the agenda ready to save as a PDF.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => print(o.value)}
              className="flex items-start gap-3 rounded-lg border border-border p-4 text-left hover:bg-muted/50 transition"
            >
              <o.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold">{o.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{o.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}