import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { playMailChime, primeNotificationSound } from '@/lib/notificationSound';

// How often we ask Outlook for the latest messages while the portal is open.
const POLL_MS = 60000;
const MAX_TOASTS = 3;
const SOUND_KEY = 'newmail_sound_muted';

const NewMailContext = createContext({
  newMessages: [],
  clear: () => {},
  muted: false,
  toggleMuted: () => {},
});

export const useNewMail = () => useContext(NewMailContext);

const storageKey = (userId) => `newmail_last_check_${userId}`;

const receivedAt = (message) => new Date(message.receivedDateTime).getTime();

const senderOf = (message) =>
  message.from?.emailAddress?.name || message.from?.emailAddress?.address || 'Someone';

export function NewMailProvider({ userId, children }) {
  const [newMessages, setNewMessages] = useState([]);
  const [muted, setMuted] = useState(() => localStorage.getItem(SOUND_KEY) === 'true');
  const lastCheckRef = useRef(null);
  const busyRef = useRef(false);
  const mutedRef = useRef(muted);
  const navigate = useNavigate();

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Sound can only start after the person interacts with the page.
  useEffect(() => {
    const prime = () => primeNotificationSound();
    window.addEventListener('pointerdown', prime, { once: true });
    window.addEventListener('keydown', prime, { once: true });
    return () => {
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('keydown', prime);
    };
  }, []);

  const toggleMuted = () => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_KEY, String(next));
      if (!next) playMailChime();
      return next;
    });
  };

  const announce = (messages) => {
    const openInbox = () => navigate('/outlook');

    messages.slice(0, MAX_TOASTS).forEach((message) => {
      toast(`New email from ${senderOf(message)}`, {
        description: message.subject || '(no subject)',
        action: { label: 'Open inbox', onClick: openInbox },
      });
    });

    const remaining = messages.length - MAX_TOASTS;
    if (remaining > 0) {
      toast(`And ${remaining} more new email${remaining > 1 ? 's' : ''}`, {
        description: 'Open Outlook in the portal to read them.',
        action: { label: 'Open inbox', onClick: openInbox },
      });
    }

    if (!mutedRef.current) playMailChime();
  };

  useEffect(() => {
    if (!userId) return undefined;

    lastCheckRef.current = localStorage.getItem(storageKey(userId));
    let cancelled = false;

    const check = async () => {
      if (busyRef.current || document.hidden) return;
      busyRef.current = true;
      try {
        const res = await base44.functions.invoke('msOutlook', { action: 'listEmails', top: 15 });
        const emails = res?.data?.emails || [];
        if (cancelled || emails.length === 0) return;

        const latest = emails.reduce((max, message) => Math.max(max, receivedAt(message)), 0);
        const since = lastCheckRef.current ? new Date(lastCheckRef.current).getTime() : null;

        // First run only sets the watermark, so opening the portal never floods
        // you with alerts about mail that was already waiting.
        const arrived = since === null
          ? []
          : emails.filter((message) => receivedAt(message) > since).sort((a, b) => receivedAt(b) - receivedAt(a));

        const stamp = new Date(latest).toISOString();
        lastCheckRef.current = stamp;
        localStorage.setItem(storageKey(userId), stamp);

        if (arrived.length > 0) {
          setNewMessages((prev) => {
            const seen = new Set(prev.map((message) => message.id));
            return [...arrived.filter((message) => !seen.has(message.id)), ...prev];
          });
          announce(arrived);
        }
      } catch {
        // Outlook isn't available for this person (no connected mailbox) — stay quiet.
      } finally {
        busyRef.current = false;
      }
    };

    check();
    const timer = setInterval(check, POLL_MS);
    const onVisibilityChange = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [userId]);

  return (
    <NewMailContext.Provider
      value={{ newMessages, clear: () => setNewMessages([]), muted, toggleMuted }}
    >
      {children}
    </NewMailContext.Provider>
  );
}