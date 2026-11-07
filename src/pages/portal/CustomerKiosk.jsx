import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2 } from 'lucide-react';
import KioskIdle from '@/components/kiosk/KioskIdle';
import KioskPromptView from '@/components/kiosk/KioskPromptView';

const STORAGE_KEY = 'candora_kiosk_station';
const POLL_MS = 3000;
const RECONNECT_MS = 15000;

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
  const [thankYou, setThankYou] = useState(false);
  const shownId = useRef(null);
  const timer = useRef(null);

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
        setThankYou(false);
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

  const send = async (action, response) => {
    if (!prompt) return;
    await base44.functions.invoke('kioskApi', {
      action,
      station_id: session.id,
      access_code: session.code,
      prompt_id: prompt.id,
      response,
    });
  };

  const respond = async (response) => {
    await send('respond', response);
    finish();
  };

  const cancel = async () => {
    await send('close', {});
    finish();
  };

  const finish = () => {
    setPrompt(null);
    setThankYou(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setThankYou(false), 7000);
  };

  if (prompt) {
    return <KioskPromptView prompt={prompt} onRespond={respond} onClose={cancel} />;
  }

  if (thankYou) {
    return (
      <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center px-8 text-center">
        <div className="h-24 w-24 rounded-full bg-success/15 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>
        <h1 className="mt-8 text-sidebar-foreground font-display font-bold text-4xl">Thank you!</h1>
        <p className="mt-3 text-sidebar-foreground/70 text-xl">Reception has your details.</p>
      </div>
    );
  }

  return <KioskIdle brand={brand} stationName={session?.name} />;
}