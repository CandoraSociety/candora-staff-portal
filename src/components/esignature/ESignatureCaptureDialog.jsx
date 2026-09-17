import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ESignaturePreview from './ESignaturePreview';
import { composeSignedImage } from '@/lib/esignatureRender';
import { PenTool, Lock, AlertTriangle } from 'lucide-react';
import { useCurrentUser } from '@/lib/useAuth';

export default function ESignatureCaptureDialog({ open, onOpenChange, documentRef, onSigned }) {
  const { user } = useCurrentUser();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['esignatureProfile', user?.id],
    queryFn: async () => {
      const p = await base44.entities.ESignatureProfile.filter({ user_id: user?.id });
      return p[0] || null;
    },
    enabled: !!user?.id && open,
  });

  useEffect(() => {
    if (open) {
      setCode('');
      setError('');
    }
  }, [open]);

  const handleVerify = async () => {
    if (!code) {
      setError('Enter your PIN or password');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res = await base44.functions.invoke('verifyEsignatureCode', {
        code,
        document_ref: documentRef,
      });
      const log = res.data.log;
      let imageDataUrl = null;
      try {
        imageDataUrl = await composeSignedImage(profile, log);
      } catch {}
      onSigned?.({ log, imageDataUrl });
      onOpenChange(false);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const isPin = profile?.auth_type !== 'password';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-primary" />
            E-Signature Required
          </DialogTitle>
          <DialogDescription>
            Enter your {isPin ? '4-digit PIN' : 'password'} to sign{' '}
            <span className="font-medium text-foreground">{documentRef}</span>. Your signature will be applied
            with a verification ID and timestamp.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !profile ? (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" /> You haven't set up your e-signature yet.
            </p>
            <p className="text-sm text-muted-foreground">
              You need a signature PIN or password before you can sign documents.
            </p>
            <Button asChild size="sm">
              <Link to="/e-signature" onClick={() => onOpenChange(false)}>Set up my e-signature</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-white p-4 min-h-[90px] flex items-center justify-center">
              <ESignaturePreview signature={profile} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="esign-code">{isPin ? 'PIN' : 'Password'}</Label>
              <Input
                id="esign-code"
                type="password"
                inputMode={isPin ? 'numeric' : undefined}
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
                placeholder={isPin ? '••••' : 'Your password'}
                autoComplete="off"
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={verifying}>
                Cancel
              </Button>
              <Button onClick={handleVerify} disabled={verifying || !code}>
                {verifying ? (
                  'Verifying…'
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Verify &amp; Sign
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}