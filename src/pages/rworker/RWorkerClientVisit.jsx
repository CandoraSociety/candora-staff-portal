import React from 'react';
import ClientVisitFlow from '@/components/reception/clientvisit/ClientVisitFlow';

// Resource Worker — Client Visit flow without the Grab and Go option
// (Drop-In Casework and Scheduled Visits only).
export default function RWorkerClientVisit() {
  return <ClientVisitFlow includeGrabAndGo={false} />;
}