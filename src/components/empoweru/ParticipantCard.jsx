import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/rc/StatusBadge';
import { REGISTRATION_STATUS_OPTIONS, ACCOUNT_SETUP_STATUS_OPTIONS } from '@/lib/empoweruConstants';

// One participant card for the Active/Past sections on the Participants tab.
// Shows contact info, per-cohort program status, and the admin/progress items
// that need attention (account setup status, pending service follow-ups).
export default function ParticipantCard({ participant, registrations, accountSetup, followUpsNeeded }) {
  const fullName = `${participant.first_name} ${participant.last_name}`;
  const initials = `${participant.first_name?.[0] || ''}${participant.last_name?.[0] || ''}`;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Link to={`/empoweru/participants/${participant.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold text-sm">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground hover:text-primary truncate">{fullName}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {registrations.length === 0
                  ? <span className="text-xs text-muted-foreground">No cohort yet</span>
                  : registrations.map(r => (
                    <span key={r.id} className="inline-flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{r.cohort_name}</span>
                      <StatusBadge status={r.status} options={REGISTRATION_STATUS_OPTIONS} />
                    </span>
                  ))}
              </div>
            </div>
          </Link>
        </div>

        <div className="space-y-1">
          {participant.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> {participant.phone}</p>}
          {participant.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> {participant.email}</p>}
        </div>

        {(accountSetup || followUpsNeeded > 0) && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {accountSetup && (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Account setup:</span>
                <StatusBadge status={accountSetup.status} options={ACCOUNT_SETUP_STATUS_OPTIONS} />
              </span>
            )}
            {followUpsNeeded > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-warning-foreground bg-warning rounded-full px-2 py-0.5">
                <AlertCircle className="h-3 w-3" /> {followUpsNeeded} follow-up{followUpsNeeded > 1 ? 's' : ''} needed
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}