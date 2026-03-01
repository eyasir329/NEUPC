/**
 * @file Account loading skeleton — reusable shimmer UI shown during
 *   route transitions within the /account/* segment. Supports multiple
 *   layout variants (dashboard, table, cards, form, profile).
 * @module AccountLoading
 */

'use client';

/**
 * Shimmer skeleton block.
 * @param {{ className: string }} props
 */
function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/5 ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Stats row — mimics a dashboard stats grid.
 * @param {{ count: number }} props
 */
function StatsRow({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6"
        >
          <Skeleton className="mb-3 h-3 w-20" />
          <Skeleton className="mb-2 h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * Table rows skeleton.
 * @param {{ rows: number }} props
 */
function TableRows({ rows = 5 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      {/* Header */}
      <div className="flex gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="hidden h-4 w-24 sm:block" />
        <Skeleton className="hidden h-4 w-20 md:block" />
        <Skeleton className="ml-auto h-4 w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-white/5 px-4 py-3 sm:px-6"
        >
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Card grid skeleton.
 * @param {{ count: number }} props
 */
function CardGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/10 bg-white/5 p-5"
        >
          <Skeleton className="mb-4 h-36 w-full rounded-lg" />
          <Skeleton className="mb-2 h-5 w-3/4" />
          <Skeleton className="mb-3 h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Form skeleton.
 * @param {{ fields: number }} props
 */
function FormSkeleton({ fields = 6 }) {
  return (
    <div className="space-y-5 rounded-xl border border-white/10 bg-white/5 p-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-4">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Profile skeleton.
 */
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Avatar + Name */}
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <FormSkeleton fields={4} />
    </div>
  );
}

/**
 * Layout variants for loading skeletons.
 * @type {Record<string, string>}
 */
const VARIANTS = {
  dashboard: 'dashboard',
  table: 'table',
  cards: 'cards',
  form: 'form',
  profile: 'profile',
};

/**
 * Reusable account loading skeleton.
 *
 * @param {{ variant?: 'dashboard'|'table'|'cards'|'form'|'profile', title?: string }} props
 *   variant — which skeleton layout to display (default: 'dashboard')
 *   title   — optional page title shimmer text
 */
export default function AccountLoading({
  variant = VARIANTS.dashboard,
  title,
}) {
  return (
    <div
      className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8"
      role="status"
      aria-label="Loading"
    >
      {/* Title area */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          {title ? (
            <h1 className="text-xl font-bold text-white/30 sm:text-2xl">
              {title}
            </h1>
          ) : (
            <Skeleton className="h-7 w-48" />
          )}
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Variant content */}
      {variant === VARIANTS.dashboard && (
        <>
          <StatsRow count={4} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TableRows rows={4} />
            <CardGrid count={2} />
          </div>
        </>
      )}
      {variant === VARIANTS.table && <TableRows rows={8} />}
      {variant === VARIANTS.cards && <CardGrid count={6} />}
      {variant === VARIANTS.form && <FormSkeleton fields={6} />}
      {variant === VARIANTS.profile && <ProfileSkeleton />}

      {/* Screen-reader announcement */}
      <span className="sr-only">Loading content, please wait…</span>
    </div>
  );
}
