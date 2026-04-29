/**
 * @file Stat / metric card for dashboard overviews.
 * @module ui/StatCard
 */

import { cn } from '@/app/_lib/utils';

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  trendDirection,
  className,
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]',
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-gray-500 uppercase">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl leading-none font-bold tracking-tight text-gray-50">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-gray-500">{unit}</span>
        )}
      </div>
      {trend && (
        <div
          className={cn(
            'mt-1.5 text-[11px] font-medium',
            trendDirection === 'up' && 'text-emerald-400',
            trendDirection === 'down' && 'text-rose-400',
            !trendDirection && 'text-gray-500'
          )}
        >
          {trend}
        </div>
      )}
    </div>
  );
}

export function StatGrid({ cols = 4, className, children }) {
  const colClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-5',
  }[cols] || 'sm:grid-cols-2 lg:grid-cols-4';
  return (
    <div className={cn('grid grid-cols-1 gap-3', colClass, className)}>
      {children}
    </div>
  );
}
