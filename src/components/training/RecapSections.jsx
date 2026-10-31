import { useEffect, useState } from 'react';
import { motion, useMotionValueEvent } from 'framer-motion';
import { CheckCircle2, Layers, Sparkles } from 'lucide-react';
import { getRecapSections } from '@/lib/training/recapSections';
import { cn } from '@/lib/utils';

const TONES = {
  gold: 'bg-sidebar-primary/20 text-sidebar-primary',
  blue: 'bg-cp-baby-blue/20 text-cp-baby-blue',
  green: 'bg-success/20 text-success',
};
const FALLBACK_TONES = ['gold', 'blue', 'green'];
const ICONS = [Sparkles, Layers, CheckCircle2];
const HIGHLIGHT_START = 11;

// The recap's key points, grouped into labelled categories. Bullets stagger in
// as the panel opens, then the highlight walks the points in step with the
// narration so the learner's eye follows what is being said.
export default function RecapSections({ recap, moduleKey, time, duration }) {
  const takeaways = recap?.takeaways || [];
  const sections = getRecapSections(moduleKey, recap);
  const [active, setActive] = useState(-1);

  let counter = 0;
  const grouped = sections.map((section, sectionIndex) => ({
    ...section,
    sectionIndex,
    items: section.points
      .filter(index => !!takeaways[index])
      .map(index => ({ text: takeaways[index], gid: counter++ })),
  }));
  const total = counter;
  const sectionOrder = grouped.flatMap(group => group.items.map(() => group.sectionIndex));
  const activeSection = active >= 0 ? sectionOrder[active] : -1;

  useMotionValueEvent(time, 'change', seconds => {
    if (!duration || !total) return;
    const span = Math.max(1.2, (duration - HIGHLIGHT_START) / total);
    setActive(seconds < HIGHLIGHT_START ? -1 : Math.min(total - 1, Math.floor((seconds - HIGHLIGHT_START) / span)));
  });

  // Without narration timing the highlight still walks the points on its own,
  // so the recap reads as a sequence rather than a static list.
  useEffect(() => {
    if (duration || !total) return;
    const timer = setInterval(() => setActive(value => (value + 1) % total), 2600);
    return () => clearInterval(timer);
  }, [duration, total]);

  if (!total) return null;

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest text-sidebar-primary">
        <Sparkles className="h-3 w-3" /> What to hold on to
      </p>
      {grouped.map(group => {
        const Icon = ICONS[group.sectionIndex % ICONS.length];
        const tone = TONES[group.tone || FALLBACK_TONES[group.sectionIndex % FALLBACK_TONES.length]];
        const isCurrent = activeSection === group.sectionIndex;
        return (
          <motion.section
            key={group.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: group.sectionIndex * 0.12, duration: 0.35 }}
            className={cn(
              'rounded-xl border bg-sidebar-accent/40 p-2.5 transition-colors duration-500',
              isCurrent ? 'border-sidebar-primary/70' : 'border-sidebar-border'
            )}
          >
            <header className="mb-1.5 flex items-center gap-1.5">
              <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full', tone)}>
                <Icon className="h-2.5 w-2.5" />
              </span>
              <h5 className="text-[10.5px] font-bold uppercase tracking-wider text-sidebar-primary">{group.label}</h5>
              <span className="ml-auto text-[9px] font-semibold text-sidebar-foreground/40">{group.items.length}</span>
            </header>
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const isActive = item.gid === active;
                return (
                  <motion.li
                    key={item.gid}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + item.gid * 0.1, duration: 0.3 }}
                    className={cn(
                      'flex items-start gap-1.5 rounded-md px-1.5 py-1 text-[11.5px] leading-snug transition-colors duration-500',
                      isActive ? 'bg-sidebar-primary/15 text-sidebar-foreground' : 'text-sidebar-foreground/80'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-500',
                        isActive ? 'scale-150 bg-sidebar-primary' : 'bg-sidebar-foreground/40'
                      )}
                      aria-hidden="true"
                    />
                    <span className={isActive ? 'font-semibold' : undefined}>{item.text}</span>
                  </motion.li>
                );
              })}
            </ul>
          </motion.section>
        );
      })}
    </div>
  );
}