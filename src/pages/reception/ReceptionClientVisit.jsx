import React from 'react';
import ClientVisitFlow from '@/components/reception/clientvisit/ClientVisitFlow';

// Reception — full Client Visit flow (Grab and Go, Drop-In Casework, Scheduled Visit)
export default function ReceptionClientVisit() {
  return <ClientVisitFlow includeGrabAndGo />;
}