import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2 } from 'lucide-react';
import KioskPairing from '@/components/kiosk/KioskPairing';
import KioskIdle from '@/components/kiosk/KioskIdle';
import KioskPromptView from '@/components/kiosk/KioskPromptView';

const STORAGE_KEY = 'candora_kiosk_station';
const POLL_MS = 3000;

// Customer-facing tablet screen. Standalone: no staff sign-in, no app
// navigation. It shows whatever the reception portal sends it and sends the
// answer straight back.
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

  const forgetTablet = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    shownId.current = null;
    setSession(null);
    setPrompt(null);
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
      if (/no longer connected|not recognised/i.test(message)) forgetTablet();
    }
  }, [session, forgetTablet]);

  useEffect(() => {
    if (!session) return undefined;
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [session, poll]);

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

  if (!session) {
    return <KioskPairing brand={brand} onPaired={(station) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(station));
      setSession(station);
    }} />;
  }

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

  return <KioskIdle brand={brand} stationName={session.name} onChangeTablet={forgetTablet} />;
}