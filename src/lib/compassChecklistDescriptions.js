import { outcomeDesc } from '@/lib/crtCodes';

// Returns a short, plain-language note explaining what a filled CRT Client Data
// field means / what it implies should be true in Compass. Contextualized by the
// client's Service Element (DEA vs WD) where the meaning differs.
export function fieldDescription(label, value, serviceElement) {
  const v = String(value || '').trim();
  const isDEA = String(serviceElement || '').toUpperCase() === 'DEA';
  switch (label) {
    case 'Client Legal Name':
      return "The client's legal name — must match the Compass record exactly.";
    case 'COMPASS HSID #':
      return "The client's Health Services ID — use it to find or create their Compass file.";
    case 'CEIS (DEA)':
      return v === 'Yes'
        ? "Client has a DEA/CEIS case — ensure the Compass CEIS flag is set."
        : "No DEA/CEIS case — standard Compass entry.";
    case 'DEA Start Date':
      return 'When the DEA case started — enter as the DEA start date in Compass.';
    case 'Service Element':
      return isDEA
        ? "Disability Employment Action stream — Compass entry goes under the DEA case."
        : "Workforce Development stream — Compass entry goes under the WD intake.";
    case 'Service Start Date':
      return isDEA
        ? "Date the client started service; the 2-week DEA end date and the 16-week WD service end date are measured from here."
        : "Date the client started service; the 16-week service end date is measured from here.";
    case 'Service Outcome':
      if (/^complete/i.test(v)) {
        return isDEA
          ? "Client has completed the DEA action-plan items — close the service in Compass."
          : "Client has completed their action-plan items (except the work-search phase) — mark the service complete in Compass.";
      }
      return "The current service result — reflect it as the service outcome in Compass.";
    case 'Service Outcome Date':
      return "Date the service was marked complete — set the Compass service outcome date to this.";
    case 'Placement Outcome':
      return `Post-placement employment status: ${outcomeDesc(v) || v}. Record it as the placement outcome in Compass.`;
    case 'Placement Outcome Date':
      return "Date the placement outcome was determined — set it as the placement outcome date in Compass.";
    case '30 Day Outcome':
      return `Employment status at the 30-day follow-up: ${outcomeDesc(v) || v}.`;
    case '30 Day Outcome Date':
      return "Date of the 30-day follow-up — record it in Compass.";
    case '60 Day Outcome':
      return `Employment status at the 60-day follow-up: ${outcomeDesc(v) || v}.`;
    case '60 Day Outcome Date':
      return "Date of the 60-day follow-up — record it in Compass.";
    case '90 Day Outcome':
      return `Employment status at the 90-day follow-up: ${outcomeDesc(v) || v}.`;
    case '90 Day Outcome Date':
      return "Date of the 90-day follow-up — record it in Compass.";
    case '180 Day Outcome':
      return `Employment status at the 180-day follow-up: ${outcomeDesc(v) || v}.`;
    case '180 Day Outcome Date':
      return "Date of the 180-day follow-up — record it in Compass.";
    case 'Comments':
      return "Free-text notes (column S) — context on action plans, placements and follow-ups to attach to the Compass record.";
    default:
      return '';
  }
}