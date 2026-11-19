import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Megaphone } from "lucide-react";

function shortText(text, max = 180) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/[,\s]+\S*$/, "")}…`;
}

/**
 * Active donor campaigns offered as ready-made home page pop-ups. Picking one
 * fills the pop-up with copy already written for that campaign.
 */
export default function PopupCampaignSuggestions({ set }) {
  const { data: campaigns = [] } = useQuery({
    queryKey: ["popup-campaign-suggestions"],
    queryFn: () =>
      base44.entities.DonationCampaign
        .filter({ is_active: true, is_general_fund: { $ne: true } }, { sort: "-created_date", limit: 12 })
        .then((res) => res.items || []),
  });

  if (!campaigns.length) return null;

  const apply = (campaign) => {
    set("popup_title", campaign.name || "");
    set("popup_message", campaign.tagline || shortText(campaign.description || campaign.story));
    set("popup_image_url", campaign.hero_image_url || "");
    set("popup_button_label", "Donate now");
    set(
      "popup_button_url",
      campaign.slug && campaign.public_page_enabled ? `/campaign/${campaign.slug}` : "/donate"
    );
    set("popup_enabled", true);
  };

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
      <p className="text-[11px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">
        Suggested from your active campaigns
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {campaigns.map((campaign) => (
          <button
            key={campaign.id}
            type="button"
            onClick={() => apply(campaign)}
            className="shrink-0 w-56 text-left rounded-lg border border-border bg-card p-2.5 transition hover:border-primary/60 hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              {campaign.hero_image_url ? (
                <img
                  src={campaign.hero_image_url}
                  alt=""
                  className="h-8 w-8 rounded object-cover shrink-0"
                />
              ) : (
                <Megaphone className="h-4 w-4 text-primary shrink-0" />
              )}
              <p className="text-sm font-semibold text-foreground truncate">{campaign.name}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1 h-8 overflow-hidden">
              {campaign.tagline || shortText(campaign.description || campaign.story, 90) || "Active campaign"}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}