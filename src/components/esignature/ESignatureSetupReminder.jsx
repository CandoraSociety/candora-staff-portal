import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { PenTool, ArrowRight } from 'lucide-react';

export default function ESignatureSetupReminder() {
  const { user } = useOutletContext();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['esignatureProfile', user?.id],
    queryFn: async () => {
      const p = await base44.entities.ESignatureProfile.filter({ user_id: user?.id });
      return p[0] || null;
    },
    enabled: !!user?.id,
  });

  if (isLoading || profile) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-warning/40 bg-warning/10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
          <PenTool className="w-4 h-4 text-warning-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">Set up your e-signature</p>
          <p className="text-xs text-muted-foreground">
            A signature PIN or password is now required to sign approvals and documents in the portal.
          </p>
        </div>
      </div>
      <Button asChild size="sm" className="flex-shrink-0">
        <Link to="/e-signature">
          Set it up <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </Button>
    </div>
  );
}