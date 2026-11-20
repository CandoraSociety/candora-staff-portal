import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, Plus, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import WebsiteImageField from "@/components/website/WebsiteImageField";
import NewsFeedStyleCard from "@/components/website/NewsFeedStyleCard";
import HomePopupCard from "@/components/website/HomePopupCard";
import { toDateTimeLocal } from "@/lib/websiteManager";

const EMPTY = {
  site_name: "Candora",
  logo_url: "",
  tagline: "",
  hero_headline: "",
  hero_subheadline: "",
  hero_image_url: "",
  hero_cta_label: "",
  hero_cta_url: "",
  about_summary: "",
  events_heading: "Upcoming events",
  events_intro: "",
  news_feed_style: "grid",
  news_feed_speed: "normal",
  news_feed_pause_on_hover: true,
  news_feed_limit: 6,
  popup_enabled: false,
  popup_title: "",
  popup_message: "",
  popup_image_url: "",
  popup_background_url: "",
  popup_components: [],
  popup_button_label: "",
  popup_button_url: "",
  popup_frequency: "once_per_session",
  popup_starts_at: "",
  popup_ends_at: "",
  contact_email: "",
  contact_phone: "",
  contact_address: "",
  office_hours: "",
  charity_number: "",
  footer_note: "",
  public_site_url: "",
  social_links: [],
};

export default function WebsiteSettings() {
  const [form, setForm] = useState(EMPTY);
  const [settingsId, setSettingsId] = useState(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["website-settings"],
    queryFn: () =>
      base44.entities.WebsiteSettings.list({ limit: 1 }).then((res) => (res.items || [])[0] || null),
  });

  useEffect(() => {
    if (!settings) return;
    setSettingsId(settings.id);
    setForm({
      ...EMPTY,
      ...settings,
      social_links: Array.isArray(settings.social_links) ? settings.social_links : [],
      popup_components: Array.isArray(settings.popup_components) ? settings.popup_components : [],
      popup_starts_at: toDateTimeLocal(settings.popup_starts_at),
      popup_ends_at: toDateTimeLocal(settings.popup_ends_at),
    });
  }, [settings?.id]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setLink = (index, key, value) =>
    setForm((prev) => {
      const links = [...(prev.social_links || [])];
      links[index] = { ...links[index], [key]: value };
      return { ...prev, social_links: links };
    });

  const addLink = () =>
    setForm((prev) => ({ ...prev, social_links: [...(prev.social_links || []), { label: "", url: "" }] }));

  const removeLink = (index) =>
    setForm((prev) => ({
      ...prev,
      social_links: (prev.social_links || []).filter((_, i) => i !== index),
    }));

  const save = async () => {
    if (!form.site_name.trim()) {
      toast({ title: "Site name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        social_links: (form.social_links || []).filter((l) => l.label || l.url),
        popup_starts_at: form.popup_starts_at ? new Date(form.popup_starts_at).toISOString() : "",
        popup_ends_at: form.popup_ends_at ? new Date(form.popup_ends_at).toISOString() : "",
      };
      if (settingsId) {
        await base44.entities.WebsiteSettings.update(settingsId, payload);
      } else {
        const created = await base44.entities.WebsiteSettings.create(payload);
        setSettingsId(created.id);
      }
      queryClient.invalidateQueries({ queryKey: ["website-settings"] });
      toast({ title: "Site settings saved" });
    } catch (err) {
      toast({ title: "Could not save settings", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading site settings…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Website Studio</p>
        <h1 className="font-display text-3xl font-bold text-foreground mt-1">Site Settings</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Brand line, home page hero, contact details and footer — used across every page of the public website.
        </p>
      </header>

      {!settingsId && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
          <Settings className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            No site settings have been saved yet. Fill these in and save to create the website's settings.
          </p>
        </div>
      )}

      <Card className="border-border/70">
        <CardContent className="p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">Brand</h2>
          <WebsiteImageField
            label="Website logo"
            value={form.logo_url}
            onChange={(url) => set("logo_url", url)}
            hint="Leave empty to use the primary logo from Marketing → Brand Assets."
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="site-name">Site name</Label>
              <Input id="site-name" value={form.site_name} onChange={(e) => set("site_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="site-tagline">Tagline</Label>
              <Input id="site-tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="site-about">Organization summary</Label>
            <Textarea
              id="site-about"
              rows={3}
              value={form.about_summary}
              onChange={(e) => set("about_summary", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardContent className="p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">Home page hero</h2>
          <div className="space-y-1.5">
            <Label htmlFor="hero-headline">Headline</Label>
            <Input
              id="hero-headline"
              value={form.hero_headline}
              onChange={(e) => set("hero_headline", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hero-sub">Supporting line</Label>
            <Textarea
              id="hero-sub"
              rows={2}
              value={form.hero_subheadline}
              onChange={(e) => set("hero_subheadline", e.target.value)}
            />
          </div>
          <WebsiteImageField
            label="Hero image"
            value={form.hero_image_url}
            onChange={(url) => set("hero_image_url", url)}
            hint="The photo behind the home page headline."
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hero-cta">Button label</Label>
              <Input
                id="hero-cta"
                value={form.hero_cta_label}
                onChange={(e) => set("hero_cta_label", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hero-cta-url">Button link</Label>
              <Input
                id="hero-cta-url"
                value={form.hero_cta_url}
                onChange={(e) => set("hero_cta_url", e.target.value)}
                placeholder="/programs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardContent className="p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">Events on the home page</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="events-heading">Heading</Label>
              <Input
                id="events-heading"
                value={form.events_heading}
                onChange={(e) => set("events_heading", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="events-intro">Intro line</Label>
              <Input
                id="events-intro"
                value={form.events_intro}
                onChange={(e) => set("events_intro", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <NewsFeedStyleCard form={form} set={set} />

      <HomePopupCard form={form} set={set} />

      <Card className="border-border/70">
        <CardContent className="p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">Contact &amp; footer</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input id="contact-phone" value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-address">Address</Label>
              <Input
                id="contact-address"
                value={form.contact_address}
                onChange={(e) => set("contact_address", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="office-hours">Office hours</Label>
              <Input id="office-hours" value={form.office_hours} onChange={(e) => set("office_hours", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="charity-number">Charity number</Label>
              <Input
                id="charity-number"
                value={form.charity_number}
                onChange={(e) => set("charity_number", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="footer-note">Footer note</Label>
              <Input id="footer-note" value={form.footer_note} onChange={(e) => set("footer_note", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="site-url">Public website address</Label>
              <Input
                id="site-url"
                value={form.public_site_url}
                onChange={(e) => set("public_site_url", e.target.value)}
                placeholder="https://candora.ca"
              />
              <p className="text-xs text-muted-foreground">
                Where supporters go back to after giving online. Leave blank until the website is live.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <Label>Social links</Label>
              <Button size="sm" variant="outline" onClick={addLink}>
                <Plus className="w-3.5 h-3.5" /> Add link
              </Button>
            </div>
            {(form.social_links || []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No social links yet.</p>
            ) : (
              form.social_links.map((link, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    className="w-40"
                    placeholder="Facebook"
                    value={link.label || ""}
                    onChange={(e) => setLink(index, "label", e.target.value)}
                  />
                  <Input
                    placeholder="https://…"
                    value={link.url || ""}
                    onChange={(e) => setLink(index, "url", e.target.value)}
                  />
                  <Button size="icon" variant="ghost" onClick={() => removeLink(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save site settings
        </Button>
      </div>
    </div>
  );
}