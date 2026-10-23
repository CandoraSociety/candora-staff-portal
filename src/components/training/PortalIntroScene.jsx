import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PORTAL_INTRO_LOGO } from '@/lib/training/portalIntroContent';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const wordUp = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
};

export default function PortalIntroScene({ scene, index, total }) {
  const first = index === 0;
  // Scene 1: the logo fades in big and centered, then shrinks into its spot
  // above the text. Later scenes keep the logo in place.
  const [settled, setSettled] = useState(!first);
  useEffect(() => {
    if (first) {
      setSettled(false);
      const t = setTimeout(() => setSettled(true), 1700);
      return () => clearTimeout(t);
    }
    setSettled(true);
  }, [first]);

  return (
    <div className="portal-intro-bg relative overflow-hidden text-sidebar-foreground px-5 pt-6 pb-6 sm:px-8 text-center">
      <div className="portal-intro-blob portal-intro-blob-gold" aria-hidden="true" />
      <div className="portal-intro-blob portal-intro-blob-blue" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, top: '42%', scale: 1 }}
        animate={{
          opacity: 1,
          scale: settled ? 0.5 : 1,
          top: settled ? '72px' : '42%',
          transition: settled
            ? { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
            : { duration: 0.7, ease: 'easeOut' },
        }}
        style={{ x: '-50%', y: '-50%' }}
        className="absolute left-1/2 z-10 h-[200px] w-[200px] pointer-events-none"
      >
        <img
          src={PORTAL_INTRO_LOGO}
          alt="Candora's original sunflower logo"
          className="portal-intro-logo h-full w-full object-contain"
        />
      </motion.div>

      <motion.div
        key={index}
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.35, delayChildren: first ? 2.2 : 0.15 } } }}
        className="relative min-w-0 pt-[140px]"
      >
        <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-widest text-sidebar-primary">{scene.kicker}</motion.p>
        <motion.h4
          variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
          className="mt-3 text-xl sm:text-2xl font-bold leading-snug break-words"
        >
          {scene.title.split(' ').map((word, i) => (
            <motion.span key={i} variants={wordUp} className="inline-block">{word}{'\u00A0'}</motion.span>
          ))}
        </motion.h4>
        <motion.div
          variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.5 } } }}
          className="mx-auto my-3 h-1 w-24 rounded-full bg-sidebar-primary"
        />
        <motion.p variants={fadeUp} className="text-base sm:text-lg leading-relaxed break-words max-w-2xl mx-auto">{scene.body}</motion.p>
        <motion.p variants={fadeUp} className="pt-2 text-xs text-sidebar-foreground/70">Scene {index + 1} of {total}</motion.p>
      </motion.div>
    </div>
  );
}