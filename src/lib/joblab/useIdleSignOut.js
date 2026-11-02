import { useCallback, useEffect, useRef, useState } from 'react';

// Signs a kiosk visitor out after a stretch of inactivity. A short warning
// appears first so nobody loses work — any activity during it keeps them in.
export default function useIdleSignOut({
  onExpire,
  idleMs = 8 * 60 * 1000,
  warningSeconds = 60,
  enabled = true,
}) {
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(warningSeconds);
  const timers = useRef({ idle: null, tick: null });
  const warningRef = useRef(false);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  const stopTimers = () => {
    clearTimeout(timers.current.idle);
    clearInterval(timers.current.tick);
    timers.current = { idle: null, tick: null };
  };

  const arm = useCallback(() => {
    stopTimers();
    if (!enabled) return;
    timers.current.idle = setTimeout(() => {
      warningRef.current = true;
      setWarning(true);
      setSecondsLeft(warningSeconds);
      timers.current.tick = setInterval(() => {
        setSecondsLeft((left) => {
          if (left <= 1) {
            clearInterval(timers.current.tick);
            warningRef.current = false;
            setWarning(false);
            expireRef.current?.();
            return 0;
          }
          return left - 1;
        });
      }, 1000);
    }, idleMs);
  }, [enabled, idleMs, warningSeconds]);

  useEffect(() => {
    if (!enabled) return undefined;
    const onActivity = () => {
      if (!warningRef.current) arm();
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    arm();
    return () => {
      events.forEach((event) => window.removeEventListener(event, onActivity));
      stopTimers();
    };
  }, [arm, enabled]);

  const stayActive = () => {
    warningRef.current = false;
    setWarning(false);
    setSecondsLeft(warningSeconds);
    arm();
  };

  return { warning, secondsLeft, stayActive };
}