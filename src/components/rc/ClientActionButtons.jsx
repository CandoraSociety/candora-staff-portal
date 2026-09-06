import React from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardList, Baby, GraduationCap, ExternalLink } from 'lucide-react';

export default function ClientActionButtons({ client, busy, onIntensive, onCaregiver, onRegister, onExternalReferral }) {
  const isIntensive = client.service_category === 'intensive_services';
  const isCaregiver = client.service_category === 'caregiver_capacity_0_5';
  return (
    <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap gap-2">
      <Button size="sm" disabled={isIntensive || busy} onClick={onIntensive}>
        <ClipboardList className="h-4 w-4" /> {isIntensive ? 'In Intensive Services' : 'Add to Intensive Services'}
      </Button>
      <Button size="sm" variant="outline" disabled={isCaregiver || busy} onClick={onCaregiver}>
        <Baby className="h-4 w-4" /> {isCaregiver ? 'In 0-6 Caregiver Capacity' : 'Add to 0-6 Caregiver Capacity'}
      </Button>
      <Button size="sm" variant="outline" onClick={onRegister}>
        <GraduationCap className="h-4 w-4" /> Register For Program
      </Button>
      <Button size="sm" variant="outline" onClick={onExternalReferral}>
        <ExternalLink className="h-4 w-4" /> External Referral
      </Button>
    </div>
  );
}