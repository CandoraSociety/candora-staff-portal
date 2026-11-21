import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { DATA_STORAGE_ACK } from '@/lib/dataPrivacy';

// The box someone ticks before a form with personal details is submitted.
export default function DataPrivacyAck({ checked, onCheckedChange, className = '' }) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 ${className}`}>
      <Checkbox checked={!!checked} onCheckedChange={onCheckedChange} className="mt-0.5" />
      <span className="text-sm text-slate-600 leading-relaxed">{DATA_STORAGE_ACK}</span>
    </div>
  );
}