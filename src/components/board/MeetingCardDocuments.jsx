import { useState } from "react";
import { FileText, ExternalLink, X, Package, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

// The zip built in the Agenda Builder — its document links stay folded away
// until asked for, so a package doesn't add a block of lines to the card
function PackagePill({ pkg, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const items = pkg.package_files || [];
  return (
    <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs">
      <span className="flex items-center gap-1.5">
        <a
          href={pkg.file_url}
          target="_blank"
          rel="noreferrer"
          title={pkg.file_name || "Meeting Package.zip"}
          className="flex items-center gap-1 min-w-0 font-medium text-foreground hover:underline"
        >
          <Package size={12} className="shrink-0 text-muted-foreground" />
          <span className="truncate max-w-[190px]">{pkg.file_name || "Meeting Package.zip"}</span>
        </a>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            title="Show the documents in this package"
            className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition"
          >
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span className="text-[11px]">{items.length}</span>
          </button>
        )}
        <button type="button" onClick={() => onEdit(pkg)} title="Add or remove items" className="text-muted-foreground hover:text-foreground transition">
          <Pencil size={12} />
        </button>
        <button type="button" onClick={() => onDelete(pkg)} title="Delete this package" className="text-muted-foreground hover:text-destructive transition">
          <Trash2 size={12} />
        </button>
      </span>
      {open && items.length > 0 && (
        <span className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          {items.map((f) => (
            <a
              key={f.file_url}
              href={f.file_url}
              target="_blank"
              rel="noreferrer"
              title={f.file_name || f.label}
              className="text-[11px] text-muted-foreground hover:text-foreground underline truncate max-w-[180px]"
            >
              {f.label}
            </a>
          ))}
        </span>
      )}
    </span>
  );
}

// Every document on a meeting, in one dense wrapping line: the type is a small
// tag inside each chip instead of a separate labelled row per document type
export default function MeetingCardDocuments({ chips, packages, onDelete, onEditPackage, onDeletePackage }) {
  if (!chips.length && !packages.length) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-green-700 mr-0.5">
        <FileText size={11} /> Docs
      </span>
      {chips.map(({ doc, kind, readOnly }) => (
        <span
          key={`${kind}-${doc.id}`}
          title={doc.file_name || doc.title}
          className="inline-flex items-center gap-1.5 max-w-[290px] rounded-md border border-border bg-card px-2 py-0.5 text-xs"
        >
          {doc.file_url ? (
            <a href={doc.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 min-w-0 font-medium text-foreground hover:underline">
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{kind}</span>
              <span className="truncate">{doc.title}</span>
              <ExternalLink size={10} className="shrink-0 text-muted-foreground" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 min-w-0">
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{kind}</span>
              <span className="truncate text-muted-foreground">{doc.title}</span>
            </span>
          )}
          {!readOnly && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(doc)}
              title="Remove this document from the meeting"
              className="shrink-0 text-muted-foreground hover:text-destructive transition"
            >
              <X size={11} />
            </button>
          )}
        </span>
      ))}
      {packages.map((pkg) => (
        <PackagePill key={pkg.id} pkg={pkg} onEdit={onEditPackage} onDelete={onDeletePackage} />
      ))}
    </div>
  );
}