import { useEffect, useState } from 'react';

export default function useTourNarration({ enabled, src, slideKey, audioRef }) {
  const [reading, setReading] = useState(false);
  useEffect(() => {
    setReading(false);
    if (!enabled || !src) return;
    const audio = new Audio(src);
    audioRef.current = audio;
    const playing = () => setReading(true);
    const paused = () => setReading(false);
    audio.addEventListener('playing', playing);
    audio.addEventListener('pause', paused);
    audio.addEventListener('ended', paused);
    audio.addEventListener('error', paused);
    // Autoplay may be blocked; the existing read-aloud control remains available.
    audio.play().catch(paused);
    return () => {
      audio.pause();
      audio.removeEventListener('playing', playing);
      audio.removeEventListener('pause', paused);
      audio.removeEventListener('ended', paused);
      audio.removeEventListener('error', paused);
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, [enabled, src, slideKey, audioRef]);

  const toggleRead = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) audio.pause();
    else {
      if (audio.ended) audio.currentTime = 0;
      audio.play().catch(() => setReading(false));
    }
  };
  return { reading, toggleRead };
}