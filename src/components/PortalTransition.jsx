import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOGO_URL = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png';

export default function PortalTransition({ isTransitioning, onTransitionComplete }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onTransitionComplete?.();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, onTransitionComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-accent via-accent/95 to-accent-foreground"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <motion.img
              src={LOGO_URL}
              alt="Candora"
              className="h-48 w-48 drop-shadow-2xl"
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: 0,
                ease: "easeInOut"
              }}
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-primary font-display font-bold text-2xl tracking-wide"
            >
              Welcome
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}