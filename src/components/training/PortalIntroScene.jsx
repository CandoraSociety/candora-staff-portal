import { motion } from 'framer-motion';
import { PORTAL_INTRO_LOGO } from '@/lib/training/portalIntroContent';

export default function PortalIntroScene({ scene, index, total }) {
  return (
    <div className="bg-sidebar text-sidebar-foreground px-5 py-6 sm:px-8 text-center">
      <img
        src={PORTAL_INTRO_LOGO}
        alt="Candora's original sunflower logo"
        className="mx-auto mb-5 h-24 w-24 sm:h-28 sm:w-28 object-contain"
      />
      <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="min-w-0 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-sidebar-primary">{scene.kicker}</p>
        <h4 className="text-xl sm:text-2xl font-bold leading-snug break-words">{scene.title}</h4>
        <p className="text-base sm:text-lg leading-relaxed break-words max-w-2xl mx-auto">{scene.body}</p>
        <p className="pt-2 text-xs text-sidebar-foreground/70">Scene {index + 1} of {total}</p>
      </motion.div>
    </div>
  );
}