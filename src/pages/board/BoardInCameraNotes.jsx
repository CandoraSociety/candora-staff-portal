import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { Lock, ShieldAlert } from "lucide-react";

export default function BoardInCameraNotes() {
  const [notes, setNotes] = useState(null);

  useEffect(() => {
    base44.entities.InCameraNote.list("-meeting_date", 200).then((list) => setNotes(list));
  }, []);

  if (!notes) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <ShieldAlert size={20} className="text-red-600" />
        <h1 className="font-heading text-2xl font-semibold">In-Camera Notes</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        Confidential in-camera notes, labeled with the date of the meeting they were recorded in. These are excluded from the regular minutes document.
      </p>
      <div className="flex items-center gap-2 mb-6 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <Lock size={13} />
        <span>Confidential — restricted access. Password protection to be added.</span>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">No in-camera notes recorded yet. In-camera entries made in the minutes are saved here when final minutes are generated.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((n) => (
            <div key={n.id} className="border-l-4 border-l-red-400 bg-card border border-border rounded-r-xl p-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600">In Camera</span>
                <span className="text-sm font-semibold text-foreground">
                  {n.meeting_date ? format(parseDateSmart(n.meeting_date), "MMMM d, yyyy") : ""}
                </span>
                {n.meeting_title && <span className="text-xs text-muted-foreground">· {n.meeting_title}</span>}
              </div>
              {n.agenda_item_title && <div className="text-xs text-muted-foreground mb-1.5">{n.agenda_item_title}</div>}
              <p className="text-sm text-foreground whitespace-pre-wrap">{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}