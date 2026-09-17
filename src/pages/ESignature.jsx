import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import ESignatureSecurityCard from '@/components/esignature/ESignatureSecurityCard';
import SignatureEditorCard from '@/components/esignature/SignatureEditorCard';
import ESignaturePreview from '@/components/esignature/ESignaturePreview';
import { PenTool } from 'lucide-react';

export default function ESignature() {
  const { user } = useOutletContext();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['esignatureProfile', user?.id],
    queryFn: async () => {
      const p = await base44.entities.ESignatureProfile.filter({ user_id: user?.id });
      return p[0] || null;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <PenTool className="w-6 h-6 text-primary" /> E-Signature
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up the signature you use to sign approvals and documents across the portal. Each signature is
          verified with your PIN or password and logged with a unique verification ID.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <ESignatureSecurityCard user={user} profile={profile} />
          <SignatureEditorCard key={profile?.id || 'new'} user={user} profile={profile} />
          {profile?.signature_type && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Current e-signature
                </p>
                <div className="rounded-lg border bg-white p-6 min-h-[120px] flex items-center justify-center">
                  <ESignaturePreview signature={profile} />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}