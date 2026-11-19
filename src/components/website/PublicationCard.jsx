import { Pencil, Eye, EyeOff, Trash2, CalendarDays, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWebsiteDate } from "@/lib/websiteManager";

const STATUS_STYLES = {
  published: "bg-success/10 text-success",
  draft: "bg-muted text-muted-foreground",
  unpublished: "bg-warning/10 text-warning",
};

const STATUS_LABELS = {
  published: "Published",
  draft: "Draft",
  unpublished: "Not advertised",
};

export default function PublicationCard({ publication, onEdit, onToggleStatus, onDelete }) {
  const status = publication.advertise === false ? "unpublished" : publication.status || "draft";

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row gap-4">
      {publication.image_url ? (
        <img
          src={publication.image_url}
          alt=""
          className="w-full sm:w-28 h-24 object-cover rounded-lg border border-border flex-shrink-0"
        />
      ) : (
        <div className="w-full sm:w-28 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <CalendarDays className="w-6 h-6 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              {publication.source_type === "program" ? "Program" : "Event"}
            </p>
            <h3 className="font-display text-base font-bold text-foreground truncate">{publication.title}</h3>
          </div>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full flex-shrink-0 ${
              STATUS_STYLES[status]
            }`}
          >
            {STATUS_LABELS[status]}
          </span>
        </div>

        {publication.summary && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{publication.summary}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
          {publication.event_start && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> {formatWebsiteDate(publication.event_start, true)}
            </span>
          )}
          {publication.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {publication.location}
            </span>
          )}
          {publication.public_path && status === "published" && (
            <span className="inline-flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5" /> {publication.public_path}
            </span>
          )}
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end gap-1 flex-shrink-0">
        <Button size="sm" variant="outline" onClick={() => onEdit(publication)}>
          <Pencil className="w-3.5 h-3.5" /> Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onToggleStatus(publication)}>
          {status === "published" ? (
            <>
              <EyeOff className="w-3.5 h-3.5" /> Unpublish
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" /> Publish
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(publication)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}