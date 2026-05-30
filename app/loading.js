/**
 * @file App loading state
 * @module AppLoading
 */

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#05060B]">
      <div className="flex flex-col items-center gap-6">
        {/* Spinner rings */}
        <div className="relative h-12 w-12">
          <div className="border-t-neon-lime absolute inset-0 animate-spin rounded-full border border-transparent" />
          <div className="border-b-neon-violet/50 absolute inset-[5px] animate-spin rounded-full border border-transparent [animation-direction:reverse] [animation-duration:1.6s]" />
          <div className="bg-neon-lime/70 absolute inset-0 m-auto h-1.5 w-1.5 animate-pulse rounded-full" />
        </div>

        {/* Label */}
        <div className="flex items-center gap-2">
          <span className="pulse-dot bg-neon-lime inline-block h-1 w-1 rounded-full" />
          <span className="animate-pulse font-mono text-[9px] font-bold tracking-[0.4em] text-zinc-600 uppercase">
            Loading
          </span>
        </div>
      </div>
    </div>
  );
}
