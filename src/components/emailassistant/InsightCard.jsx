import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check, Clock, Eye, Pencil, X, CheckCircle2, CalendarDays, ArrowRightLeft, StickyNote,
} from "lucide-react";
import { CERTAINTY_META, KIND_META, formatWhen, isOverdue } from "@/lib/emailAssistant";
import {
  approveInsight, dismissInsight, markDone, snoozeInsight, saveInsightEdits, convertToTask,
  APPROVAL_LABEL, APPROVAL_OUTCOME,
} from "@/lib/emailAssistantActions";
import InsightEditDialog from "@/components/emailassistant/InsightEditDialog";
import InsightNoteDialog from "@/components/emailassistant/InsightNoteDialog";
import SourceMessagesDialog from "@/components/emailassistant/SourceMessagesDialog";

// One AI finding, with everything the employee needs to accept, adjust or
// ignore it. Nothing here changes a shared record — it only touches this
// employee's own task list.
export default function InsightCard({ insight, messages, user, prefs, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);

  const meta = KIND_META[insight.kind] || KIND_META.task;
  const certainty = CERTAINTY_META[insight.certainty] || CERTAINTY_META.unclear;
  const approvalLabel = APPROVAL_LABEL[insight.kind];
  const approvalOutcome = APPROVAL_OUTCOME[insight.kind];
  const canApprove = !!approvalLabel && insight.status !== "approved" && insight.status !== "done";
  // A calendar entry needs a date before it can be placed on the calendar.
  const needsDate = insight.kind === "calendar" && !insight.due_date;

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      await onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  const openSnooze = () => {
    const d = new Date();
    d.setDate(d.getDate() + (prefs?.follow_up_reminder_days || 3));
    setSnoozeDate(d.toISOString().slice(0, 10));
    setSnoozeOpen(true);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${meta.tone}`}>
          {meta.label}
        </span>
        <span className={`text-[11px] ${certainty.tone}`}>{certainty.label}</span>
        {insight.due_date && (
          <span className={`text-[11px] inline-flex items-center gap-1 ${isOverdue(insight.due_date) ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            <CalendarDays className="w-3 h-3" /> {formatWhen(insight.due_date)}
            {isOverdue(insight.due_date) ? " · overdue" : ""}
          </span>
        )}
        {insight.status === "approved" && (
          <span className="text-[11px] text-success inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {insight.approved_action || "Approved"}
          </span>
        )}
        {insight.status === "snoozed" && insight.snooze_until && (
          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> Snoozed to {formatWhen(insight.snooze_until)}
          </span>
        )}
        {insight.status === "done" && <span className="text-[11px] text-success">Done</span>}
        {insight.is_demo && (
          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-warning/15 text-warning">
            Sample
          </span>
        )}
      </div>

      <div>
        <p className="font-medium text-sm text-foreground leading-snug">{insight.title}</p>
        {insight.detail && (
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line leading-relaxed">{insight.detail}</p>
        )}
        {insight.note && (
          <div className="mt-2 rounded-lg border border-border bg-muted/60 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Your note</p>
            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed mt-0.5">{insight.note}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {insight.responsible_name && <span>Person: {insight.responsible_name}</span>}
        {insight.category && <span>Area: {insight.category}</span>}
        {insight.suggested_home && <span>Could live in: {insight.suggested_home}</span>}
        {insight.source_subject && <span>Email: {insight.source_subject}</span>}
      </div>

      {canApprove && (approvalOutcome || needsDate) && (
        <p className="text-[11px] leading-relaxed text-muted-foreground rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2">
          <span className="font-semibold text-foreground">If you accept this:</span>{" "}
          {needsDate
            ? "no date was found for it yet. Open Edit, add the date, then put it on your calendar."
            : approvalOutcome}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {canApprove && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => (needsDate ? setEditOpen(true) : run(() => approveInsight(insight, user)))}
          >
            <Check className="w-3.5 h-3.5" /> {needsDate ? "Add a date first" : approvalLabel}
          </Button>
        )}
        {["follow_up", "commitment", "question"].includes(insight.kind) && !insight.linked_task_id && insight.status !== "done" && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => convertToTask(insight, user, prefs))}>
            <ArrowRightLeft className="w-3.5 h-3.5" /> Make it a task
          </Button>
        )}
        {insight.kind === "task" && insight.status !== "done" && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => markDone(insight, user))}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Done
          </Button>
        )}
        {["follow_up", "commitment", "question"].includes(insight.kind) && insight.status !== "done" && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => markDone(insight, user))}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Done
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditOpen(true)}>
          <Pencil className="w-3.5 h-3.5" /> Edit
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setNoteOpen(true)}>
          <StickyNote className="w-3.5 h-3.5" /> {insight.note ? "Edit note" : "Note"}
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={openSnooze}>
          <Clock className="w-3.5 h-3.5" /> Snooze
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setSourceOpen(true)}>
          <Eye className="w-3.5 h-3.5" /> Open email
        </Button>
        {insight.status !== "dismissed" && (
          <Button size="sm" variant="ghost" className="text-muted-foreground" disabled={busy} onClick={() => run(() => dismissInsight(insight, user))}>
            <X className="w-3.5 h-3.5" /> Not relevant
          </Button>
        )}
      </div>

      <InsightEditDialog
        insight={insight}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={async (patch) => {
          await run(() => saveInsightEdits(insight, patch));
          setEditOpen(false);
        }}
      />
      <InsightNoteDialog
        insight={insight}
        open={noteOpen}
        onOpenChange={setNoteOpen}
        onSave={(note) => run(() => saveInsightEdits(insight, { note }))}
      />
      <SourceMessagesDialog insight={insight} messages={messages} open={sourceOpen} onOpenChange={setSourceOpen} />

      <Dialog open={snoozeOpen} onOpenChange={setSnoozeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remind me later</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="snooze-date">Bring this back on</Label>
            <Input id="snooze-date" type="date" value={snoozeDate} onChange={(e) => setSnoozeDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSnoozeOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                await run(() => snoozeInsight(insight, user, snoozeDate));
                setSnoozeOpen(false);
              }}
            >
              Snooze
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}