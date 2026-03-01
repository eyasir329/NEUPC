/**
 * @file Skeleton
 * @module Skeleton
 */

/**
 * Reusable skeleton loading components for professional loading states.
 * Use these throughout the app for consistent shimmer loading patterns.
 */

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/10 ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-2xl bg-white/5 p-6 backdrop-blur-md ${className}`}>
      <Skeleton className="mb-4 h-48 w-full rounded-xl" />
      <Skeleton className="mb-3 h-6 w-3/4" />
      <SkeletonText lines={2} />
      <div className="mt-4 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  return (
    <Skeleton
      className={`rounded-full ${sizeClasses[size] || sizeClasses.md} ${className}`}
    />
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-xl bg-white/5 ${className}`}>
      {/* Header */}
      <div className="flex gap-4 border-b border-white/10 p-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 border-b border-white/5 p-4 last:border-0"
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4, className = '' }) {
  return (
    <div
      className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-${count} ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white/5 p-6 backdrop-blur-md">
          <Skeleton className="mb-3 h-5 w-20" />
          <Skeleton className="mb-2 h-8 w-16" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonEventCard({ className = '' }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md ${className}`}
    >
      <Skeleton className="h-48 w-full" />
      <div className="p-6">
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="mb-2 h-6 w-4/5" />
        <SkeletonText lines={2} />
        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonBlogCard({ className = '' }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md ${className}`}
    >
      <Skeleton className="h-44 w-full" />
      <div className="p-6">
        <Skeleton className="mb-2 h-5 w-20 rounded-full" />
        <Skeleton className="mb-2 h-6 w-5/6" />
        <SkeletonText lines={2} />
        <div className="mt-4 flex items-center gap-3">
          <SkeletonAvatar size="sm" />
          <div>
            <Skeleton className="mb-1 h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonProfile({ className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-6">
        <SkeletonAvatar size="xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard({ className = '' }) {
  return (
    <div className={`space-y-8 ${className}`}>
      <SkeletonStats count={4} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white/5 p-6">
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="mb-1 h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white/5 p-6">
          <Skeleton className="mb-4 h-6 w-40" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
