import React from 'react';
import ClientVisitFlow from '@/components/reception/clientvisit/ClientVisitFlow';

// Central Database — Client Visit flow without the Grab and Go option
// (Drop-In Casework and Scheduled Visits only)
export default function RCIntake() {
  return <ClientVisitFlow includeGrabAndGo={false} />;
}