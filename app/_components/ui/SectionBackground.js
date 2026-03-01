/**
 * @file Section Background
 * @module SectionBackground
 */

import { cn } from '@/app/_lib/utils';

/**
 * SectionBackground — Decorative background layer with gradient overlays
 * and animated blur orbs. Used as the first child inside each `<section>`.
 *
 * @param {string} [variant='default'] – Color variant: 'default' | 'warm' | 'accent'
 * @param {boolean} [animated=false]   – Enable pulse animation on orbs
 * @param {string} [className]        – Additional wrapper classes
 */
export default function SectionBackground({
  variant = 'default',
  animated = false,
  className,
}) {
  const orbs = {
    default: {
      topLeft: 'from-primary-500/20 to-secondary-500/20 -top-40 -left-40',
      bottomRight:
        'from-secondary-500/20 to-primary-500/20 -right-40 -bottom-40',
      overlay: 'from-primary-500/10 via-secondary-500/10 to-primary-500/10',
    },
    warm: {
      topLeft: 'from-yellow-500/20 to-primary-500/20 -top-40 -left-40',
      bottomRight:
        'from-secondary-500/20 to-yellow-500/20 -right-40 -bottom-40',
      overlay: 'from-primary-500/10 via-secondary-500/10 to-primary-500/10',
    },
    accent: {
      topLeft: 'from-primary-500/30 to-secondary-500/30 -top-40 -left-40',
      bottomRight:
        'from-secondary-500/30 to-primary-500/30 -right-40 -bottom-40',
      overlay: 'from-primary-500/10 via-secondary-500/10 to-primary-500/10',
    },
  };

  const config = orbs[variant] || orbs.default;

  return (
    <div className={cn('pointer-events-none absolute inset-0', className)}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-transparent" />
      <div
        className={cn(
          'absolute inset-0 bg-linear-to-br opacity-30',
          config.overlay
        )}
      />

      {/* Decorative blur orbs */}
      <div
        className={cn(
          'absolute h-96 w-96 rounded-full bg-linear-to-br blur-3xl',
          config.topLeft,
          animated && 'animate-pulse'
        )}
      />
      <div
        className={cn(
          'absolute h-96 w-96 rounded-full bg-linear-to-br blur-3xl',
          config.bottomRight,
          animated && 'animation-delay-2000 animate-pulse'
        )}
      />
    </div>
  );
}
