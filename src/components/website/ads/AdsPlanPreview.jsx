import { Card, CardContent } from "@/components/ui/card";
import { MousePointerClick, Target, Wallet } from "lucide-react";

const money = (value) =>
  typeof value === "number" ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—";

// The plan the AI wrote: the words the ads use, what they should and should not
// be shown for, and what the budget is likely to buy.
export default function AdsPlanPreview({ plan }) {
  if (!plan) return null;

  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Cost per click", value: money(plan.projected_cost_per_click), icon: Wallet },
              { label: "Clicks", value: plan.projected_clicks ?? "—", icon: MousePointerClick },
              { label: "Actions", value: plan.projected_conversions ?? "—", icon: Target },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                    <Icon className="w-3 h-3" /> {stat.label}
                  </div>
                  <p className="text-sm font-bold text-foreground mt-0.5">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">Headlines</p>
            <div className="flex flex-wrap gap-1.5">
              {(plan.headlines || []).map((headline) => (
                <span key={headline} className="text-xs rounded-md bg-primary/10 text-foreground px-2 py-1">
                  {headline}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">Descriptions</p>
            <ul className="space-y-1">
              {(plan.descriptions || []).map((description) => (
                <li key={description} className="text-sm text-muted-foreground leading-snug">
                  {description}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">Search phrases</p>
            <div className="flex flex-wrap gap-1.5">
              {(plan.keywords || []).map((keyword) => (
                <span key={keyword} className="text-[11px] rounded-full bg-muted px-2 py-0.5 text-foreground">
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {(plan.negative_keywords || []).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
                Keep away from
              </p>
              <div className="flex flex-wrap gap-1.5">
                {plan.negative_keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="text-[11px] rounded-full bg-destructive/10 text-destructive px-2 py-0.5 line-through"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {plan.targeting_notes && (
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">Targeting</p>
              <p className="text-sm text-muted-foreground leading-snug">{plan.targeting_notes}</p>
            </div>
          )}

          {plan.ai_notes && (
            <p className="text-xs text-muted-foreground border-t border-border/60 pt-3 leading-relaxed">
              {plan.ai_notes}
            </p>
          )}

          {plan.launch_notes && (
            <p className="text-xs text-warning leading-relaxed">Before launch: {plan.launch_notes}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}