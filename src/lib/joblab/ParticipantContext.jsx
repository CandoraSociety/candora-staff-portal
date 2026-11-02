import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { readSession, writeSession, clearSession } from '@/lib/joblab/session';

const ParticipantContext = createContext(null);

export function ParticipantProvider({ children }) {
  const [participant, setParticipant] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = readSession();
    if (session?.participant) {
      setParticipant(session.participant);
      setToken(session.token || null);
    }
    setLoading(false);
  }, []);

  const value = useMemo(() => ({
    participant,
    token,
    loading,
    isGuest: !!participant?.is_guest,
    login: (data) => {
      setParticipant(data.participant);
      setToken(data.token);
      writeSession({ participant: data.participant, token: data.token });
    },
    updateParticipant: (next) => {
      setParticipant(next);
      writeSession({ participant: next, token });
    },
    logout: () => {
      setParticipant(null);
      setToken(null);
      clearSession();
    },
  }), [participant, token, loading]);

  return <ParticipantContext.Provider value={value}>{children}</ParticipantContext.Provider>;
}

export function useParticipant() {
  const context = useContext(ParticipantContext);
  if (!context) throw new Error('useParticipant must be used inside ParticipantProvider');
  return context;
}