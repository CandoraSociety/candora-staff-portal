import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { computeAuthHash, generateSalt, validateCode } from '@/lib/esignature';

export default function ESignatureSecurityCard({ user, profile }) {
  const queryClient = useQueryClient();
  const [authType, setAuthType] = useState(profile?.auth_type || 'pin');
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setError('');
    setSaved(false);

    if (profile) {
      const curHash = await computeAuthHash(profile.auth_salt, currentCode);
      if (curHash !== profile.auth_hash) {
        setError('Current PIN/password is incorrect');
        return;
      }
    }

    const invalid = validateCode(authType, newCode);
    if (invalid) { setError(invalid); return; }
    if (newCode !== confirmCode) { setError('Entries do not match'); return; }

    setSaving(true);
    try {
      const salt = generateSalt();
      const hash = await computeAuthHash(salt, newCode);
      if (profile) {
        await base44.entities.ESignatureProfile.update(profile.id, {
          auth_type: authType,
          auth_salt: salt,
          auth_hash: hash,
        });
      } else {
        await base44.entities.ESignatureProfile.create({
          user_id: user.id,
          user_name: user.full_name,
          user_email: user.email,
          auth_type: authType,
          auth_salt: salt,
          auth_hash: hash,
        });
      }
      setCurrentCode('');
      setNewCode('');
      setConfirmCode('');
      setSaved(true);
      queryClient.invalidateQueries(['esignatureProfile', user?.id]);
    } catch (e) {
      setError(e.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isPin = authType === 'pin';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          {profile ? 'Sign-in security' : 'Step 1 — Protect your e-signature'}
        </CardTitle>
        <CardDescription>
          {profile
            ? 'Change the PIN or password required whenever you sign something with your e-signature.'
            : 'Choose a 4-digit PIN or a password. You will be asked for it every time you sign with your e-signature.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Method toggle */}
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => setAuthType('pin')}
            className={cn(
              'rounded-lg border-2 p-3 text-left transition-colors',
              isPin ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
            )}
          >
            <p className="text-sm font-semibold">4-digit PIN</p>
            <p className="text-xs text-muted-foreground">Quick numeric code</p>
          </button>
          <button
            type="button"
            onClick={() => setAuthType('password')}
            className={cn(
              'rounded-lg border-2 p-3 text-left transition-colors',
              !isPin ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
            )}
          >
            <p className="text-sm font-semibold">Password</p>
            <p className="text-xs text-muted-foreground">Longer, stronger protection</p>
          </button>
        </div>

        <div className="space-y-3 max-w-sm">
          {profile && (
            <div className="space-y-1.5">
              <Label htmlFor="esign-current">Current {isPin ? 'PIN' : 'password'}</Label>
              <Input
                id="esign-current"
                type="password"
                value={currentCode}
                onChange={(e) => { setCurrentCode(e.target.value); setError(''); }}
                inputMode={isPin ? 'numeric' : undefined}
                autoComplete="off"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="esign-new">New {isPin ? 'PIN (4 digits)' : 'password'}</Label>
            <Input
              id="esign-new"
              type="password"
              value={newCode}
              onChange={(e) => { setNewCode(e.target.value); setError(''); }}
              inputMode={isPin ? 'numeric' : undefined}
              placeholder={isPin ? '••••' : 'At least 6 characters'}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="esign-confirm">Confirm new {isPin ? 'PIN' : 'password'}</Label>
            <Input
              id="esign-confirm"
              type="password"
              value={confirmCode}
              onChange={(e) => { setConfirmCode(e.target.value); setError(''); }}
              inputMode={isPin ? 'numeric' : undefined}
              autoComplete="off"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && (
          <p className="text-sm text-success flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Saved. Use this {isPin ? 'PIN' : 'password'} whenever you sign.
          </p>
        )}

        <Button onClick={handleSave} disabled={saving || !newCode || !confirmCode}>
          {saving ? 'Saving…' : profile ? 'Update' : 'Save & continue'}
        </Button>
      </CardContent>
    </Card>
  );
}