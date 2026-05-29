/**
 * @file Scroll progress component
 * @module ScrollProgress
 */

'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="bg-neon-lime/70 fixed top-0 right-0 left-0 z-[9998] h-[2px] origin-left"
      style={{ scaleX }}
    />
  );
}
