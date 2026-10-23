import { cubicBezier, motion, useTransform } from 'framer-motion';
import { PORTAL_INTRO_LOGO } from '@/lib/training/portalIntroContent';

export default function PortalIntroLogo({ time, first }) {
  const progress = useTransform(time, [2, 5.2], [0, 1], { ease: cubicBezier(0.45, 0, 0.2, 1) });
  const top = useTransform(progress, [0, 1], ['50%', '0%']);
  const y = useTransform(progress, [0, 1], [-100, -28]);
  const scale = useTransform(progress, [0, 1], [1, 0.5]);
  const opacity = useTransform(time, [0, 1.4], [0, 1]);
  return (
    <motion.div
      style={{ x: '-50%', top: first ? top : '0%', y: first ? y : -28, scale: first ? scale : 0.5, opacity: first ? opacity : 1 }}
      className="absolute left-1/2 z-10 h-[200px] w-[200px] pointer-events-none"
    >
      <img src={PORTAL_INTRO_LOGO} alt="Candora's original sunflower logo" className="h-full w-full object-contain" />
    </motion.div>
  );
}