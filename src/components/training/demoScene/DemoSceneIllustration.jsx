import { motion, useReducedMotion } from "framer-motion";

// Keep each person inside one finished illustration. Only the entire image
// moves, so anatomy cannot drift apart or acquire independent limb gestures.
export default function DemoSceneIllustration({ src, alt, playing }) {
  const reducedMotion = useReducedMotion();
  const moving = playing && !reducedMotion;
  return (
    <motion.img
      src={src}
      alt={alt}
      draggable={false}
      decoding="async"
      className="block h-full w-full object-contain"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, scale: moving ? [1, 1.015] : 1 }}
      transition={{
        opacity: { duration: 0.35 },
        scale: moving ? { duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" } : { duration: 0.3 },
      }}
    />
  );
}