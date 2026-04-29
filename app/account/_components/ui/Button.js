/**
 * @file Shared dashboard Button — cva variants, polymorphic via `href`.
 * @module ui/Button
 */

'use client';

import Link from 'next/link';
import { cva } from 'class-variance-authority';
import { cn } from '@/app/_lib/utils';

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
  {
    variants: {
      variant: {
        primary:
          'bg-white text-gray-900 hover:bg-gray-100 shadow-sm focus-visible:ring-white/50',
        secondary:
          'bg-white/[0.06] text-gray-200 border border-white/[0.08] hover:bg-white/[0.10] hover:border-white/[0.14] focus-visible:ring-white/30',
        ghost:
          'text-gray-400 hover:bg-white/[0.06] hover:text-gray-200 focus-visible:ring-white/30',
        outline:
          'border border-white/[0.12] text-gray-200 hover:bg-white/[0.04] hover:border-white/[0.20] focus-visible:ring-white/30',
        danger:
          'bg-rose-500/90 text-white hover:bg-rose-500 shadow-sm shadow-rose-500/20 focus-visible:ring-rose-500/50',
        success:
          'bg-emerald-500/90 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-500/20 focus-visible:ring-emerald-500/50',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-[13px]',
        lg: 'h-10 px-5 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  }
);

export function Button({
  variant,
  size,
  href,
  className,
  children,
  type = 'button',
  ...rest
}) {
  const cls = cn(button({ variant, size }), className);
  if (href) {
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
