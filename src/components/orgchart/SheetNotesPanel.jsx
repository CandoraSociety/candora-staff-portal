import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, StickyNote, Pencil } from "lucide-react";

// Read-only display of the current sheet's saved notes, docked at the bottom
// of the org chart page. Shows only when notes exist for the sheet.
export default function SheetNotesPanel({ sheetId, sheetName, onEdit }) {
  const { data: existing = [], isLoading } = useQuery({
    queryKey: ["ed-org-sheet-notes", sheetId],
    queryFn: () => base44.entities.EDOrgSheetNote.filter({ sheet_id: sheetId }),
    enabled: !!sheetId,
  });

  const notes = existing[0]?.notes?.trim();
  if (isLoading || !notes) return null;

  return (
    <div className="border-t bg-yellow-50/60 px-6 py-3 shrink-0">
      <div className="flex items-start gap-2">
        <StickyNote className="w-4 h-4 mt-1 text-yellow-700 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-yellow-800">
            Notes — {sheetName || "Sheet"}
            {existing[0]?.updated_by_name ? <span className="font-normal text-muted-foreground"> · updated by {existing[0].updated_by_name}</span> : null}
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5">{notes}</p>
        </div>
        {onEdit && (
          <Button variant="ghost" size="sm" className="gap-1 shrink-0" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        )}
      </div>
    </div>
  );
}