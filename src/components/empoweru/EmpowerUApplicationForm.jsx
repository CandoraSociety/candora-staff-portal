import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Send, AlertCircle } from "lucide-react";
import { DELIVERY_MODE_LABELS } from "@/lib/empoweruConstants";
import { formatDate } from "@/lib/dateUtils";

export const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];
export const MARITAL_STATUS_OPTIONS = [
  { value: "married", label: "Married" },
  { value: "common_law", label: "Common Law" },
  { value: "divorced", label: "Divorced" },
  { value: "separated", label: "Separated" },
  { value: "single", label: "Single" },
  { value: "widowed", label: "Widowed" },
  { value: "other", label: "Other" },
];
export const IDENTIFICATION_OPTIONS = [
  { value: "indigenous", label: "Indigenous" },
  { value: "immigrant", label: "Immigrant" },
  { value: "person_with_disabilities", label: "Person with disabilities" },
  { value: "na", label: "N/A" },
];
export const CITIZENSHIP_OPTIONS = [
  { value: "canadian_citizen", label: "Canadian Citizen" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "temporary_resident", label: "Temporary resident" },
  { value: "refugee", label: "Refugee" },
  { value: "first_nations_metis_inuit", label: "First Nations / Metis / Inuit" },
];
export const FAMILY_LANGUAGE_OPTIONS = [
  { value: "english", label: "English" },
  { value: "french", label: "French" },
  { value: "indigenous_language", label: "Indigenous Language" },
  { value: "other", label: "Other" },
];
export const HIGH_SCHOOL_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "prefer_not_to_answer", label: "Prefer not to answer" },
];
export const PHOTO_CONSENT_OPTIONS = [
  { value: "consent", label: "I consent" },
  { value: "refuse", label: "I refuse consent" },
];
export const LEARNED_ABOUT_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "friend_neighbour", label: "Friend / Neighbour" },
  { value: "poster_mall", label: "Poster in the mall" },
  { value: "candora_employment_program", label: "Candora Employment Program" },
  { value: "referred_by_agency", label: "Referred by another agency" },
];

// Flat value → label map for every choice field (used by review lists)
export const EMPOWERU_FIELD_LABELS = Object.fromEntries(
  [...GENDER_OPTIONS, ...MARITAL_STATUS_OPTIONS, ...IDENTIFICATION_OPTIONS, ...CITIZENSHIP_OPTIONS,
    ...FAMILY_LANGUAGE_OPTIONS, ...HIGH_SCHOOL_OPTIONS, ...PHOTO_CONSENT_OPTIONS, ...LEARNED_ABOUT_OPTIONS]
    .map(o => [o.value, o.label])
);

export const FOIP_TEXT = "The CANDORA Society of Edmonton is funded by a variety of sources. To maintain this funding, we are required to collect program participant information for the purposes of service assessment, delivery, and evaluation. All information is collected in accordance with the Freedom of Information and Protection of Privacy (FOIP) Act and the Health Information Act (HIA). Your information will remain confidential during your participation in the program and after it is completed. By agreeing to the Release of Information agreement, you help ensure the CANDORA Society's continued access to funding that makes our programs possible.";

export const PHOTO_TEXT = "We may take pictures of you or your family members at a CANDORA activity. These pictures may be displayed in the public when we advertise our program. Sometimes the media comes to do an article on CANDORA and they take pictures of the participants. These pictures may be published in a newspaper, magazine, or other media.";

function ChoiceGroup({ value, options, onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onPick(value === o.value ? "" : o.value)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition ${value === o.value ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Question({ number, title, required, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium leading-snug">
        <span className="text-muted-foreground mr-1">{number}.</span>
        {title}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

// The EmpowerU application/registration form, replicating the Microsoft Form
// sent out to participants. Used by the public registration link (mode:
// live submit) and by the staff preview dialogs in the EmpowerU and Central
// Registration portals (mode: preview).
export default function EmpowerUApplicationForm({ cohort, previewMode = false, submitting = false, error = null, onSubmit, prefilledName = null, prefill = null }) {
  const [form, setForm] = useState(() => ({
    application_date: new Date().toISOString().split("T")[0],
    consent_agreed: false,
    website: "",
    first_name: prefilledName?.first || "",
    last_name: prefilledName?.last || "",
    // Pre-filled from the participant's record via their personal waitlist
    // link — editable, unlike the locked name fields.
    date_of_birth: prefill?.dob || "",
    gender: prefill?.gender || "",
    marital_status: prefill?.marital || "",
    self_identification: prefill?.identify || "",
    citizenship: prefill?.citizen || "",
    arrival_canada: prefill?.arrival || "",
    country_of_origin: prefill?.origin || "",
    family_language: prefill?.language || "",
    high_school_completed: prefill?.hs || "",
    address: prefill?.address || "",
    phone: prefill?.phone || "",
    email: prefill?.email || "",
    emergency_contact: prefill?.emergency || "",
  }));
  const [validationError, setValidationError] = useState(null);
  const update = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (previewMode) return;
    if (!form.consent_agreed) {
      setValidationError("Please read and accept the Release of Information agreement (question 1) to submit the application.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!form.first_name?.trim() || !form.last_name?.trim()) {
      setValidationError("Please enter your first and last name.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setValidationError(null);
    onSubmit(form);
  };

  const shownError = validationError || error;

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <input type="text" name="website" value={form.website} onChange={e => update("website", e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />

      {previewMode && (
        <div className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground text-xs font-medium">
          <Eye className="h-3.5 w-3.5" />
          Preview — this is exactly what applicants see on the public form.
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-5">
        <div className="border-b border-border pb-4 space-y-1.5">
          <h1 className="text-lg font-heading font-bold text-foreground">EmpowerU Application/Registration Form</h1>
          <p className="text-sm font-medium text-primary">{cohort?.name || "EmpowerU Program"}</p>
          <p className="text-sm text-muted-foreground">
            {cohort?.start_date ? formatDate(cohort.start_date) : "TBD"} → {cohort?.end_date ? formatDate(cohort.end_date) : "TBD"}
            {cohort?.delivery_mode ? ` · ${DELIVERY_MODE_LABELS[cohort.delivery_mode] || cohort.delivery_mode}` : ""}
            {cohort?.location ? ` · ${cohort.location}` : ""}
          </p>
        </div>

        {shownError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{shownError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Question number={1} title="Release of Information" required>
            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">{FOIP_TEXT}</p>
            <div className="flex items-start gap-2.5">
              <Checkbox id="eu-consent" checked={!!form.consent_agreed} onCheckedChange={v => update("consent_agreed", v === true)} className="mt-0.5" />
              <label htmlFor="eu-consent" className="text-sm leading-snug cursor-pointer">
                I have read and understand the Release of Information disclosure noted above. I authorize the CANDORA Society to disclose information collected for service assessment, delivery, and evaluation only.
              </label>
            </div>
          </Question>

          <div className="grid sm:grid-cols-2 gap-5">
            <Question number={2} title="Today's date">
              <Input type="date" value={form.application_date || ""} onChange={e => update("application_date", e.target.value)} />
            </Question>
            <Question number={7} title="Birth date">
              <Input type="date" value={form.date_of_birth || ""} onChange={e => update("date_of_birth", e.target.value)} />
            </Question>
            <Question number={3} title="First Name (as shown in your ID)" required>
              <Input value={form.first_name || ""} onChange={e => update("first_name", e.target.value)} placeholder="First name" readOnly={!!prefilledName} className={prefilledName ? "bg-muted cursor-not-allowed" : ""} />
            </Question>
            <Question number={4} title="Last name (as shown in your ID)" required>
              <Input value={form.last_name || ""} onChange={e => update("last_name", e.target.value)} placeholder="Last name" readOnly={!!prefilledName} className={prefilledName ? "bg-muted cursor-not-allowed" : ""} />
            </Question>
          </div>

          <Question number={5} title="Gender">
            <ChoiceGroup value={form.gender} options={GENDER_OPTIONS} onPick={v => update("gender", v)} />
          </Question>
          <Question number={6} title="Marital Status">
            <ChoiceGroup value={form.marital_status} options={MARITAL_STATUS_OPTIONS} onPick={v => update("marital_status", v)} />
          </Question>
          <Question number={8} title="I identify myself as">
            <ChoiceGroup value={form.self_identification} options={IDENTIFICATION_OPTIONS} onPick={v => update("self_identification", v)} />
          </Question>
          <Question number={9} title="Citizenship Information">
            <ChoiceGroup value={form.citizenship} options={CITIZENSHIP_OPTIONS} onPick={v => update("citizenship", v)} />
          </Question>

          <div className="grid sm:grid-cols-2 gap-5">
            <Question number={10} title="If Immigrant — Arrival in Canada: mm/yy (or N/A)">
              <Input value={form.arrival_canada || ""} onChange={e => update("arrival_canada", e.target.value)} placeholder="mm/yy or N/A" />
            </Question>
            <Question number={11} title="What is your country of origin?">
              <Input value={form.country_of_origin || ""} onChange={e => update("country_of_origin", e.target.value)} placeholder="Country of origin" />
            </Question>
          </div>

          <Question number={12} title="What language does YOUR FAMILY speak at home?">
            <ChoiceGroup value={form.family_language} options={FAMILY_LANGUAGE_OPTIONS} onPick={v => update("family_language", v)} />
          </Question>
          <Question number={13} title="Have you completed High School?">
            <ChoiceGroup value={form.high_school_completed} options={HIGH_SCHOOL_OPTIONS} onPick={v => update("high_school_completed", v)} />
          </Question>
          <Question number={14} title="Your address (including unit/house number, street, city and postal code)">
            <Input value={form.address || ""} onChange={e => update("address", e.target.value)} placeholder="Full address" />
          </Question>

          <div className="grid sm:grid-cols-2 gap-5">
            <Question number={15} title="Phone number">
              <Input value={form.phone || ""} onChange={e => update("phone", e.target.value)} placeholder="Phone number" />
            </Question>
            <Question number={16} title="Current Email">
              <Input type="email" value={form.email || ""} onChange={e => update("email", e.target.value)} placeholder="Email address" />
            </Question>
          </div>

          <Question number={17} title="Emergency Contact name and Number">
            <Input value={form.emergency_contact || ""} onChange={e => update("emergency_contact", e.target.value)} placeholder="Name and phone number" />
          </Question>
          <Question number={18} title="If referred by another agency, please name the organization">
            <Input value={form.referral_organization || ""} onChange={e => update("referral_organization", e.target.value)} placeholder="Referring organization (optional)" />
          </Question>

          <Question number={19} title="PHOTOS">
            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">{PHOTO_TEXT}</p>
            <ChoiceGroup value={form.photo_consent} options={PHOTO_CONSENT_OPTIONS} onPick={v => update("photo_consent", v)} />
          </Question>

          <Question number={20} title="How did you learn about CANDORA Programs?">
            <ChoiceGroup value={form.learned_about_candora} options={LEARNED_ABOUT_OPTIONS} onPick={v => update("learned_about_candora", v)} />
          </Question>

          {previewMode ? (
            <p className="text-xs text-muted-foreground border-t border-border pt-4">End of preview — the applicant would see a Submit button here.</p>
          ) : (
            <div className="pt-2">
              <Button type="submit" disabled={submitting} className="w-full h-11 text-base">
                <Send className="h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}