import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, StickyNote } from "lucide-react";

// One presence task: whether it is done, why it matters, and a place to keep
// what was found — logins, the listing link, who was contacted.
export default function PresenceItemRow({ item, record, onStatusChange, onSaveNotes }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const status = record?.status || "todo";
  const isDone = status === "done";

  useEffect(() => {
    setNotes(record?.notes || "");
  }, [record?.notes]);

  return (
    <div className="py-3 border-b border-border/50 last:border-0">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isDone}
          onCheckedChange={(checked) => onStatusChange(item, checked ? "done" : "todo")}
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium leading-snug ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
            {item.label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.why}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <button
              type="button"
              onClick={() => setNotesOpen((value) => !value)}
              className="text-[11px] font-semibold text-primary inline-flex items-center gap-1"
            >
              <StickyNote className="w-3 h-3" /> {record?.notes ? "Notes" : "Add a note"}
            </button>
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {notesOpen && (
            <div className="mt-2 space-y-2">
              <Textarea
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="What was found, who was contacted, where the listing lives…"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { onSaveNotes(item, notes); setNotesOpen(false); }}>
                  Save note
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setNotesOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}