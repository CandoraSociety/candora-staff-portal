import React from 'react';
import { useSimpleMode } from '@/lib/useSimpleMode';
import SimpleReceptionHome from '@/components/reception/SimpleReceptionHome';
import ReceptionFullHome from '@/components/reception/ReceptionFullHome';

// Simple mode gives the front desk three big navigation cards and nothing else.
export default function ReceptionDashboard() {
  const { simpleMode } = useSimpleMode();
  return simpleMode ? <SimpleReceptionHome /> : <ReceptionFullHome />;
}