import { motion, useReducedMotion } from "framer-motion";

// Slight "living illustration" motion: the whole finished image slowly zooms
// and drifts, so the figures stay cohesive — no part of a body moves on its own.
export default function DemoSceneIllustration({ src, alt, variant = 0 }) {
  const reducedMotion = useReducedMotion();
  const drift = variant % 3; // give each client a slightly different motion
  const animate = reducedMotion
    ? { scale: 1, x: 0, y: 0 }
    : {
        scale: [1, 1.03, 1],
        x: drift === 1 ? [0, -8, 0] : [0, 6, 0],
        y: drift === 2 ? [0, -6, 0] : [0, 0, 0],
      };
  return (
    <motion.img
      src={src}
      alt={alt}
      draggable={false}
      decoding="async"
      className="block h-full w-full object-contain"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, ...animate }}
      transition={{
        opacity: { duration: 0.4 },
        scale: { duration: 26, repeat: Infinity, ease: "easeInOut" },
        x: { duration: 26, repeat: Infinity, ease: "easeInOut" },
        y: { duration: 26, repeat: Infinity, ease: "easeInOut" },
      }}
    />
  );
}