import { Archive, ChevronDown, ChevronUp, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// The selections across the top of the website — the same set that fills the
// tabs on this screen. Removing one archives it, so it can always be put back.
export default function PageSelectionsCard({
  pages,
  archived,
  onAdd,
  onEdit,
  onArchive,
  onMove,
  onRestore,
  onDelete,
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-foreground">Page selections</h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {pages.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              These are the choices across the top of the website, in this order, and the tabs on this screen.
              Removing one moves it to the archive.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onAdd} className="flex-shrink-0">
            <Plus className="w-3.5 h-3.5" /> Add selection
          </Button>
        </div>

        <div className="divide-y divide-border/60">
          {pages.map((page, index) => (
            <div key={page.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground w-4 text-right">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {page.label}
                    {page.is_visible === false && (
                      <span className="ml-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Hidden
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{page.path || "/"}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={index === 0}
                  onClick={() => onMove(page, -1)}
                  title="Move earlier in the menu"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={index === pages.length - 1}
                  onClick={() => onMove(page, 1)}
                  title="Move later in the menu"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(page)}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  disabled={!!page.is_home}
                  onClick={() => onArchive(page)}
                  title={page.is_home ? "The home page stays in the menu" : "Move this selection to the archive"}
                >
                  <Archive className="w-3.5 h-3.5" /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border/70 bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Archive className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Archived selections
            </p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-card text-muted-foreground">
              {archived.length}
            </span>
          </div>
          {archived.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">Nothing archived.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {archived.map((page) => (
                <div key={page.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{page.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{page.path || "/"}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => onRestore(page)}>
                      <RotateCcw className="w-3.5 h-3.5" /> Re-add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(page)}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}