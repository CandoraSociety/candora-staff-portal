import React from 'react';
import { Link2, Check, Phone, Mail, Pencil, BellRing, ChevronDown, User, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dateUtils';
import { WAITLIST_STATUS_OPTIONS, DELIVERY_MODE_LABELS } from '@/lib/empoweruConstants';

const todayISO = () => new Date().toISOString().slice(0, 10);

export function StatusChip({ status }) {
  const opt = WAITLIST_STATUS_OPTIONS.find((o) => o.value === status) || WAITLIST_STATUS_OPTIONS[0];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-foreground">
      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
      {opt.label}
    </span>
  );
}

const GENDER_LABELS = { female: 'Female', male: 'Male', other: 'Other' };
const MARITAL_LABELS = { married: 'Married', common_law: 'Common law', divorced: 'Divorced', separated: 'Separated', single: 'Single', widowed: 'Widowed', other: 'Other' };
const IDENTIFY_LABELS = { indigenous: 'Indigenous', immigrant: 'Immigrant', person_with_disabilities: 'Person with disabilities', na: 'N/A' };
const CITIZENSHIP_LABELS = { canadian_citizen: 'Canadian citizen', permanent_resident: 'Permanent resident', temporary_resident: 'Temporary resident', refugee: 'Refugee', first_nations_metis_inuit: 'First Nations / Métis / Inuit' };
const LANGUAGE_LABELS = { english: 'English', french: 'French', indigenous_language: 'Indigenous language', other: 'Other' };
const HS_LABELS = { yes: 'Yes', no: 'No', prefer_not_to_answer: 'Prefer not to answer' };
const PREF_DELIVERY_LABELS = { ...DELIVERY_MODE_LABELS, no_preference: 'No preference' };

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p className="text-xs text-foreground mt-0.5 break-words">{value}</p>
    </div>
  );
}

// One waitlist entry: collapsed shows name, status chip, cohort, contact info and
// follow-up; clicking the header expands a full profile panel with everything on
// file for the participant and their waitlist tracking details.
export default function WaitlistEntryCard({ entry, position, expanded, onToggle, onEdit, onCopyLink, copied }) {
  const p = entry.participant || {};
  const overdue = entry.follow_up_date && entry.follow_up_date < todayISO();

  return (
    <Card><CardContent className="p-3">
      <button type="button" onClick={onToggle} className="w-full text-left" aria-expanded={expanded}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm text-foreground truncate">{entry.full_name}</p>
              <span className="text-xs text-muted-foreground">#{position}</span>
              <StatusChip status={entry.waitlist_status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entry.cohort_name || 'No cohort'}{entry.date_added ? ` · Added ${formatDate(entry.date_added)}` : ''}
            </p>
            {(entry.phone || entry.email) && (
              <p className="text-xs text-muted-foreground/80 mt-0.5 flex items-center gap-3 flex-wrap">
                {entry.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{entry.phone}</span>}
                {entry.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{entry.email}</span>}
              </p>
            )}
            {(entry.last_contact_note || entry.last_contacted_date) && (
              <p className="text-xs text-muted-foreground/80 mt-0.5 flex items-center gap-1.5 flex-wrap">
                {entry.last_contacted_date && <span className="whitespace-nowrap">Last contact {formatDate(entry.last_contacted_date)}</span>}
                {entry.last_contact_note && <span>· {entry.last_contact_note}</span>}
              </p>
            )}
            {entry.follow_up_date && (
              <p className={cn('text-xs mt-0.5 flex items-center gap-1', overdue ? 'text-destructive font-medium' : 'text-muted-foreground/80')}>
                <BellRing className="h-3 w-3" /> Follow up {formatDate(entry.follow_up_date)}{overdue ? ' — overdue' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /> Update</Button>
            </span>
            <span onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="outline" onClick={onCopyLink} disabled={!entry.first_name || !entry.cohort_id} className={cn(copied && 'text-success border-success')}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy Registration Link'}
              </Button>
            </span>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-4">
          <div>
            <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mb-2"><User className="h-3.5 w-3.5" /> Contact</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Detail label="Phone" value={p.phone || entry.phone} />
              <Detail label="Email" value={p.email || entry.email} />
              <Detail label="Date of birth" value={p.date_of_birth ? formatDate(p.date_of_birth) : null} />
              <Detail label="Emergency contact" value={p.emergency_contact} />
              <div className="col-span-2 md:col-span-4">
                <Detail label="Address" value={p.address} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mb-2"><User className="h-3.5 w-3.5" /> Background</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Detail label="Gender" value={GENDER_LABELS[p.gender]} />
              <Detail label="Marital status" value={MARITAL_LABELS[p.marital_status]} />
              <Detail label="Identifies as" value={IDENTIFY_LABELS[p.self_identification]} />
              <Detail label="Citizenship" value={CITIZENSHIP_LABELS[p.citizenship]} />
              <Detail label="Arrived in Canada" value={p.arrival_canada} />
              <Detail label="Country of origin" value={p.country_of_origin} />
              <Detail label="Family language" value={LANGUAGE_LABELS[p.family_language]} />
              <Detail label="High school completed" value={HS_LABELS[p.high_school_completed]} />
              <Detail label="Preferred language" value={p.preferred_language} />
              <Detail label="Referral organization" value={p.referral_organization} />
              <Detail label="Learned about Candora" value={p.learned_about_candora?.replace(/_/g, ' ')} />
              <Detail label="Photo consent" value={p.photo_consent === 'consent' ? 'Consent' : p.photo_consent === 'refuse' ? 'Refused' : null} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mb-2"><CalendarDays className="h-3.5 w-3.5" /> Waitlist details</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Detail label="Waitlist position" value={entry.waitlist_position ? `#${entry.waitlist_position}` : `#${position}`} />
              <Detail label="Preferred delivery" value={PREF_DELIVERY_LABELS[entry.preferred_delivery_mode]} />
              <Detail label="Date added" value={entry.date_added ? formatDate(entry.date_added) : null} />
              <Detail label="Follow up on" value={entry.follow_up_date ? formatDate(entry.follow_up_date) : null} />
              <Detail label="Last contacted" value={entry.last_contacted_date ? formatDate(entry.last_contacted_date) : null} />
              <Detail label="Accommodation needs" value={entry.accommodation_needs} />
              <div className="col-span-2 md:col-span-4">
                <Detail label="Last contact note" value={entry.last_contact_note} />
              </div>
              <div className="col-span-2 md:col-span-4">
                <Detail label="Intake notes" value={entry.intake_notes} />
              </div>
              <div className="col-span-2 md:col-span-4">
                <Detail label="Notes" value={entry.notes} />
              </div>
            </div>
          </div>
        </div>
      )}
    </CardContent></Card>
  );
}