/**
 * @file Compact stat tile (large value over a small uppercase mono label) used
 * in the stat rows of public-page heroes. Extracted from the duplicated copies
 * in blogs / roadmaps / events / gallery / achievements / developers / committee.
 *
 * @module StatTile
 */

import { cn } from '@/app/_lib/utils/utils';

/**
 * StatTile — large value over a small uppercase mono label.
 * `mobileLabel` shows a shorter label below the `sm` breakpoint.
 *
 * @param {{ value: React.ReactNode, label: string, mobileLabel?: string, accent?: boolean }} props
 */
export default function StatTile({
  value,
  label,
  mobileLabel,
  accent = false,
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center sm:items-start sm:text-left">
      <span
        className={cn(
          'font-heading text-2xl font-black tabular-nums sm:text-3xl lg:text-4xl',
          accent ? 'text-neon-lime' : 'text-white'
        )}
      >
        {value}
      </span>
      <span className="font-mono text-[8px] tracking-[0.22em] text-zinc-500 uppercase sm:text-[9px] lg:text-[10px]">
        <span className="sm:hidden">{mobileLabel || label}</span>
        <span className="hidden sm:inline">{label}</span>
      </span>
    </div>
  );
}
