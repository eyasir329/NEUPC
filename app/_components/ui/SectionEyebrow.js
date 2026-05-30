/**
 * @file Left-aligned section eyebrow — a short accent rule + mono tag above a
 * kinetic headline, with an optional right-aligned meta line. Used to head the
 * content sections of list/grid pages (blogs, roadmaps, contact). For centred,
 * full-width feature-section headings use {@link SectionHeading} instead.
 *
 * @module SectionEyebrow
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/app/_lib/utils/utils';
import {
  pageFadeUp as fadeUp,
  pageStagger as stagger,
  pageViewport as viewport,
} from '@/app/_components/motion/motion';

/**
 * @param {{
 *   tag: string,
 *   title: React.ReactNode,
 *   accent?: React.ReactNode,
 *   right?: React.ReactNode,
 *   onMount?: boolean,
 * }} props
 */
export default function SectionEyebrow({
  tag,
  title,
  accent,
  right,
  onMount = false,
}) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      {...(onMount
        ? { animate: 'visible' }
        : { whileInView: 'visible', viewport })}
      className={cn(
        'mb-8 flex flex-col gap-1 sm:mb-10',
        right && 'sm:flex-row sm:items-end sm:justify-between'
      )}
    >
      <div>
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <span className="bg-neon-lime h-px w-7" />
          <span className="text-neon-lime font-mono text-[10px] tracking-[0.35em] uppercase sm:text-[11px]">
            {tag}
          </span>
        </motion.div>
        <motion.h2
          variants={fadeUp}
          className="kinetic-headline font-heading mt-2 text-3xl font-black text-white uppercase sm:text-4xl"
        >
          {title}
          {accent && (
            <>
              {' '}
              <span className="neon-text">{accent}</span>
            </>
          )}
        </motion.h2>
      </div>
      {right && (
        <motion.p
          variants={fadeUp}
          className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase sm:text-[11px]"
        >
          {right}
        </motion.p>
      )}
    </motion.div>
  );
}
