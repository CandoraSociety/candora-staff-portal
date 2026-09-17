import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ESignatureSecurityCard from '@/components/esignature/ESignatureSecurityCard';
import SignatureEditorCard, { signaturePayload } from '@/components/esignature/SignatureEditorCard';
import ESignaturePreview from '@/components/esignature/ESignaturePreview';
import { PenTool, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';

export default function ESignature() {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['esignatureProfile', user?.id],
    queryFn: async () => {
      const p = await base44.entities.ESignatureProfile.filter({ user_id: user?.id });
      return p[0] || null;
    },
    enabled: !!user?.id,
  });

  const { data: savedSignatures = [] } = useQuery({
    queryKey: ['savedSignatures', user?.id],
    queryFn: () => base44.entities.SavedESignature.filter({ user_id: user?.id }, 'created_date'),
    enabled: !!user?.id,
  });

  const activeId = profile?.active_signature_id || null;

  const invalidate = () => {
    queryClient.invalidateQueries(['esignatureProfile', user?.id]);
    queryClient.invalidateQueries(['savedSignatures', user?.id]);
  };

  const setActive = async (sig) => {
    const fields = { active_signature_id: sig.id, ...signaturePayload(sig) };
    if (profile) {
      await base44.entities.ESignatureProfile.update(profile.id, fields);
    } else {
      await base44.entities.ESignatureProfile.create({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        ...fields,
      });
    }
    invalidate();
  };

  const removeSig = async (sig) => {
    if (!window.confirm(`Delete "${sig.name}"?`)) return;
    await base44.entities.SavedESignature.delete(sig.id);
    invalidate();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <PenTool className="w-6 h-6 text-primary" /> E-Signature
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Save as many signatures as you like, then pick which one is active for signing approvals and documents.
          Each signature is verified with your PIN or password and logged with a unique verification ID.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <ESignatureSecurityCard user={user} profile={profile} />

          {/* Saved signatures — pick the active one */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  My signatures — the highlighted one is active
                </p>
                <Button size="sm" variant={editing ? 'outline' : 'default'} onClick={() => setEditing(null)}>
                  <Plus className="w-3.5 h-3.5" /> New signature
                </Button>
              </div>

              {savedSignatures.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No saved signatures yet — create your first one below.
                </p>
              ) : (
                <div className="grid sm:grid-cols-3 gap-3">
                  {savedSignatures.map((sig) => {
                    const isActive = activeId === sig.id;
                    return (
                      <div
                        key={sig.id}
                        className={`rounded-lg border bg-white p-4 flex flex-col items-center gap-2 ${
                          isActive ? 'ring-2 ring-primary border-primary' : 'border-border'
                        }`}
                      >
                        <div className="min-h-[56px] flex items-center justify-center w-full overflow-hidden">
                          <ESignaturePreview signature={sig} />
                        </div>
                        <p className="text-sm font-medium truncate max-w-full" title={sig.name}>{sig.name}</p>
                        {isActive ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </Badge>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setActive(sig)}>
                            Set active
                          </Button>
                        )}
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setEditing(sig); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeSig(sig)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <SignatureEditorCard
            key={editing?.id || 'new'}
            user={user}
            profile={profile}
            editingSig={editing}
            nextIndex={savedSignatures.length + 1}
            onDone={() => setEditing(null)}
          />
        </>
      )}
    </div>
  );
}