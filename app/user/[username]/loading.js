'use client';

export default function PublicProfileLoading() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 pt-6 pb-10 sm:px-6 lg:px-8 xl:px-10 animate-pulse">
      {/* Identity header skeleton */}
      <div className="rounded-2xl border border-white/[0.08] bg-gray-900 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-violet-500/30 via-purple-500/30 to-sky-500/30" />
        <div className="relative h-36 bg-gradient-to-b from-white/[0.03] to-transparent" />
        <div className="px-6 pb-6" style={{ marginTop: '-44px' }}>
          <div className="flex flex-wrap items-end gap-5">
            <div className="h-24 w-24 rounded-full bg-white/[0.06] ring-[6px] ring-gray-900" />
            <div className="flex-1 space-y-3 pb-2">
              <div className="h-7 w-48 rounded-lg bg-white/[0.06]" />
              <div className="h-4 w-64 rounded bg-white/[0.04]" />
              <div className="flex gap-2">
                <div className="h-5 w-20 rounded-full bg-white/[0.04]" />
                <div className="h-5 w-16 rounded-full bg-white/[0.04]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.08] bg-gray-900 p-5 space-y-3">
            <div className="h-3 w-16 rounded bg-white/[0.06]" />
            <div className="h-5 w-28 rounded bg-white/[0.06]" />
            <div className="h-3 w-20 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-gray-900 p-5 h-48" />
          <div className="rounded-2xl border border-white/[0.08] bg-gray-900 p-5 h-64" />
        </div>
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-gray-900 p-5 h-32" />
          <div className="rounded-2xl border border-white/[0.08] bg-gray-900 p-5 h-48" />
        </div>
      </div>
    </div>
  );
}
