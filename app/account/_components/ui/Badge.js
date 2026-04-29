/**
 * @file Shared dashboard Badge primitive.
 * @module ui/Badge
 */

import { cva } from 'class-variance-authority';
import { cn } from '@/app/_lib/utils';

const badge = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold tracking-wide',
  {
    variants: {
      variant: {
        neutral: 'bg-white/[0.04] text-gray-300 border-white/[0.08]',
        success:
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        accent: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        mono:
          'bg-white/[0.04] text-gray-400 border-white/[0.08] font-mono uppercase',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
);

export function Badge({ variant, className, children, ...rest }) {
  return (
    <span className={cn(badge({ variant }), className)} {...rest}>
      {children}
    </span>
  );
}
