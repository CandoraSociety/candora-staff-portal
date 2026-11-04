import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrgSettings } from '@/lib/useOrgSettings';
import {
  RECEPTION_PORTAL_PIN,
  getReceptionPortalSession,
  startReceptionPortalSession,
} from '@/lib/receptionPortalSession';

// The external Reception portal has no staff login — the desk identifies itself
// by name and the shared PIN, so every action can still be traced to a person.
export default function ReceptionPortalGuard() {
  const [session, setSession] = useState(() => getReceptionPortalSession());
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { logoUrl, orgName } = useOrgSettings();

  const handleSignIn = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter your name so the desk knows who was here.');
      return;
    }
    if (pin.trim() !== RECEPTION_PORTAL_PIN) {
      setError('That PIN is not right. Ask the front desk for the Reception PIN.');
      return;
    }
    setError('');
    setSession(startReceptionPortalSession(name));
    // Record the sign-in so the internal portal can show who was at the desk.
    base44.entities.ReceptionDeskSession
      .create({
        operator_name: name.trim(),
        started_at: new Date().toISOString(),
        portal: 'reception_external',
      })
      .catch(() => {});
  };

  if (session) return <Outlet context={{ session }} />;

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-6">
          {logoUrl ? (
            <img src={logoUrl} alt={orgName} className="h-14 w-auto object-contain" />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-display font-bold text-xl">C</span>
            </div>
          )}
          <div className="text-center">
            <h1 className="text-sidebar-foreground font-display font-bold text-xl">Reception</h1>
            <p className="text-sidebar-foreground/60 text-sm">Front Desk — External Portal</p>
          </div>
        </div>

        <form onSubmit={handleSignIn} className="bg-card rounded-2xl shadow-xl p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="desk-name">Your name</Label>
            <Input
              id="desk-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Who is on the desk?"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desk-pin">Reception PIN</Label>
            <Input
              id="desk-pin"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(''); }}
              placeholder="4-digit PIN"
              inputMode="numeric"
              maxLength={4}
              type="password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Start session</Button>
          <p className="text-xs text-muted-foreground text-center">
            Your name is saved with this session so the desk can see who was working.
          </p>
        </form>
      </div>
    </div>
  );
}