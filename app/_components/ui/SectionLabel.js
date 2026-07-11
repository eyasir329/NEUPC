/**
 * @file Left-aligned large section label — an accent rule + mono tag above a
 * kinetic headline that steps up to md:text-5xl. Used to head the full-width
 * feature sections of committee and developers (previously duplicated inline
 * in each). For the smaller list/grid section heads use
 * {@link SectionEyebrow}; for centred heads use {@link SectionHeading}.
 *
 * @module SectionLabel
 */

'use client';

import { motion } from 'framer-motion';
import {
  pageFadeUp as fadeUp,
  pageViewport as viewport,
} from '@/app/_components/motion/motion';

/**
 * @param {{
 *   tag: string,
 *   title: React.ReactNode,
 *   accent?: React.ReactNode,
 *   onMount?: boolean,
 * }} props
 */
export default function SectionLabel({ tag, title, accent, onMount = false }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      {...(onMount
        ? { animate: 'visible' }
        : { whileInView: 'visible', viewport })}
      className="mb-10 sm:mb-14"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="bg-neon-lime h-px w-7" />
        <span className="text-neon-lime font-mono text-[10px] tracking-[0.35em] uppercase sm:text-[11px]">
          {tag}
        </span>
      </div>
      <h2 className="kinetic-headline font-heading text-3xl font-black text-white uppercase sm:text-4xl md:text-5xl">
        {title}
        {accent && (
          <>
            {' '}
            <span className="neon-text">{accent}</span>
          </>
        )}
      </h2>
    </motion.div>
  );
}
