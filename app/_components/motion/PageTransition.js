'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { pageTransition } from './motion';

const reducedPageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: 'easeIn' } },
};

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const transition = prefersReduced ? reducedPageTransition : pageTransition;

  if (!mounted) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={transition.initial}
        animate={transition.animate}
        exit={transition.exit}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
