import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function Celebration({ trigger, onComplete }) {
  useEffect(() => {
    if (!trigger) return;

    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899'],
    });

    const timer = setTimeout(() => {
      onComplete?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, [trigger]);

  return null;
}