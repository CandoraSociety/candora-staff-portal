import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2 } from 'lucide-react';
import KioskIdle from '@/components/kiosk/KioskIdle';
import KioskPromptView from '@/components/kiosk/KioskPromptView';
import KioskStillThereOverlay from '@/components/kiosk/KioskStillThereOverlay';

const STORAGE_KEY = 'candora_kiosk_station';
const POLL_MS = 3000;
const RECONNECT_MS = 15000;
const IDLE_MS = 2 * 60 * 1000;
const WARN_SECONDS = 30;
const SUCCESS_MS = 20000;

const SUCCESS_COPY = {
  donation: { title: 'Thank you for your gift!', line: 'Reception will take care of the rest.' },
  purchase: { title: 'Order placed!', line: 'Reception has your order and will have it ready at the counter.' },
  self_registration: { title: 'Thank you!', line: 'Reception has your details.' },
};

// Customer-facing tablet screen. Standalone: no staff sign-in, no app
// navigation, nothing to set up. This tablet lives at the front desk, so it
// opens straight onto the welcome screen and shows whatever the reception
// portal sends it.
export default function CustomerKiosk() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  });
  const [brand, setBrand] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [success, setSuccess] = useState(null);
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARN_SECONDS);
  const shownId = useRef(null);
  const lastActivity = useRef(Date.now());
  const timer = useRef(null);
  const leaving = useRef(false);

  // Find this counter's station on its own. A ?code= in the tablet's home
  // screen shortcut pins it when more than one station exists.
  const connect = useCallback(async () => {
    const urlCode = new URLSearchParams(window.location.search).get('code');
    try {
      const res = await base44.functions.invoke('kioskApi', {
        action: 'station',
        ...(urlCode ? { access_code: urlCode } : {}),
      });
      const station = res.data?.station;
      if (res.data?.brand) setBrand(res.data.brand);
      if (!station) return;
      const next = { id: station.id, name: station.name, code: station.access_code };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
    } catch {
      /* the welcome screen stays up until the tablet is set up */
    }
  }, []);

  const poll = useCallback(async () => {
    if (!session) return;
    try {
      const res = await base44.functions.invoke('kioskApi', {
        action: 'poll',
        station_id: session.id,
        access_code: session.code,
      });
      const data = res.data || {};
      if (data.brand) setBrand(data.brand);
      const incoming = data.prompt || null;
      if (!incoming) {
        shownId.current = null;
        setPrompt(null);
        return;
      }
      if (incoming.id !== shownId.current) {
        shownId.current = incoming.id;
        setSuccess(null);
        setWarning(false);
        lastActivity.current = Date.now();
        setPrompt(incoming);
      }
    } catch (e) {
      const message = e.response?.data?.error || e.message || '';
      if (/no longer connected|not recognised/i.test(message)) {
        localStorage.removeItem(STORAGE_KEY);
        shownId.current = null;
        setPrompt(null);
        setSession(null);
      }
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      connect();
      const retry = setInterval(connect, RECONNECT_MS);
      return () => clearInterval(retry);
    }
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [session, connect, poll]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const send = async (action, response, target = prompt) => {
    if (!target || !session) return;
    await base44.functions.invoke('kioskApi', {
      action,
      station_id: session.id,
      access_code: session.code,
      prompt_id: target.id,
      response,
    });
  };

  const clearSuccessTimer = () => {
    clearTimeout(timer.current);
    timer.current = null;
  };

  const returnHome = () => {
    setPrompt(null);
    setSuccess(null);
    setWarning(false);
  };

  const respond = async (response) => {
    const current = prompt;
    await send('respond', response, current);
    setPrompt(null);
    setWarning(false);
    setSuccess({
      kind: current.kind,
      amount: Number(response.amount) || 0,
      total: Number(response.total) || 0,
    });
    clearSuccessTimer();
    timer.current = setTimeout(() => setSuccess(null), SUCCESS_MS);
  };

  // Backing out or leaving the screen alone both drop the form without a
  // thank-you — the tablet simply goes back to the welcome screen.
  const leave = async () => {
    const current = prompt;
    if (leaving.current) return;
    leaving.current = true;
    returnHome();
    try {
      await send('close', {}, current);
    } catch {
      /* the tablet goes back to the welcome screen either way */
    } finally {
      leaving.current = false;
    }
  };

  // Two minutes without a touch: ask, then count down before giving up.
  useEffect(() => {
    if (!prompt) return undefined;
    lastActivity.current = Date.now();
    setWarning(false);
    const bump = () => {
      lastActivity.current = Date.now();
      setWarning(false);
    };
    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((name) => window.addEventListener(name, bump));
    const check = setInterval(() => {
      if (Date.now() - lastActivity.current >= IDLE_MS) setWarning(true);
    }, 1000);
    return () => {
      events.forEach((name) => window.removeEventListener(name, bump));
      clearInterval(check);
    };
  }, [prompt?.id]);

  useEffect(() => {
    if (!warning) {
      setSecondsLeft(WARN_SECONDS);
      return undefined;
    }
    const deadline = Date.now() + WARN_SECONDS * 1000;
    setSecondsLeft(WARN_SECONDS);
    const tick = setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(tick);
        leave();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [warning]);

  if (prompt) {
    return (
      <>
        <KioskPromptView prompt={prompt} onRespond={respond} onClose={leave} />
        {warning && (
          <KioskStillThereOverlay
            secondsLeft={secondsLeft}
            onStay={() => {
              lastActivity.current = Date.now();
              setWarning(false);
            }}
          />
        )}
      </>
    );
  }

  if (success) {
    const copy = SUCCESS_COPY[success.kind] || { title: 'Thank you!', line: 'Reception has your details.' };
    const amount = success.kind === 'donation' ? success.amount : success.kind === 'purchase' ? success.total : 0;
    return (
      <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center px-8 text-center">
        <div className="h-24 w-24 rounded-full bg-success/15 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>
        <h1 className="mt-8 text-sidebar-foreground font-display font-bold text-4xl">{copy.title}</h1>
        {amount > 0 && <p className="mt-4 text-sidebar-foreground font-bold text-3xl">${amount.toFixed(2)}</p>}
        <p className="mt-3 text-sidebar-foreground/70 text-xl max-w-lg">{copy.line}</p>
      </div>
    );
  }

  return <KioskIdle brand={brand} stationName={session?.name} />;
}