import { motion, useTransform } from 'framer-motion';
import PortalIntroLogo from '@/components/training/PortalIntroLogo';

export default function PortalIntroScene({ scene, index, total, time }) {
  const delay = useTransform(time, value => `${-value}s`);
  const textStart = index === 0 ? 4.7 : 0.15;
  return (
    <div className="portal-intro-bg relative overflow-hidden text-sidebar-foreground px-5 pt-4 pb-4 sm:px-8 text-center">
      <div className="portal-intro-blob portal-intro-blob-gold" aria-hidden="true" />
      <div className="portal-intro-blob portal-intro-blob-blue" aria-hidden="true" />
      <PortalIntroLogo time={time} first={index === 0} />
      <motion.div key={index} style={{ '--intro-time': delay }} className="relative min-w-0 pt-[140px]">
        <p style={{ '--intro-start': `${textStart}s` }} className="portal-intro-text-reveal text-xs font-semibold uppercase tracking-widest text-sidebar-primary">{scene.kicker}</p>
        <h4 className="mt-3 text-xl sm:text-2xl font-bold leading-snug break-words">
          {scene.title.split(' ').map((word, i) => (
            <span key={i} style={{ '--intro-start': `${textStart + 0.45 + i * 0.06}s` }} className="portal-intro-text-reveal inline-block">{word}{'\u00A0'}</span>
          ))}
        </h4>
        <div style={{ '--intro-start': `${textStart + 0.7}s` }} className="portal-intro-divider-reveal mx-auto my-2 h-1 w-24 rounded-full bg-sidebar-primary" />
        <p style={{ '--intro-start': `${textStart + 1.05}s` }} className="portal-intro-text-reveal text-base sm:text-lg leading-relaxed break-words max-w-2xl mx-auto">{scene.body}</p>
        <p style={{ '--intro-start': `${textStart + 1.4}s` }} className="portal-intro-text-reveal pt-1 text-xs text-sidebar-foreground/70">Scene {index + 1} of {total}</p>
      </motion.div>
    </div>
  );
}