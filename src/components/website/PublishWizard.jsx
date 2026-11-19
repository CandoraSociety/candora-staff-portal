import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Search, Check, ArrowLeft, ArrowRight, Upload, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatWebsiteDate } from "@/lib/websiteManager";
import WebsiteImageField from "@/components/website/WebsiteImageField";

const EMPTY = {
  source_name: "",
  title: "",
  slug: "",
  summary: "",
  body: "",
  image_url: "",
  event_start: "",
  event_end: "",
  location: "",
  cost: "",
  audience: "",
  registration_url: "",
  registration_note: "",
  advertise: true,
  featured_on_home: false,
  home_order: 0,
  publish_at: "",
};

const STEPS = ["Source", "Page content", "Details & advertising", "Review"];

function toLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70);
}

export default function PublishWizard({ open, onOpenChange, publication, initialSource, onSaved }) {
  const [step, setStep] = useState(0);
  const [sourceType, setSourceType] = useState("event");
  const [sourceId, setSourceId] = useState("");
  const [existingId, setExistingId] = useState(null);
  const [existingStatus, setExistingStatus] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [loadingSource, setLoadingSource] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: sources = [], isLoading: loadingSources } = useQuery({
    queryKey: ["website-source-records"],
    queryFn: async () => {
      const [eventsPage, programsPage, pubsPage] = await Promise.all([
        base44.entities.Event.filter({}, { sort: "-start_date", limit: 200 }),
        base44.entities.Program.filter({}, { limit: 200 }),
        base44.entities.WebsitePublication.list({ limit: 500 }),
      ]);
      const pubs = pubsPage.items || [];
      const setup = new Set(pubs.map((p) => p.source_id));
      return [
        ...(eventsPage.items || []).map((e) => ({
          id: e.id,
          type: "event",
          name: e.name,
          when: e.start_date,
          setup: setup.has(e.id),
        })),
        ...(programsPage.items || []).map((p) => ({
          id: p.id,
          type: "program",
          name: p.name,
          when: p.start_date,
          setup: setup.has(p.id),
        })),
      ];
    },
    enabled: open && !publication,
  });

  useEffect(() => {
    if (!open) return;
    setError("");
    if (publication) {
      setExistingId(publication.id);
      setExistingStatus(publication.status);
      setSourceType(publication.source_type);
      setSourceId(publication.source_id);
      setForm({
        ...EMPTY,
        ...publication,
        event_start: toLocal(publication.event_start),
        event_end: toLocal(publication.event_end),
        publish_at: toLocal(publication.publish_at),
      });
      setStep(1);
    } else if (initialSource) {
      setStep(1);
      loadSource(initialSource.source_type, initialSource.source_id);
    } else {
      setExistingId(null);
      setSourceId("");
      setSourceType("event");
      setForm(EMPTY);
      setSearch("");
      setStep(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, publication?.id, initialSource?.source_id]);

  const loadSource = async (type, id) => {
    setLoadingSource(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getWebsitePublishSource", {
        source_type: type,
        source_id: id,
      });
      const { source, existing } = res.data || {};
      if (!source) throw new Error("That record could not be read.");
      setSourceType(type);
      setSourceId(id);
      if (existing) {
        setExistingId(existing.id);
        setExistingStatus(existing.status);
        setForm({
          ...EMPTY,
          ...existing,
          event_start: toLocal(existing.event_start),
          event_end: toLocal(existing.event_end),
          publish_at: toLocal(existing.publish_at),
        });
      } else {
        setExistingId(null);
        setExistingStatus(null);
        setForm({
          ...EMPTY,
          source_name: source.source_name,
          title: source.title,
          summary: source.summary,
          body: source.body,
          image_url: source.image_url,
          event_start: toLocal(source.event_start),
          event_end: toLocal(source.event_end),
          location: source.location,
        });
      }
      setStep(1);
    } catch (err) {
      setError(err.message || "Could not load that record.");
    } finally {
      setLoadingSource(false);
    }
  };

  const filteredSources = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sources
      .filter((s) => s.type === sourceType)
      .filter((s) => !term || (s.name || "").toLowerCase().includes(term));
  }, [sources, sourceType, search]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set("image_url", file_url);
    } catch (err) {
      setError(err.message || "The image could not be uploaded.");
    }
  };

  const save = async (mode) => {
    if (!form.title.trim()) {
      setError("Give the public page a title first.");
      setStep(1);
      return;
    }
    if (!sourceId) {
      setError("Choose the program or event this page belongs to.");
      setStep(0);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const slug = form.slug || slugify(form.title) || `page-${Date.now()}`;
      const publish = mode === "publish" && form.advertise;
      let status = "draft";
      if (!form.advertise) status = "unpublished";
      else if (publish) status = "published";
      else if (existingStatus === "published") status = "published";

      const payload = {
        source_type: sourceType,
        source_id: sourceId,
        source_name: form.source_name || form.title.trim(),
        title: form.title.trim(),
        slug,
        summary: form.summary || "",
        body: form.body || "",
        image_url: form.image_url || "",
        event_start: fromLocal(form.event_start),
        event_end: fromLocal(form.event_end),
        location: form.location || "",
        cost: form.cost || "",
        audience: form.audience || "",
        registration_url: form.registration_url || "",
        registration_note: form.registration_note || "",
        advertise: !!form.advertise,
        featured_on_home: !!form.featured_on_home,
        home_order: Number(form.home_order) || 0,
        publish_at: fromLocal(form.publish_at),
        status,
        public_path: `/events/${slug}`,
        last_synced_at: new Date().toISOString(),
      };

      if (publish) {
        payload.published_at = new Date().toISOString();
        payload.published_by_name = user?.full_name || user?.email || "";
      }

      if (existingId) {
        await base44.entities.WebsitePublication.update(existingId, payload);
      } else {
        await base44.entities.WebsitePublication.create(payload);
      }

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "The page could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {publication ? "Edit website page" : "Set up a website page"}
          </DialogTitle>
          <DialogDescription>
            Review the details that come from Candora 360, write the public page, and choose whether it is advertised.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          {STEPS.map((label, index) => {
            if (index === 0 && (publication || initialSource)) return null;
            const active = index === step;
            const done = index < step;
            return (
              <div key={label} className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0 ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : done
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : index + 1}
                </div>
                <span className={`text-xs truncate ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {loadingSource ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading details from Candora 360…
          </div>
        ) : (
          <>
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={sourceType === "event" ? "default" : "outline"}
                    onClick={() => setSourceType("event")}
                  >
                    Events
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={sourceType === "program" ? "default" : "outline"}
                    onClick={() => setSourceType("program")}
                  >
                    Programs
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder={`Search ${sourceType === "event" ? "events" : "programs"}…`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-72 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
                  {loadingSources ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
                  ) : filteredSources.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No {sourceType === "event" ? "events" : "programs"} found.
                    </div>
                  ) : (
                    filteredSources.map((source) => (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => loadSource(source.type, source.id)}
                        className="w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{source.name}</p>
                          <p className="text-xs text-muted-foreground">{formatWebsiteDate(source.when)}</p>
                        </div>
                        {source.setup && (
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                            Already set up
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pub-title">Page title</Label>
                  <Input id="pub-title" value={form.title} onChange={(e) => set("title", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pub-summary">Short description</Label>
                  <Textarea
                    id="pub-summary"
                    rows={2}
                    maxLength={240}
                    placeholder="One or two lines shown in the events list and on the home page"
                    value={form.summary}
                    onChange={(e) => set("summary", e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">{form.summary.length}/240 characters</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pub-body">Full description</Label>
                  <Textarea
                    id="pub-body"
                    rows={6}
                    placeholder="What supporters will read on the page"
                    value={form.body}
                    onChange={(e) => set("body", e.target.value)}
                  />
                </div>
                <WebsiteImageField
                  label="Image"
                  value={form.image_url}
                  onChange={(url) => set("image_url", url)}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pub-start">Starts</Label>
                    <Input
                      id="pub-start"
                      type="datetime-local"
                      value={form.event_start}
                      onChange={(e) => set("event_start", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pub-end">Ends</Label>
                    <Input
                      id="pub-end"
                      type="datetime-local"
                      value={form.event_end}
                      onChange={(e) => set("event_end", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pub-location">Location</Label>
                    <Input
                      id="pub-location"
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pub-cost">Cost</Label>
                    <Input
                      id="pub-cost"
                      placeholder="Free"
                      value={form.cost}
                      onChange={(e) => set("cost", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pub-audience">Who it is for</Label>
                    <Input
                      id="pub-audience"
                      placeholder="e.g. Newcomer families"
                      value={form.audience}
                      onChange={(e) => set("audience", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pub-reg">Registration link</Label>
                    <Input
                      id="pub-reg"
                      placeholder="https://…"
                      value={form.registration_url}
                      onChange={(e) => set("registration_url", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pub-reg-note">Registration note</Label>
                  <Input
                    id="pub-reg-note"
                    placeholder="e.g. Call the front desk to register"
                    value={form.registration_note}
                    onChange={(e) => set("registration_note", e.target.value)}
                  />
                </div>

                <div className="rounded-xl border border-border p-4 space-y-4 bg-muted/30">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Advertise this on the website</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Turn this off for “Do not advertise” — no page or home-page listing is created.
                      </p>
                    </div>
                    <Switch checked={form.advertise} onCheckedChange={(v) => set("advertise", v)} />
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Feature on the home page</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Highlights this item in the home page events area.
                      </p>
                    </div>
                    <Switch
                      checked={form.featured_on_home}
                      onCheckedChange={(v) => set("featured_on_home", v)}
                      disabled={!form.advertise}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border p-4 space-y-2">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Public page</p>
                  <h3 className="font-display text-lg font-bold text-foreground">{form.title || "Untitled page"}</h3>
                  {form.summary && <p className="text-sm text-muted-foreground">{form.summary}</p>}
                  <div className="grid sm:grid-cols-2 gap-2 text-sm pt-2">
                    <p><span className="text-muted-foreground">Starts:</span> {formatWebsiteDate(form.event_start, true) || "—"}</p>
                    <p><span className="text-muted-foreground">Ends:</span> {formatWebsiteDate(form.event_end, true) || "—"}</p>
                    <p><span className="text-muted-foreground">Location:</span> {form.location || "—"}</p>
                    <p><span className="text-muted-foreground">Cost:</span> {form.cost || "—"}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border p-4 space-y-1.5">
                  <Label htmlFor="pub-schedule">Go live at (optional)</Label>
                  <Input
                    id="pub-schedule"
                    type="datetime-local"
                    value={form.publish_at || ""}
                    onChange={(e) => set("publish_at", e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Leave empty to put this change on the website right away. Set a time and the website keeps the
                    current page until then, then switches to this one on its own.
                  </p>
                </div>

                <div
                  className={`rounded-xl border p-4 text-sm flex items-start gap-2 ${
                    form.advertise
                      ? "border-success/30 bg-success/5 text-foreground"
                      : "border-warning/30 bg-warning/5 text-foreground"
                  }`}
                >
                  <Sparkles className={`w-4 h-4 mt-0.5 flex-shrink-0 ${form.advertise ? "text-success" : "text-warning"}`} />
                  <span>
                    {form.advertise
                      ? "Publishing creates the public page and its home-page listing on the website."
                      : "“Do not advertise” is on — this stays inside Candora 360 and is not sent to the website."}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-between gap-2 pt-4 border-t border-border mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(publication || initialSource ? 1 : 0, s - 1))}
            disabled={step === (publication || initialSource ? 1 : 0) || loadingSource}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            {step < 3 && (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={loadingSource || (step === 0 && !sourceId)}
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            {step === 3 && (
              <>
                <Button type="button" variant="outline" onClick={() => save("draft")} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
                </Button>
                <Button type="button" onClick={() => save("publish")} disabled={saving || !form.advertise}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Publish to website
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}