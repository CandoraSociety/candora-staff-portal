import { Archive, ChevronDown, ChevronUp, CornerDownRight, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// The selections across the top of the website — the same set that fills the
// tabs on this screen. A selection can sit inside a dropdown under another one.
// Removing one archives it, so it can always be put back.
export default function PageSelectionsCard({
  pages,
  archived,
  onAdd,
  onEdit,
  onArchive,
  onMove,
  onAddDropdownOption,
  onRestore,
  onDelete,
}) {
  const siblingsOf = (page) =>
    pages.filter((entry) => (entry.parent_page_key || "") === (page.parent_page_key || ""));

  const parentLabel = (key) => pages.find((entry) => entry.page_key === key)?.label || "";

  let position = 0;

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
              Use Dropdown to write a new page, move an existing one, or duplicate one inside a dropdown under
              a menu item. An indented selection opens inside that dropdown. Removing one moves it to the
              archive.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onAdd} className="flex-shrink-0">
            <Plus className="w-3.5 h-3.5" /> Add selection
          </Button>
        </div>

        <div className="divide-y divide-border/60">
          {pages.map((page) => {
            const nested = !!page.parent_page_key;
            if (!nested) position += 1;
            const siblings = siblingsOf(page);
            const index = siblings.findIndex((entry) => entry.id === page.id);

            return (
              <div
                key={page.id}
                className={`py-2.5 flex items-center justify-between gap-3 ${nested ? "pl-8 bg-muted/20" : ""}`}
              >
                <div className="min-w-0 flex items-center gap-2">
                  {nested ? (
                    <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <span className="text-[11px] font-semibold text-muted-foreground w-4 text-right">
                      {position}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {page.label}
                      {page.is_visible === false && (
                        <span className="ml-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Hidden
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {nested ? `In ${parentLabel(page.parent_page_key) || "a dropdown"} · ` : ""}
                      {page.path || "/"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={index === 0}
                    onClick={() => onMove(page, -1)}
                    title={nested ? "Move earlier in the dropdown" : "Move earlier in the menu"}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={index === siblings.length - 1}
                    onClick={() => onMove(page, 1)}
                    title={nested ? "Move later in the dropdown" : "Move later in the menu"}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                  {!nested && !page.is_home && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" title={`Add a choice inside a dropdown under ${page.label}`}>
                          <ChevronDown className="w-3.5 h-3.5" /> Dropdown
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onAddDropdownOption(page, "new")}>
                          Write a new page here
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onAddDropdownOption(page, "move")}>
                          Move an existing page here
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onAddDropdownOption(page, "duplicate")}>
                          Duplicate an existing page here
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
            );
          })}
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