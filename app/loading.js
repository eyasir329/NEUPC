export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        {/* Spinner rings */}
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-neon-lime" />
          <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-b-neon-lime/40 [animation-direction:reverse] [animation-duration:1.4s]" />
          <div className="absolute inset-0 m-auto h-2 w-2 animate-pulse rounded-full bg-neon-lime/60" />
        </div>
        {/* Label */}
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-neon-lime/60 animate-pulse">
          Loading...
        </span>
      </div>
    </div>
  );
}
