import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";

const STATUSES = ["draft", "ready", "live", "paused", "completed"];

const STATUS_STYLE = {
  draft: "bg-muted text-muted-foreground",
  ready: "bg-primary/15 text-foreground",
  live: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  completed: "bg-muted text-muted-foreground",
};

const CHANNEL_LABEL = {
  google_search: "Google search",
  google_display: "Google display",
  google_performance_max: "Performance Max",
  meta_ads: "Meta ads",
  other: "Other",
};

// One planned campaign, with the copy and phrases the AI wrote folded away until
// they are needed.
export default function AdsCampaignCard({ campaign, onStatusChange }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{campaign.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {CHANNEL_LABEL[campaign.channel] || campaign.channel}
              {campaign.budget_total ? ` · $${campaign.budget_total} total` : ""}
              {campaign.budget_daily ? ` · $${campaign.budget_daily}/day` : ""}
            </p>
          </div>
          <Select value={campaign.status || "draft"} onValueChange={(value) => onStatusChange(campaign, value)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className={`px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${STATUS_STYLE[campaign.status] || STATUS_STYLE.draft}`}>
            {campaign.status || "draft"}
          </span>
          <span className="text-muted-foreground">{(campaign.keywords || []).length} phrases</span>
          {typeof campaign.projected_clicks === "number" && (
            <span className="text-muted-foreground">~{campaign.projected_clicks} clicks</span>
          )}
          {typeof campaign.projected_conversions === "number" && (
            <span className="text-muted-foreground">~{campaign.projected_conversions} actions</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="text-xs font-semibold text-primary inline-flex items-center gap-1"
        >
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {open ? "Hide the copy" : "See the ad copy"}
        </button>

        {open && (
          <div className="space-y-3 border-t border-border/60 pt-3">
            {(campaign.headlines || []).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Headlines</p>
                <div className="flex flex-wrap gap-1.5">
                  {campaign.headlines.map((headline) => (
                    <span key={headline} className="text-xs rounded-md bg-primary/10 px-2 py-1">
                      {headline}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(campaign.descriptions || []).length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Descriptions</p>
                <ul className="space-y-1">
                  {campaign.descriptions.map((description) => (
                    <li key={description} className="text-xs text-muted-foreground leading-snug">
                      {description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(campaign.keywords || []).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Phrases</p>
                <div className="flex flex-wrap gap-1.5">
                  {campaign.keywords.map((keyword) => (
                    <span key={keyword} className="text-[11px] rounded-full bg-muted px-2 py-0.5">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {campaign.targeting_notes && (
              <p className="text-xs text-muted-foreground leading-relaxed">{campaign.targeting_notes}</p>
            )}
            {campaign.launch_notes && (
              <p className="text-xs text-warning leading-relaxed">Before launch: {campaign.launch_notes}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}