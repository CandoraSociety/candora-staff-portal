import React, { useEffect, useRef, useState } from 'react';
import { Timer, RotateCcw } from 'lucide-react';

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// Optional elapsed-time indicator for practice answers.
export default function GuidePracticeTimer({ dark }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const tick = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    tick.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(tick.current);
  }, [running]);

  const btn = dark
    ? 'border-[#26305a] text-[#eef1ff] hover:bg-[#1b2550]'
    : 'border-[#dadce7] text-[#080c21] hover:bg-[#f0f2f8]';

  return (
    <div className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-sm tabular-nums font-semibold">
        <Timer className="w-4 h-4" /> {clock(seconds)}
      </span>
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        className={`rounded-full border px-3 py-1 text-xs font-medium ${btn}`}
      >
        {running ? 'Pause timer' : 'Start timer'}
      </button>
      <button
        type="button"
        aria-label="Reset timer"
        onClick={() => { setRunning(false); setSeconds(0); }}
        className={`rounded-full border p-1.5 ${btn}`}
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}