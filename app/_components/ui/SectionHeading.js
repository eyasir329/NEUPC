/**
 * @file Centred section heading — an accent rule + mono tag flanked by rules,
 * above a large kinetic headline and an optional description. Used to head the
 * full-width feature sections of about and achievements. For left-aligned
 * list/grid section heads use {@link SectionEyebrow} instead.
 *
 * @module SectionHeading
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/app/_lib/utils/utils';
import {
  pageFadeUp as fadeUp,
  pageViewport as viewport,
} from '@/app/_components/motion/motion';

/**
 * @param {{
 *   tag: string,
 *   title: React.ReactNode,
 *   accent?: React.ReactNode,
 *   description?: React.ReactNode,
 *   color?: 'lime' | 'violet',
 *   onMount?: boolean,
 * }} props
 */
export default function SectionHeading({
  tag,
  title,
  accent,
  description,
  color = 'lime',
  onMount = false,
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      {...(onMount
        ? { animate: 'visible' }
        : { whileInView: 'visible', viewport })}
      className="mb-12 space-y-4 text-center sm:mb-16 sm:space-y-5"
    >
      <div className="flex items-center justify-center gap-3">
        <span
          className={cn(
            'h-px w-8 sm:w-10',
            color === 'lime' ? 'bg-neon-lime' : 'bg-neon-violet'
          )}
        />
        <span
          className={cn(
            'font-mono text-[10px] font-bold tracking-[0.4em] uppercase sm:text-[11px] sm:tracking-[0.5em]',
            color === 'lime' ? 'text-neon-lime' : 'text-neon-violet'
          )}
        >
          {tag}
        </span>
        <span
          className={cn(
            'h-px w-8 sm:w-10',
            color === 'lime' ? 'bg-neon-lime' : 'bg-neon-violet'
          )}
        />
      </div>
      <h2 className="kinetic-headline font-heading text-4xl font-black text-white uppercase sm:text-5xl md:text-6xl">
        {title}
        {accent && (
          <>
            {' '}
            <span className="neon-text">{accent}</span>
          </>
        )}
      </h2>
      {description && (
        <p className="mx-auto max-w-sm px-4 text-sm leading-relaxed font-light text-zinc-400 sm:max-w-md sm:px-0">
          {description}
        </p>
      )}
    </motion.div>
  );
}
