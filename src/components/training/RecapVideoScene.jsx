import { useState } from 'react';
import { motion, useMotionValueEvent, useTransform } from 'framer-motion';
import RecapVideoPoint from '@/components/training/RecapVideoPoint';

const TONES = [
  { text: 'text-sidebar-primary', dot: 'bg-sidebar-primary', active: 'border-sidebar-primary/70 bg-sidebar-primary/10' },
  { text: 'text-cp-baby-blue', dot: 'bg-cp-baby-blue', active: 'border-cp-baby-blue/70 bg-cp-baby-blue/10' },
  { text: 'text-success', dot: 'bg-success', active: 'border-success/70 bg-success/10' },
];
const words = text => text.trim().split(/\s+/).length;

export default function RecapVideoScene({ scene, index, total, time, duration }) {
  const [active, setActive] = useState(-1);
  const tone = TONES[index % TONES.length];
  const scaleX = useTransform(time, seconds => duration ? Math.min(1, seconds / duration) : 0);
  // Point emphasis follows the spoken script, not a free-running timer.
  // All four points remain readable when paused or if audio is unavailable.
  useMotionValueEvent(time, 'change', seconds => {
    if (!duration) return;
    const weights = [words(scene.title), ...scene.points.map(words)];
    const position = seconds / duration * weights.reduce((sum, weight) => sum + weight, 0);
    let boundary = weights[0];
    let point = -1;
    scene.points.forEach((_, i) => { if (position >= boundary) point = i; boundary += weights[i + 1]; });
    setActive(point);
  });
  return (
    <section aria-label={`What we've learned, scene ${index + 1} of ${total}`} className="bg-sidebar text-sidebar-foreground">
      <div className="px-4 pb-4 pt-4 sm:px-5">
        <div className={`mb-2 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-widest ${tone.text}`}>
          <span>What we've learned</span><span className="shrink-0">{index + 1} / {total}</span>
        </div>
        <h4 className="mb-3 text-xl font-bold leading-tight sm:text-2xl">{scene.title}</h4>
        <ul className="space-y-1.5">
          {scene.points.map((text, i) => <RecapVideoPoint key={text} text={text} index={i} active={active === i} tone={tone} />)}
        </ul>
      </div>
      <div className="h-1 overflow-hidden bg-sidebar-border" aria-hidden="true">
        <motion.div className={`h-full origin-left ${tone.dot}`} style={{ scaleX }} />
      </div>
    </section>
  );
}