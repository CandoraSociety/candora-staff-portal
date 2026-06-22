import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { Printer, StickyNote, Download, Share2, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { useOrgSettings } from "@/lib/useOrgSettings";
import { cn } from "@/lib/utils";

const TYPE_COLORS = {
  opening: "bg-emerald-100 text-emerald-700",
  review: "bg-blue-100 text-blue-700",
  discussion: "bg-violet-100 text-violet-700",
  decision: "bg-amber-100 text-amber-700",
  action_item: "bg-rose-100 text-rose-700",
  update: "bg-cyan-100 text-cyan-700",
  presentation: "bg-indigo-100 text-indigo-700",
  closing: "bg-slate-100 text-slate-700",
  other: "bg-muted text-muted-foreground",
};

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function buildPrintHTML(meeting, items, logoUrl, orgName, includeNotes) {
  const sorted = [...items].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const total = sorted.reduce((s, i) => s + (i.duration_minutes || 0), 0);
  const meetingDate = meeting.meeting_date ? format(new Date(meeting.meeting_date), "EEEE, MMMM d, yyyy 'at' h:mm a") : "";

  const rows = sorted.map((item, idx) => `
    <tr>
      <td class="num">${idx + 1}</td>
      <td>
        <div class="item-title">${escapeHtml(item.title)}</div>
        ${item.item_type ? `<span class="badge">${escapeHtml(item.item_type.replace(/_/g, " "))}</span>` : ""}
        ${item.description ? `<div class="desc">${escapeHtml(item.description)}</div>` : ""}
        ${includeNotes && item.facilitator_notes ? `<div class="fac-notes"><strong>Facilitator Notes:</strong> ${escapeHtml(item.facilitator_notes)}</div>` : ""}
      </td>
      <td class="presenter">${item.presenter ? escapeHtml(item.presenter) : ""}</td>
      <td class="duration">${item.duration_minutes > 0 ? item.duration_minutes + " min" : ""}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(meeting.title)} - Agenda</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #0f1f6b; padding-bottom: 16px; margin-bottom: 24px; }
  .header img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; }
  .header h1 { font-size: 20px; font-weight: 700; }
  .header p { font-size: 13px; color: #666; }
  .meeting-info { margin-bottom: 24px; }
  .meeting-info h2 { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
  .meeting-info p { font-size: 13px; color: #666; margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.03em; padding-bottom: 8px; border-bottom: 2px solid #ddd; }
  th.right { text-align: right; }
  td { padding: 10px 8px; border-bottom: 1px solid #eee; vertical-align: top; font-size: 13px; }
  .num { color: #888; font-weight: 600; width: 30px; }
  .item-title { font-weight: 600; }
  .badge { display: inline-block; font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #f3f4f6; color: #666; margin-left: 6px; vertical-align: middle; }
  .desc { font-size: 12px; color: #888; margin-top: 4px; }
  .fac-notes { font-size: 12px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 4px; padding: 6px 8px; margin-top: 6px; color: #92400e; }
  .presenter { color: #666; width: 120px; }
  .duration { color: #666; text-align: right; width: 60px; white-space: nowrap; }
  .total { text-align: right; font-size: 12px; color: #888; margin-top: 12px; font-weight: 500; }
  @media print { body { padding: 20px; } .no-print-btn { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(orgName)}" />
    <div>
      <h1>${escapeHtml(orgName)}</h1>
      <p>Meeting Agenda</p>
    </div>
  </div>
  <div class="meeting-info">
    <h2>${escapeHtml(meeting.title)}</h2>
    ${meetingDate ? `<p>${escapeHtml(meetingDate)}</p>` : ""}
    ${meeting.location ? `<p>${escapeHtml(meeting.location)}</p>` : ""}
    ${meeting.facilitator ? `<p>Facilitator: ${escapeHtml(meeting.facilitator)}</p>` : ""}
    ${meeting.attendees?.length ? `<p>Attendees: ${meeting.attendees.map(escapeHtml).join(", ")}</p>` : ""}
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Agenda Item</th>
        <th>Presenter</th>
        <th class="right">Time</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  ${total > 0 ? `<p class="total">Total Estimated Time: ${Math.floor(total / 60)}h ${total % 60}m</p>` : ""}
</body>
</html>`;
}

export default function AgendaPreviewDialog({ meeting, items, open, onOpenChange }) {
  const [includeNotes, setIncludeNotes] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareEmails, setShareEmails] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  const { logoUrl, orgName } = useOrgSettings();

  const sortedItems = [...(items || [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const totalDuration = sortedItems.reduce((s, i) => s + (i.duration_minutes || 0), 0);

  const handlePrint = () => {
    const html = buildPrintHTML(meeting, sortedItems, logoUrl, orgName, includeNotes);
    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow popups to print the agenda.");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const handleSavePDF = () => {
    setIsSaving(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const margin = 18;
      const pageW = 210;
      const contentW = pageW - margin * 2;
      let y = margin;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 31, 107);
      doc.text(orgName, margin, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(110);
      doc.text("Meeting Agenda", margin, y);
      y += 5;
      doc.setDrawColor(15, 31, 107);
      doc.setLineWidth(0.8);
      doc.line(margin, y, pageW - margin, y);
      y += 8;

      // Meeting info
      doc.setTextColor(20);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(meeting.title, contentW);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      if (meeting.meeting_date) {
        doc.text(format(new Date(meeting.meeting_date), "EEEE, MMMM d, yyyy 'at' h:mm a"), margin, y);
        y += 5;
      }
      if (meeting.location) { doc.text(meeting.location, margin, y); y += 5; }
      if (meeting.facilitator) { doc.text(`Facilitator: ${meeting.facilitator}`, margin, y); y += 5; }
      if (meeting.attendees?.length) { doc.text(`Attendees: ${meeting.attendees.join(", ")}`, margin, y); y += 5; }
      y += 4;

      // Table header
      doc.setFillColor(240, 240, 245);
      doc.rect(margin, y - 4, contentW, 8, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(90);
      doc.text("#", margin + 2, y);
      doc.text("Agenda Item", margin + 10, y);
      doc.text("Presenter", margin + 120, y);
      doc.text("Time", pageW - margin - 2, y, { align: "right" });
      y += 8;

      // Rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      sortedItems.forEach((item, idx) => {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.setTextColor(120);
        doc.text(String(idx + 1), margin + 2, y);
        doc.setTextColor(20);
        doc.setFont("helvetica", "bold");
        const titleLines = doc.splitTextToSize(item.title, 100);
        doc.text(titleLines, margin + 10, y);
        let rowH = titleLines.length * 5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        if (item.item_type) {
          doc.text(`[${item.item_type.replace(/_/g, " ")}]`, margin + 10, y + rowH);
          rowH += 5;
        }
        if (item.description) {
          const descLines = doc.splitTextToSize(item.description, 100);
          doc.text(descLines, margin + 10, y + rowH);
          rowH += descLines.length * 5;
        }
        if (includeNotes && item.facilitator_notes) {
          doc.setTextColor(146, 64, 14);
          const noteLines = doc.splitTextToSize(`Notes: ${item.facilitator_notes}`, 100);
          doc.text(noteLines, margin + 10, y + rowH);
          rowH += noteLines.length * 5;
          doc.setTextColor(80);
        }
        doc.text(item.presenter || "", margin + 120, y);
        if (item.duration_minutes > 0) {
          doc.text(`${item.duration_minutes} min`, pageW - margin - 2, y, { align: "right" });
        }
        y += Math.max(rowH, 7);
        doc.setDrawColor(230);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageW - margin, y);
        y += 2;
      });

      if (totalDuration > 0) {
        y += 4;
        doc.setFontSize(9);
        doc.setTextColor(110);
        doc.setFont("helvetica", "bold");
        doc.text(`Total Estimated Time: ${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`, pageW - margin, y, { align: "right" });
      }

      const safeName = meeting.title.replace(/[^a-z0-9]/gi, "_");
      doc.save(`${safeName}_Agenda.pdf`);
      toast({ title: "PDF saved", description: "Agenda downloaded as PDF." });
    } catch (err) {
      toast({ title: "Failed to save PDF", description: err?.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    const emails = shareEmails.split(/[,\s]+/).filter(Boolean);
    if (emails.length === 0) return;

    setIsSharing(true);
    try {
      const meetingDate = meeting.meeting_date ? format(new Date(meeting.meeting_date), "EEEE, MMMM d, yyyy 'at' h:mm a") : "";
      const itemRows = sortedItems.map((item, idx) => {
        let row = `${idx + 1}. ${item.title}`;
        if (item.item_type) row += ` [${item.item_type.replace(/_/g, " ")}]`;
        if (item.presenter) row += ` — ${item.presenter}`;
        if (item.duration_minutes > 0) row += ` (${item.duration_minutes} min)`;
        if (item.description) row += `\n   ${item.description}`;
        if (includeNotes && item.facilitator_notes) row += `\n   📝 Facilitator Notes: ${item.facilitator_notes}`;
        return row;
      }).join("\n\n");

      const totalLine = totalDuration > 0 ? `\n\nTotal Estimated Time: ${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m` : "";
      const personalMsg = shareMessage ? `\n\n---\n${shareMessage}` : "";

      const body = `${orgName} — Meeting Agenda\n${"=".repeat(40)}\n\n${meeting.title}${meetingDate ? `\n${meetingDate}` : ""}${meeting.location ? `\nLocation: ${meeting.location}` : ""}${meeting.facilitator ? `\nFacilitator: ${meeting.facilitator}` : ""}${meeting.attendees?.length ? `\nAttendees: ${meeting.attendees.join(", ")}` : ""}\n\n${"─".repeat(40)}\n\n${itemRows}${totalLine}${personalMsg}`;

      await base44.integrations.Core.SendEmail({
        to: emails.join(", "),
        subject: `Agenda: ${meeting.title}${meetingDate ? ` — ${format(new Date(meeting.meeting_date), "MMM d, yyyy")}` : ""}`,
        body,
      });

      toast({ title: "Agenda shared", description: `Sent to ${emails.length} recipient${emails.length > 1 ? "s" : ""}.` });
      setShowShare(false);
      setShareEmails("");
      setShareMessage("");
    } catch (err) {
      toast({ title: "Failed to share", description: err?.message || "Unknown error", variant: "destructive" });
    } finally {
      setIsSharing(false);
    }
  };

  if (!meeting) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <DialogTitle>Agenda Preview</DialogTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Switch checked={includeNotes} onCheckedChange={setIncludeNotes} />
                <span className="flex items-center gap-1">
                  <StickyNote className="w-3.5 h-3.5 text-amber-500" /> Facilitator Notes
                </span>
              </label>
              <Button size="sm" variant="outline" onClick={handleSavePDF} disabled={isSaving} className="gap-1.5">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Save PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowShare(!showShare)} className="gap-1.5">
                <Share2 className="w-4 h-4" /> Share
              </Button>
              <Button size="sm" onClick={handlePrint} className="gap-1.5">
                <Printer className="w-4 h-4" /> Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        {showShare && (
          <form onSubmit={handleShare} className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Recipients (email addresses, comma or space separated) *</label>
              <Input required type="text" value={shareEmails} onChange={(e) => setShareEmails(e.target.value)} placeholder="jane@example.com, john@example.com" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Personal Message (optional)</label>
              <textarea value={shareMessage} onChange={(e) => setShareMessage(e.target.value)} rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none" placeholder="Add a note to recipients..." />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <StickyNote className="w-3.5 h-3.5 text-amber-500" />
              {includeNotes ? "Facilitator notes will be included." : "Facilitator notes will NOT be included. Toggle the switch above to include them."}
            </div>
            <Button type="submit" size="sm" disabled={isSharing} className="gap-1.5">
              {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              {isSharing ? "Sending..." : "Send Agenda"}
            </Button>
          </form>
        )}

        <div className="border border-border rounded-lg p-6 bg-white">
          {/* Branded header */}
          <div className="flex items-center gap-4 border-b-2 border-accent pb-4 mb-4">
            <img src={logoUrl} alt={orgName} className="w-14 h-14 rounded-full object-cover" />
            <div>
              <h1 className="font-heading text-xl font-bold">{orgName}</h1>
              <p className="text-sm text-muted-foreground">Meeting Agenda</p>
            </div>
          </div>

          {/* Meeting details */}
          <div className="mb-4">
            <h2 className="font-heading text-lg font-semibold">{meeting.title}</h2>
            {meeting.meeting_date && (
              <p className="text-sm text-muted-foreground">
                {format(new Date(meeting.meeting_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
            )}
            {meeting.location && <p className="text-sm text-muted-foreground">{meeting.location}</p>}
            {meeting.facilitator && <p className="text-sm text-muted-foreground">Facilitator: {meeting.facilitator}</p>}
            {meeting.attendees?.length > 0 && (
              <p className="text-sm text-muted-foreground">Attendees: {meeting.attendees.join(", ")}</p>
            )}
          </div>

          {/* Agenda table */}
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase pb-2 w-8">#</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase pb-2">Agenda Item</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase pb-2 w-32">Presenter</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase pb-2 w-16">Time</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, idx) => (
                <tr key={item.id} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-2 text-sm text-muted-foreground font-medium">{idx + 1}</td>
                  <td className="py-2 pr-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    {item.item_type && (
                      <span className={cn("ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-medium inline-block", TYPE_COLORS[item.item_type] || TYPE_COLORS.other)}>
                        {item.item_type.replace(/_/g, " ")}
                      </span>
                    )}
                    {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                    {includeNotes && item.facilitator_notes && (
                      <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        <p className="text-xs text-amber-900"><strong>Facilitator Notes:</strong> {item.facilitator_notes}</p>
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-2 text-sm text-muted-foreground">{item.presenter || "—"}</td>
                  <td className="py-2 text-sm text-muted-foreground text-right whitespace-nowrap">
                    {item.duration_minutes > 0 ? `${item.duration_minutes} min` : "—"}
                  </td>
                </tr>
              ))}
              {sortedItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    No agenda items yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {sortedItems.length > 0 && totalDuration > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-right font-medium">
              Total Estimated Time: {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}