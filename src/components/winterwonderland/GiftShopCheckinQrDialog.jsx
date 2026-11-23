import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Loader2, Printer, QrCode } from 'lucide-react';
import { findDymoPrinter, printDymoGuardianTag } from '@/lib/dymoPrint';
import { newInviteToken, PUBLIC_APP_ORIGIN } from '@/lib/giftShopInvites';
import { qrImageUrl } from '@/lib/giftShopElf';
import GiftShopGuardianTag from '@/components/winterwonderland/GiftShopGuardianTag';
import printGiftShopLabels from '@/lib/printGiftShopLabels';

// The check-in QR code for this desk computer. The family scans it on their
// phone, types their six-digit code and their name; the arrival lands on this
// computer, which prints the parent or guardian name tag to the DYMO attached
// to it — no computer ever needs to be identified, because DYMO Connect only
// ever talks to the printer on the machine the page is open on.
const TOKEN_KEY = 'kgs_checkin_desk_token';
const checkinLink = (token) => `${PUBLIC_APP_ORIGIN}/functions/giftShopCheckinForm?t=${token}`;

export default function GiftShopCheckinQrDialog({ open, onOpenChange }) {
  const [session, setSession] = useState(null);
  const [dymo, setDymo] = useState(null);
  const [arrival, setArrival] = useState(null);
  const [printState, setPrintState] = useState('idle');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const dymoRef = useRef(null);
  const handledRef = useRef('');
  const handlerRef = useRef(null);
  const tagRef = useRef(null);

  // Opens (or reuses) this computer's desk session, and finds the DYMO printer.
  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    setError('');
    setArrival(null);
    setPrintState('idle');
    setCopied(false);
    setSession(null);
    handledRef.current = '';

    (async () => {
      const target = await findDymoPrinter().catch(() => null);
      if (!alive) return;
      dymoRef.current = target;
      setDymo(target);

      const saved = localStorage.getItem(TOKEN_KEY);
      const found = saved
        ? (await base44.entities.GiftShopDeskSession.filter({ token: saved }).catch(() => []) || [])[0]
        : null;

      let record = found && found.status === 'active' ? found : null;
      if (!record) {
        record = await base44.entities.GiftShopDeskSession.create({
          token: newInviteToken(),
          desk_name: 'Kids Gift Shop check-in',
          printer_name: target?.printer || '',
          status: 'active',
          last_seen_at: new Date().toISOString(),
        });
        localStorage.setItem(TOKEN_KEY, record.token);
      }
      if (alive) setSession(record);
    })().catch((err) => {
      if (alive) setError(`Could not open the check-in desk: ${err.message}`);
    });

    return () => { alive = false; };
  }, [open]);

  // A family has submitted their name at this desk: print their name tag here.
  const handleArrival = async (record) => {
    if (!record?.arrival_at || record.printed_at) return;
    if (record.arrival_at === handledRef.current) return;
    handledRef.current = record.arrival_at;

    const ids = record.arrival_registration_ids || [];
    const rows = ids.length
      ? await base44.entities.ProgramRegistration.filter({ id: { $in: ids } }).catch(() => [])
      : [];
    if (!rows?.length) return;

    const family = {
      guardian_name: record.arrival_guardian_name || '',
      time_slot: rows[0].time_slot || '',
      children: rows,
    };
    setArrival(family);
    setError('');

    if (!dymoRef.current) {
      setPrintState('needs_print');
      return;
    }

    setPrintState('printing');
    try {
      await printDymoGuardianTag(family, dymoRef.current);
      await base44.entities.GiftShopDeskSession.update(record.id, { printed_at: new Date().toISOString() });
      setPrintState('printed');
    } catch (err) {
      setPrintState('error');
      setError(`Could not print the name tag: ${err.message}`);
    }
  };
  handlerRef.current = handleArrival;

  // Live updates from the phone, with a slow safety net in case one is missed.
  useEffect(() => {
    if (!session?.id) return undefined;
    let alive = true;
    handlerRef.current?.(session);

    const unsubscribe = base44.entities.GiftShopDeskSession.subscribe((event) => {
      const data = event?.data;
      if (!alive || data?.id !== session.id) return;
      handlerRef.current?.(data);
    });

    const poll = setInterval(async () => {
      const fresh = await base44.entities.GiftShopDeskSession.get(session.id).catch(() => null);
      if (alive && fresh) handlerRef.current?.(fresh);
    }, 8000);

    return () => {
      alive = false;
      if (typeof unsubscribe === 'function') unsubscribe();
      clearInterval(poll);
    };
  }, [session?.id]);

  const link = session ? checkinLink(session.token) : '';

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Without DYMO Connect the tag still prints, through the browser's print window.
  const printThroughBrowser = async () => {
    setError('');
    setPrintState('printing');
    try {
      await printGiftShopLabels(tagRef.current);
      await base44.entities.GiftShopDeskSession.update(session.id, { printed_at: new Date().toISOString() });
      setPrintState('printed');
    } catch (err) {
      setPrintState('error');
      setError(`Could not print the name tag: ${err.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2 font-display text-lg">
          <QrCode className="h-4 w-4" /> Check-in desk
        </DialogTitle>

        <p className="text-sm text-muted-foreground">
          Families scan this code with their phone camera, type the six-digit code from their confirmation email and
          their own name. Their parent or guardian name tag prints here automatically.
        </p>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        {!session ? (
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Opening the check-in desk…
          </p>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <img
                src={qrImageUrl(link, 400)}
                alt="Scan to check in at the Kids Gift Shop"
                className="h-52 w-52 rounded-lg bg-white p-2"
              />
              <div className="flex w-full items-center gap-2">
                <Input readOnly value={link} aria-label="Check-in link" className="text-xs" />
                <Button size="sm" variant="outline" onClick={copy} className="flex-shrink-0">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {dymo
                ? `Name tags print straight to ${dymo.printer} on this computer.`
                : 'DYMO Connect is not running on this computer, so tags will not print by themselves. Start DYMO Connect, or print the tag with the button below.'}
            </p>

            {arrival ? (
              <div className="space-y-3 rounded-xl border p-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Just checked in</p>
                  <p className="font-display text-lg font-bold leading-tight">{arrival.guardian_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(arrival.children || []).map((child) => child.child_name || child.participant_name).join(', ')}
                  </p>
                </div>

                {printState === 'printing' && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Printing the name tag…
                  </p>
                )}
                {printState === 'printed' && (
                  <p className="flex items-center gap-2 text-sm font-semibold text-success">
                    <Check className="h-4 w-4" /> Name tag printed
                  </p>
                )}
                {printState === 'needs_print' && (
                  <Button size="sm" onClick={printThroughBrowser}>
                    <Printer className="h-3.5 w-3.5" /> Print this name tag
                  </Button>
                )}

                <div ref={tagRef} className="rounded-lg bg-white p-2">
                  <GiftShopGuardianTag family={arrival} />
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                Waiting for the first family to check in.
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}