import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Database, Unlink, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import ClientPicker from '@/components/centralreg/ClientPicker';
import { matchReasons, fullName } from '@/lib/clientMatch';

const CLB_LEVELS = ["not_assessed", "clb_1", "clb_2", "clb_3", "clb_4", "clb_5", "clb_6", "clb_7", "clb_8", "clb_9", "clb_10", "clb_11", "clb_12"];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Add/Edit ELL learner. For a NEW learner: a Candora Central Database search
// box sits at the top — pick an existing client file, or type a new name and
// similar-name suggestions appear to guard against duplicate files. Saving
// without a linked file creates one automatically (sync workflow). The
// waitlist checkbox is at the top, ON by default for new learners.
export default function LearnerFormDialog({ learner, onClose }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = !learner;
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [linkedId, setLinkedId] = useState(learner?.linked_rc_client_id || null);
  const [form, setForm] = useState({
    first_name: learner?.first_name || "",
    last_name: learner?.last_name || "",
    date_of_birth: learner?.date_of_birth || "",
    phone: learner?.phone || "",
    email: learner?.email || "",
    country_of_origin: learner?.country_of_origin || "",
    first_language: learner?.first_language || "",
    clb_level: learner?.clb_level || "not_assessed",
    enrollment_status: learner?.enrollment_status || "waitlisted",
    intake_date: learner?.intake_date || new Date().toISOString().split("T")[0],
    referral_source: learner?.referral_source || "",
    notes: learner?.notes || "",
  });

  const { data: linkedClient } = useQuery({
    queryKey: ['rc-client', linkedId],
    queryFn: () => base44.entities.RCClient.get(linkedId),
    enabled: !!linkedId,
  });

  // While typing a new name, surface existing Central Database clients that
  // look like the same person so staff link the existing file instead of
  // creating a duplicate.
  useEffect(() => {
    if (linkedId) { setSuggestions([]); return; }
    const first = (form.first_name || '').trim();
    const last = (form.last_name || '').trim();
    if (first.length < 2 && last.length < 2) { setSuggestions([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const queries = [];
        if (first.length >= 2) queries.push(base44.entities.RCClient.filter({ first_name: { $regex: esc(first), $options: 'i' } }).catch(() => []));
        if (last.length >= 2) queries.push(base44.entities.RCClient.filter({ last_name: { $regex: esc(last), $options: 'i' } }).catch(() => []));
        const results = await Promise.all(queries);
        const map = new Map();
        results.forEach((res) => {
          const arr = Array.isArray(res) ? res : (res.items || []);
          arr.forEach((c) => { if (c?.id) map.set(c.id, c); });
        });
        const scored = Array.from(map.values())
          .map((c) => ({ c, ...matchReasons(c, form) }))
          .filter((s) => s.reasons.length > 0 && s.sim >= 0.5)
          .sort((a, b) => (b.strength - a.strength) || (b.sim - a.sim))
          .slice(0, 4);
        if (!cancelled) setSuggestions(scored);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [form.first_name, form.last_name, form.email, form.phone, form.date_of_birth, linkedId]);

  const selectClient = (c) => {
    setForm((f) => ({
      ...f,
      first_name: f.first_name || c.first_name || "",
      last_name: f.last_name || c.last_name || "",
      date_of_birth: f.date_of_birth || c.date_of_birth || "",
      phone: f.phone || c.phone || "",
      email: f.email || c.email || "",
      first_language: f.first_language || c.preferred_language || "",
    }));
    setLinkedId(c.id);
    setSuggestions([]);
    toast({ title: `Linked to ${fullName(c)} — their Central Database file will be used` });
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) {
      toast({ title: "First and last name are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = { ...form, linked_rc_client_id: linkedId || null };
    // Track when a learner is newly placed on the waitlist (drives "days waitlisted").
    if (form.enrollment_status === "waitlisted" && learner?.enrollment_status !== "waitlisted") {
      payload.waitlist_date = new Date().toISOString().split("T")[0];
    }
    try {
      if (learner) {
        await base44.entities.ELLLearner.update(learner.id, payload);
        toast({ title: "Learner updated" });
      } else {
        await base44.entities.ELLLearner.create(payload);
        toast({ title: linkedId ? "Learner added and linked to their Central Database file" : "Learner added — a Central Database file was created for them" });
      }
      queryClient.invalidateQueries(["ellLearners"]);
      setOpen(false);
      onClose?.();
    } catch (e) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose?.(); setOpen(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{learner ? "Edit Learner" : "Add Learner"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {/* Waitlist checkbox — visible, at the top, on by default */}
          <label className="flex items-start gap-3 rounded-lg border-2 border-warning/60 bg-warning/10 p-3 cursor-pointer">
            <Checkbox
              checked={form.enrollment_status === "waitlisted"}
              onCheckedChange={(v) => setForm({ ...form, enrollment_status: v ? "waitlisted" : "prospective" })}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">Add this person to the ELL waitlist</p>
              <p className="text-xs text-muted-foreground">They don't have a spot yet — they'll be tracked on the waitlist until one opens up.</p>
            </div>
          </label>

          {/* Central Database — pick an existing client file or create a new one */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Database className="h-4 w-4 text-violet-600" /> Candora Central Database
            </p>
            {linkedId ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-foreground">
                  Using existing file: <span className="font-medium">{linkedClient ? fullName(linkedClient) : 'Loading…'}</span>
                </p>
                <Button type="button" size="sm" variant="outline" onClick={() => setLinkedId(null)}><Unlink className="h-3.5 w-3.5" /> Unlink</Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Search for this person's existing client file, or just fill in the form below to create a new one.
                </p>
                <ClientPicker onSelect={selectClient} placeholder="Search existing clients by name..." />
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name *</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>

          {/* Similar-name suggestions — guard against duplicate central files */}
          {!linkedId && suggestions.length > 0 && (
            <div className="rounded-lg border border-warning/60 bg-warning/10 p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-warning" />
                Possible existing Central Database records — check before creating a new profile
              </p>
              {suggestions.map(({ c, reasons }) => (
                <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{fullName(c)} {reasons.some((r) => r.strong) && <span className="text-xs text-success font-normal">(strong match)</span>}</p>
                    <p className="text-xs text-muted-foreground truncate">{[c.email, c.phone].filter(Boolean).join(' · ')}</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => selectClient(c)}>Use this record</Button>
                </div>
              ))}
            </div>
          )}
          {!linkedId && searching && <p className="text-xs text-muted-foreground">Checking the Central Database for similar names…</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Country of Origin</Label>
              <Input value={form.country_of_origin} onChange={(e) => setForm({ ...form, country_of_origin: e.target.value })} />
            </div>
            <div>
              <Label>First Language</Label>
              <Input value={form.first_language} onChange={(e) => setForm({ ...form, first_language: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CLB Level</Label>
              <Select value={form.clb_level} onValueChange={(v) => setForm({ ...form, clb_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLB_LEVELS.map((l) => <SelectItem key={l} value={l}>{l.replace("_", " ").toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Enrollment Status</Label>
              <Select value={form.enrollment_status} onValueChange={(v) => setForm({ ...form, enrollment_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["prospective", "waitlisted", "enrolled", "active", "completed", "withdrawn"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Intake Date</Label>
              <Input type="date" value={form.intake_date} onChange={(e) => setForm({ ...form, intake_date: e.target.value })} />
            </div>
            <div>
              <Label>Referral Source</Label>
              <Input value={form.referral_source} onChange={(e) => setForm({ ...form, referral_source: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}