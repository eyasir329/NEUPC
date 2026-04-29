/**
 * @file Standard dashboard page header. Used at the top of every page body.
 * @module ui/PageHeader
 */

import { cn } from '@/app/_lib/utils';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1.5 text-[10.5px] font-semibold tracking-[0.14em] text-gray-500 uppercase">
            {eyebrow}
          </div>
        )}
        <h1 className="truncate text-[22px] leading-tight font-bold tracking-tight text-gray-50 sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-gray-400">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
