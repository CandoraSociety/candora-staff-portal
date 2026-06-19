import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OnboardingBanner({ pendingCount, requiredPendingCount, onClick }) {
  if (pendingCount === 0) return null;

  return (
    <div className="mx-4 mt-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-amber-900">Onboarding Incomplete</p>
          <p className="text-sm text-amber-700">
            {requiredPendingCount > 0
              ? `${requiredPendingCount} required item${requiredPendingCount !== 1 ? 's' : ''} still need${requiredPendingCount === 1 ? 's' : ''} your attention.`
              : `${pendingCount} optional item${pendingCount !== 1 ? 's' : ''} remaining.`}
          </p>
        </div>
      </div>
      <Button onClick={onClick} className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0">
        Continue <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}