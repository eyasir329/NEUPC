import Link from 'next/link';

export default function PublicProfileNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <span className="text-4xl">👤</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Profile Not Found</h1>
        <p className="mx-auto max-w-sm text-sm text-gray-400">
          This member profile does not exist or has not been made public yet.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-2.5 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/20"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
