/**
 * @file MotionStagger — Container that staggers its children's animations.
 * Wrap any list or grid of items for a cascading entrance effect.
 * Supports `prefers-reduced-motion` — reduces stagger delay to zero.
 *
 * @module MotionStagger
 */

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, viewportConfig } from './motion';
import { cn } from '@/app/_lib/utils/utils';

/**
 * MotionStagger — Stagger container for child animations.
 *
 * @param {number}  [stagger=0.08]  — Delay between each child
 * @param {number}  [delay=0]       — Initial delay before stagger starts
 * @param {string}  [className]
 * @param {boolean} [inView=true]   — Scroll-triggered vs immediate
 * @param {React.ReactNode} children
 */
export default function MotionStagger({
  children,
  stagger = 0.08,
  delay = 0,
  className,
  inView = true,
  ...rest
}) {
  const prefersReduced = useReducedMotion();

  // When reduced motion is preferred, show all children at once (no stagger)
  const effectiveStagger = prefersReduced ? 0 : stagger;

  const animateProps = inView
    ? {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: viewportConfig,
      }
    : {
        initial: 'hidden',
        animate: 'visible',
      };

  return (
    <motion.div
      variants={staggerContainer(effectiveStagger, delay)}
      {...animateProps}
      className={cn(className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
