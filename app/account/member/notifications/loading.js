'use client';

const SHIMMER = 'animate-pulse rounded-md bg-white/[0.05]';
function Sk({ className = '', style }) {
  return <div className={`${SHIMMER} ${className}`} style={style} aria-hidden="true" />;
}

export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-400 space-y-6 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 lg:px-8 xl:px-10 2xl:px-12"
      role="status"
      aria-label="Loading notifications"
    >
      {/* PageHeader skeleton */}
      <div className="flex items-center gap-4">
        <Sk className="h-10 w-10 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Sk className="h-6 w-32" />
          <Sk className="h-3 w-64" />
        </div>
        <Sk className="h-6 w-20 rounded-full" />
      </div>

      {/* TabBar skeleton */}
      <div className="flex gap-1 rounded-xl border border-white/6 bg-white/2 p-1">
        {[56, 64, 72, 60, 56].map((w, i) => (
          <Sk key={i} className="h-8 rounded-lg" style={{ width: w }} />
        ))}
      </div>

      {/* 2-col grid: list + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Notification rows */}
        <div className="lg:col-span-2 rounded-2xl border border-white/6 bg-white/1 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-start gap-4 p-4 ${i < 6 ? 'border-b border-white/4' : ''}`}
            >
              <Sk className="h-10 w-10 rounded-full shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2 min-w-0">
                <Sk className="h-3.5 w-3/5" />
                <Sk className="h-3 w-4/5" />
              </div>
              <Sk className="h-2.75 w-14 shrink-0 mt-1" />
            </div>
          ))}
        </div>

        {/* Sidebar skeleton */}
        <div className="hidden lg:flex flex-col gap-6">
          <div className="rounded-2xl border border-white/8 bg-white/2 p-6 space-y-4">
            <Sk className="h-4 w-28" />
            <Sk className="h-9 w-full rounded-xl" />
            <Sk className="h-9 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/2 p-6 space-y-4">
            <Sk className="h-4 w-28" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Sk className="h-3 w-16" />
                <Sk className="h-5 w-8 rounded-md" />
              </div>
              <div className="flex justify-between">
                <Sk className="h-3 w-24" />
                <Sk className="h-5 w-8 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <span className="sr-only">Loading notifications, please wait…</span>
    </div>
  );
}
