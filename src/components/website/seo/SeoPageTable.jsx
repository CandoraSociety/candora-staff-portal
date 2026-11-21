import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2, Pencil } from "lucide-react";

const lengthTone = (value, min, max) => {
  const length = (value || "").length;
  if (!length) return "text-destructive";
  if (length < min || length > max) return "text-warning";
  return "text-success";
};

// Every page of the site with the title and description a search engine would
// show for it — and a one-click way to have the AI write them from the page's
// real copy.
export default function SeoPageTable({ pages, seoByKey, generatingKey, onGenerate, onEdit }) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Page search settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The title and description each page shows in search results and AI answers.
          </p>
        </div>

        <div className="space-y-3">
          {pages.map((page) => {
            const seo = seoByKey[page.page_key] || {};
            const title = seo.meta_title || "";
            const description = seo.meta_description || "";
            return (
              <div
                key={page.page_key}
                className="rounded-lg border border-border/70 p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{page.label}</p>
                    <span className="text-[10px] text-muted-foreground font-mono">{page.path || "/"}</span>
                    {seo.is_indexable === false && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Hidden from search
                      </span>
                    )}
                  </div>
                  <p className={`text-sm leading-snug ${title ? "text-foreground" : "text-muted-foreground italic"}`}>
                    {title || "No title written yet"}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {description || "No description written yet"}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] font-medium">
                    <span className={lengthTone(title, 30, 60)}>title {title.length}/60</span>
                    <span className={lengthTone(description, 120, 160)}>description {description.length}/160</span>
                    {typeof seo.ai_score === "number" && (
                      <span className="text-muted-foreground">AI score {seo.ai_score}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={generatingKey === page.page_key}
                    onClick={() => onGenerate(page)}
                  >
                    {generatingKey === page.page_key ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    AI write
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => onEdit(page)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                </div>
              </div>
            );
          })}
          {!pages.length && (
            <p className="text-sm text-muted-foreground">
              Pages appear here once they are added in Page Content.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}