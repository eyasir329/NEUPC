'use client';

export default function PublicProfileError({ error, reset }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10">
          <span className="text-4xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
        <p className="mx-auto max-w-sm text-sm text-gray-400">
          {error?.message || 'An unexpected error occurred while loading this profile.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-2.5 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/20"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
