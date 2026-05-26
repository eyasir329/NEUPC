/**
 * @file Shared error state used by role-based bootcamp pages when a fetch fails.
 * @module BootcampErrorState
 */

export default function BootcampErrorState({
  title = 'Failed to load bootcamps',
  message,
}) {
  return (
    <div className="mx-4 my-6 flex min-h-[400px] items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 sm:mx-6 lg:mx-8">
      <div className="text-center">
        <p className="text-sm font-semibold text-red-400">{title}</p>
        {message ? (
          <p className="mt-2 text-xs text-red-300/80">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
