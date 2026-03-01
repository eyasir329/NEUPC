/**
 * @file Decorative animated background blobs used across pages.
 * Replaces duplicated decorative divs in error.js, not-found.js, loading.js,
 * ContactClient.js, DevelopersClient.js, CommitteeClient.js, etc.
 *
 * @example
 * <PageBackground />
 * <PageBackground variant="fixed" />
 */

import { cn } from '@/app/_lib/utils';

/** @type {Record<string, string>} Position presets for the two blobs */
const VARIANTS = {
  /** Fixed-position blobs (used in error, 404, loading, contact, developers) */
  fixed: 'fixed',
  /** Absolute-position blobs (used in about, committee, hero sections) */
  absolute: 'absolute',
};

/**
 * Decorative gradient blobs for page backgrounds.
 * Uses static opacity instead of animate-pulse to avoid continuous GPU repaints.
 *
 * @param {{ variant?: 'fixed' | 'absolute', className?: string }} props
 */
export default function PageBackground({ variant = 'fixed', className }) {
  const positioning = VARIANTS[variant] || 'fixed';

  return (
    <>
      <div
        className={cn(
          'from-primary-500/10 h-72 w-72 rounded-full bg-linear-to-br to-transparent opacity-70 blur-3xl',
          positioning === 'fixed'
            ? 'fixed top-20 right-10'
            : 'absolute -top-20 -left-20 h-96 w-96',
          className
        )}
      />
      <div
        className={cn(
          'from-secondary-500/10 h-72 w-72 rounded-full bg-linear-to-br to-transparent opacity-70 blur-3xl',
          positioning === 'fixed'
            ? 'fixed bottom-20 left-10'
            : 'absolute -right-20 -bottom-20 h-96 w-96'
        )}
      />
    </>
  );
}
