import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import AdsPlanPreview from "@/components/website/ads/AdsPlanPreview";

const OBJECTIVES = [
  { value: "traffic", label: "Bring people to the website" },
  { value: "donations", label: "Raise donations" },
  { value: "program_registration", label: "Fill a program" },
  { value: "event_attendance", label: "Get people to an event" },
  { value: "leads", label: "Collect enquiries" },
  { value: "awareness", label: "Be known in the area" },
  { value: "recruitment", label: "Recruit staff or volunteers" },
];

const CHANNELS = [
  { value: "google_search", label: "Google search ads" },
  { value: "google_display", label: "Google display ads" },
  { value: "google_performance_max", label: "Google Performance Max" },
  { value: "meta_ads", label: "Facebook & Instagram ads" },
];

const EMPTY_BRIEF = {
  name: "",
  objective: "traffic",
  channel: "google_search",
  budget_total: "",
  budget_daily: "",
  area: "Edmonton, Alberta",
  audience: "",
  offer: "",
  landing_page: "",
};

// The brief the AI writes a campaign from. Nothing is invented: the AI is given
// the site's own pages and programs, and asked for ad copy, phrases and
// projections for the budget entered here.
export default function AdsBriefDialog({
  open,
  onOpenChange,
  plan,
  isPlanning,
  isSaving,
  onGenerate,
  onSave,
  onDiscard,
}) {
  const [brief, setBrief] = useState(EMPTY_BRIEF);

  useEffect(() => {
    if (!open) {
      setBrief(EMPTY_BRIEF);
    }
  }, [open]);

  const update = (field, value) => setBrief((current) => ({ ...current, [field]: value }));
  const canGenerate = brief.name.trim() && brief.offer.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Review the campaign" : "Plan a campaign"}</DialogTitle>
        </DialogHeader>

        {plan ? (
          <AdsPlanPreview plan={plan} />
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ads-name">Campaign name</Label>
              <Input
                id="ads-name"
                value={brief.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Winter Warmth appeal — search"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>What is it for</Label>
                <Select value={brief.objective} onValueChange={(value) => update("objective", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBJECTIVES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Where the ads run</Label>
                <Select value={brief.channel} onValueChange={(value) => update("channel", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ads-total">Total budget</Label>
                <Input
                  id="ads-total"
                  type="number"
                  value={brief.budget_total}
                  onChange={(event) => update("budget_total", event.target.value)}
                  placeholder="500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ads-daily">Per day</Label>
                <Input
                  id="ads-daily"
                  type="number"
                  value={brief.budget_daily}
                  onChange={(event) => update("budget_daily", event.target.value)}
                  placeholder="25"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ads-area">Area served</Label>
                <Input
                  id="ads-area"
                  value={brief.area}
                  onChange={(event) => update("area", event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ads-audience">Who it should reach</Label>
              <Textarea
                id="ads-audience"
                rows={2}
                value={brief.audience}
                onChange={(event) => update("audience", event.target.value)}
                placeholder="Newcomer families looking for free English classes, within 10 km"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ads-offer">What the ad invites people to do</Label>
              <Textarea
                id="ads-offer"
                rows={2}
                value={brief.offer}
                onChange={(event) => update("offer", event.target.value)}
                placeholder="Register for the January English classes, free, childcare provided"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ads-landing">Landing page</Label>
              <Input
                id="ads-landing"
                value={brief.landing_page}
                onChange={(event) => update("landing_page", event.target.value)}
                placeholder="/programs/english-classes"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {plan ? (
            <>
              <Button variant="ghost" onClick={onDiscard} disabled={isSaving}>
                Write it differently
              </Button>
              <Button onClick={() => onSave(brief, plan)} disabled={isSaving} className="gap-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Save campaign
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => onGenerate(brief)}
                disabled={isPlanning || !canGenerate}
                className="gap-2"
              >
                {isPlanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isPlanning ? "Writing the campaign…" : "Write the campaign"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}