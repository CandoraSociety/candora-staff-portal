import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { appParams } from "@/lib/app-params";
import EmpowerUApplicationForm from "@/components/empoweru/EmpowerUApplicationForm";
import { CheckCircle2, AlertCircle } from "lucide-react";

const CANDORA_LOGO_URL = "https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png";

// Public EmpowerU application form — opened from a cohort's registration
// link. Completely standalone: no login, no navigation into the portal.
export default function EmpowerUPublicApplication() {
  const { cohortId } = useParams();
  // Personal link pre-fill (?first=&last=): the name is locked so a forwarded
  // link can only ever submit the intended person's application.
  const urlParams = new URLSearchParams(window.location.search);
  const prefillFirst = urlParams.get("first") || null;
  const prefillLast = urlParams.get("last") || null;
  const [cohort, setCohort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [closed, setClosed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`/api/apps/${appParams.appId}/functions/getPublicEmpowerUApplication`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cohort_id: cohortId }),
        });
        const result = await response.json();
        if (!response.ok || !result.cohort) { setNotFound(true); return; }
        setCohort(result.cohort);
        setClosed(!result.cohort.registration_open);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cohortId]);

  const handleSubmit = async (form) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/apps/${appParams.appId}/functions/publicEmpowerUIntake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, cohort_id: cohortId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Submission failed (${response.status})`);
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={CANDORA_LOGO_URL} alt="Candora" className="h-10 w-10 rounded-full object-contain" />
          <div>
            <p className="font-display font-bold text-sm leading-tight">Candora Society of Edmonton</p>
            <p className="text-xs text-muted-foreground">EmpowerU — Women's Saving Group</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
        ) : notFound ? (
          <div className="text-center py-16 space-y-3">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-medium">This registration link is no longer valid.</p>
            <p className="text-sm text-muted-foreground">Please contact the Candora office for a current link.</p>
          </div>
        ) : submitted ? (
          <div className="text-center py-16 space-y-3 bg-card border border-border rounded-2xl p-8">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            <p className="font-heading text-xl font-bold">Thank you — your application has been received!</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Your application for {cohort?.name} is now awaiting review by our team. Once approved, you'll be added to the cohort and we'll be in touch.
            </p>
          </div>
        ) : closed ? (
          <div className="text-center py-16 space-y-3">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-medium">Registration for {cohort.name} is currently closed.</p>
            <p className="text-sm text-muted-foreground">Please contact the Candora office at 780.474.5011 for more information.</p>
          </div>
        ) : (
          <EmpowerUApplicationForm cohort={cohort} submitting={submitting} error={error} onSubmit={handleSubmit} prefilledName={prefillFirst || prefillLast ? { first: prefillFirst, last: prefillLast } : null} />
        )}
      </main>
    </div>
  );
}