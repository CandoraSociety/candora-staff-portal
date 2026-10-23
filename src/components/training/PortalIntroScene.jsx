import { motion } from 'framer-motion';
import { PORTAL_INTRO_LOGO } from '@/lib/training/portalIntroContent';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PortalIntroScene({ scene, index, total }) {
  return (
    <div className="portal-intro-bg relative overflow-hidden text-sidebar-foreground px-5 py-6 sm:px-8 text-center">
      <div className="portal-intro-blob portal-intro-blob-gold" aria-hidden="true" />
      <div className="portal-intro-blob portal-intro-blob-blue" aria-hidden="true" />
      <img
        src={PORTAL_INTRO_LOGO}
        alt="Candora's original sunflower logo"
        className="portal-intro-logo relative mx-auto mb-5 h-24 w-24 sm:h-28 sm:w-28 object-contain"
      />
      <motion.div
        key={index}
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.35, delayChildren: 0.15 } } }}
        className="relative min-w-0 space-y-3"
      >
        <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-widest text-sidebar-primary">{scene.kicker}</motion.p>
        <motion.h4 variants={fadeUp} className="text-xl sm:text-2xl font-bold leading-snug break-words">{scene.title}</motion.h4>
        <motion.p variants={fadeUp} className="text-base sm:text-lg leading-relaxed break-words max-w-2xl mx-auto">{scene.body}</motion.p>
        <p className="pt-2 text-xs text-sidebar-foreground/70">Scene {index + 1} of {total}</p>
      </motion.div>
    </div>
  );
}