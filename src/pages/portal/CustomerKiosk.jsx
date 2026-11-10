import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2 } from 'lucide-react';
import KioskIdle from '@/components/kiosk/KioskIdle';
import KioskPairing from '@/components/kiosk/KioskPairing';
import KioskPromptView from '@/components/kiosk/KioskPromptView';
import KioskCheckInWelcome from '@/components/kiosk/KioskCheckInWelcome';
import KioskCheckInView from '@/components/kiosk/KioskCheckInView';
import KioskStillThereOverlay from '@/components/kiosk/KioskStillThereOverlay';
import { roomLabel } from '@/lib/kioskPrograms';

const STORAGE_KEY = 'candora_kiosk_station';
const POLL_MS = 3000;
const RECONNECT_MS = 15000;
const IDLE_MS = 2 * 60 * 1000;
const WARN_SECONDS = 30;
const SUCCESS_MS = 20000;

const SUCCESS_COPY = {
  donation: { title: 'Thank you for your gift!', line: 'Reception will take care of the rest.' },
  purchase: { title: 'Purchase complete!', line: 'Reception has your purchase and will have it ready at the counter.' },
  self_registration: { title: 'Thank you!', line: 'Reception has your details.' },
};

// Customer-facing tablet screen. Standalone: no staff sign-in, no app
// navigation, nothing to set up. This tablet lives at the front desk, so it
// opens straight onto the welcome screen and shows whatever the reception
// portal sends it.
export default function CustomerKiosk() {
  const [session, setSession] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      // ?room= opens one room's classroom tablet, ?program= the front desk, even
      // on a browser that was already paired with a different station.
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      const urlProgram = params.get('program');
      if (urlRoom && stored?.room !== urlRoom) return null;
      if (urlProgram && (stored?.program || 'reception') !== urlProgram) return null;
      return stored;
    } catch {
      return null;
    }
  });
  const [brand, setBrand] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [success, setSuccess] = useState(null);
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARN_SECONDS);
  const [tapped, setTapped] = useState(false);
  const [people, setPeople] = useState([]);
  const [screen, setScreen] = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const shownId = useRef(null);
  const lastActivity = useRef(Date.now());
  const timer = useRef(null);
  const leaving = useRef(false);

  // Find this tablet's station on its own. ?program= narrows it to one portal's
  // tablets and ?code= pins it to one station when that portal has several.
  const connect = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    const urlRoom = params.get('room');
    const urlProgram = params.get('program');
    try {
      const res = await base44.functions.invoke('kioskApi', {
        action: 'station',
        ...(urlCode ? { access_code: urlCode } : {}),
        ...(urlRoom ? { room: urlRoom } : {}),
        ...(urlProgram ? { program: urlProgram } : {}),
      });
      const station = res.data?.station;
      if (res.data?.brand) setBrand(res.data.brand);
      if (!station) return;
      const next = {
        id: station.id,
        name: station.name,
        code: station.access_code,
        program: station.program || 'reception',
        room: station.room || '',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
    } catch {
      /* the pairing screen asks for the code instead */
    }
  }, []);

  const paired = (station, incomingBrand) => {
    if (incomingBrand) setBrand(incomingBrand);
    const next = {
      id: station.id,
      name: station.name,
      code: station.access_code,
      program: station.program || 'reception',
      room: station.room || '',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  };

  const poll = useCallback(async () => {
    if (!session) return;
    try {
      // The tablet's own clock, so the class schedule is read in local time.
      const now = new Date();
      const res = await base44.functions.invoke('kioskApi', {
        action: 'poll',
        station_id: session.id,
        access_code: session.code,
        local_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        local_minutes: now.getHours() * 60 + now.getMinutes(),
      });
      const data = res.data || {};
      if (data.brand) setBrand(data.brand);
      if (data.screen) setScreen(data.screen);
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
        setTapped(false);
        setPeople([]);
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
      program: current.program || 'reception',
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
    // A room's check-in stays open for the next person — backing out only goes
    // back to the welcome screen.
    if (current?.session_id) {
      setWarning(false);
      setTapped(false);
      return;
    }
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

  // A room check-in carries the class it belongs to. Those open with a welcome
  // screen the person touches, then the class list — everyone else's prompts
  // (front desk donations, orders, messages) go straight to their own screen.
  const isClassCheckIn = !!prompt?.session_id;

  const startCheckIn = async () => {
    setTapped(true);
    if (!prompt) return;
    setRosterLoading(true);
    try {
      const res = await base44.functions.invoke('kioskApi', {
        action: 'roster',
        station_id: session.id,
        access_code: session.code,
        prompt_id: prompt.id,
      });
      setPeople(res.data?.people || []);
    } catch {
      setPeople([]);
    } finally {
      setRosterLoading(false);
    }
  };

  const checkIn = async (person) => {
    const current = prompt;
    // The tablet's own clock, so an arrival time is stamped in local time.
    const now = new Date();
    await base44.functions.invoke('kioskApi', {
      action: 'check_in',
      station_id: session.id,
      access_code: session.code,
      prompt_id: current.id,
      person,
      local_time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    });
    const name = person.participant_id
      ? people.find((row) => row.id === person.participant_id)?.name || ''
      : [person.first_name, person.last_name].filter(Boolean).join(' ');
    setTapped(false);
    setWarning(false);
    setPeople([]);
    setSuccess({ checkedIn: name, course: current.course_name });
    clearSuccessTimer();
    timer.current = setTimeout(() => {
      setSuccess(null);
      // The class list is still open for the next person.
      shownId.current = null;
    }, SUCCESS_MS);
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

  const stillThere = warning && (
    <KioskStillThereOverlay
      secondsLeft={secondsLeft}
      onStay={() => {
        lastActivity.current = Date.now();
        setWarning(false);
      }}
    />
  );

  if (prompt && isClassCheckIn && !tapped) {
    return (
      <>
        <KioskCheckInWelcome brand={brand} prompt={prompt} onStart={startCheckIn} />
        {stillThere}
      </>
    );
  }

  if (prompt) {
    return (
      <>
        {isClassCheckIn ? (
          <KioskCheckInView
            prompt={prompt}
            people={people}
            loading={rosterLoading}
            onCheckIn={checkIn}
            onWalkIn={checkIn}
            onClose={() => setTapped(false)}
          />
        ) : (
          <KioskPromptView prompt={prompt} onRespond={respond} onClose={leave} />
        )}
        {stillThere}
      </>
    );
  }

  if (success) {
    const isCheckIn = !!success.checkedIn;
    const isProgramSignIn = !isCheckIn && success.kind === 'self_registration' && success.program !== 'reception';
    const copy = isCheckIn
      ? {
          title: `You're checked in${success.checkedIn ? `, ${success.checkedIn}` : ''}`,
          line: success.course ? `Enjoy ${success.course}.` : 'Your facilitator has you marked as here.',
        }
      : isProgramSignIn
        ? { title: 'Thank you!', line: 'Our registration team has your details — someone will go over them with you.' }
        : SUCCESS_COPY[success.kind] || { title: 'Thank you!', line: 'Reception has your details.' };
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

  if (!session) return <KioskPairing brand={brand} onPaired={paired} />;

  return <KioskIdle brand={brand} roomName={session.room ? roomLabel(session.room) : ''} screen={screen} />;
}