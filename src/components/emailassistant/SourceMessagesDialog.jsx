import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/emailAssistant";

// Shows the original correspondence behind a suggestion, so the employee can
// always check what was actually said.
export default function SourceMessagesDialog({ insight, messages, open, onOpenChange }) {
  const ids = insight?.source_message_ids || [];
  const rows = messages.filter((m) => ids.includes(m.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Original correspondence</DialogTitle>
        </DialogHeader>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            The original message is no longer available in the assistant. It may have been removed.
          </p>
        ) : (
          <div className="space-y-4">
            {rows.map((m) => (
              <div key={m.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-sm text-foreground">{m.subject || "(no subject)"}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(m.received_at)}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {m.direction === "outbound" ? "Sent by you" : `From ${m.from_name || m.from_email || "sender"}`}
                  {m.recipients ? ` · To ${m.recipients}` : ""}
                </p>
                <p className="text-sm text-foreground mt-3 whitespace-pre-line leading-relaxed">
                  {m.body_text || "(no body text available)"}
                </p>
                {(m.attachments || []).length > 0 && (
                  <div className="mt-3 space-y-1">
                    {m.attachments.map((a, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        Attachment: {a.name}{a.summary ? ` — ${a.summary}` : ""}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}