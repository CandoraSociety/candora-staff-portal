import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Link2, Copy, Eye, Check, X, Inbox } from "lucide-react";
import EmpowerUApplicationForm from "./EmpowerUApplicationForm";
import { formatDate } from "@/lib/dateUtils";

const APP_STATUSES = {
  pending: { label: "Awaiting approval", cls: "bg-warning/10 text-warning" },
  approved: { label: "Approved", cls: "bg-success/10 text-success" },
  rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive" },
};

// EmpowerU applications submitted from a cohort's public registration link.
// Used in the EmpowerU portal (with a cohort — also shows the link + form
// preview) and in the Central Registration portal (without a cohort — shows
// applications across all cohorts). Approving builds the participant
// profile, adds them to the cohort, and syncs them to the central database.
export default function EmpowerUApplicationsPanel({ cohort }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["empoweru-applications", cohort?.id || "all"],
    queryFn: () => base44.entities.EmpowerUApplication.filter(cohort ? { cohort_id: cohort.id } : {}, { sort: "-created_date", limit: 200 }).then(r => r.items),
  });

  const pending = applications.filter(a => a.status === "pending");
  const reviewed = applications.filter(a => a.status !== "pending");
  const registrationLink = cohort ? `${window.location.origin}/empoweru-apply/${cohort.id}` : null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationLink);
      toast({ title: "Registration link copied" });
    } catch {
      toast({ title: "Could not copy — select the link text and copy manually", variant: "destructive" });
    }
  };

  const review = async (application, action) => {
    setBusy(application.id + action);
    try {
      await base44.functions.invoke("approveEmpowerUApplication", { application_id: application.id, action });
      toast({
        title: action === "approve" ? "Application approved" : "Application rejected",
        description: action === "approve"
          ? `${application.first_name} ${application.last_name} — profile created and added to the cohort. They will be added to the central database automatically.`
          : `${application.first_name} ${application.last_name} — declined.`,
      });
      queryClient.invalidateQueries({ queryKey: ["empoweru-applications"] });
      queryClient.invalidateQueries({ queryKey: ["empoweru-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["empoweru-participants"] });
      queryClient.invalidateQueries();
    } catch (e) {
      toast({ title: "Error reviewing application", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const Row = ({ a }) => {
    const badge = APP_STATUSES[a.status] || APP_STATUSES.pending;
    return (
      <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-medium text-foreground">{a.first_name} {a.last_name}</p>
            {!cohort && a.cohort_name && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{a.cohort_name}</span>}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            {a.phone && <span>{a.phone}</span>}
            {a.email && <span>{a.email}</span>}
            <span>Applied {a.application_date ? formatDate(a.application_date) : ""}</span>
            {a.status !== "pending" && a.reviewed_by_name && <span>Reviewed by {a.reviewed_by_name}</span>}
          </div>
        </div>
        {a.status === "pending" && (
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" className="text-green-600" disabled={!!busy} onClick={() => review(a, "approve")}><Check className="h-3.5 w-3.5" /> Approve</Button>
            <Button size="sm" variant="outline" className="text-red-600" disabled={!!busy} onClick={() => review(a, "reject")}><X className="h-3.5 w-3.5" /> Reject</Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {cohort && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4" /> Registration Link</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input readOnly value={registrationLink} className="flex-1 h-9 px-3 rounded-md border border-input bg-muted text-xs text-muted-foreground focus:outline-none" onFocus={e => e.target.select()} />
              <Button size="sm" variant="outline" onClick={copyLink}><Copy className="h-3.5 w-3.5" /> Copy</Button>
              <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="h-3.5 w-3.5" /> Preview</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can fill out the application form — the link opens the form only, never the portal. New submissions await approval below.
              {!cohort.registration_open && " Registration is currently closed — open it by editing the cohort."}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Inbox className="h-4 w-4" /> Applications{cohort ? "" : " — EmpowerU"} ({pending.length} awaiting approval)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No applications waiting for review.</p>
          ) : pending.map(a => <Row key={a.id} a={a} />)}

          {reviewed.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recently reviewed</p>
              {reviewed.slice(0, 10).map(a => <Row key={a.id} a={a} />)}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="p-4 pb-2"><DialogTitle className="text-base">Application Form Preview</DialogTitle></DialogHeader>
          <div className="px-4 pb-4">
            <EmpowerUApplicationForm cohort={cohort} previewMode />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}