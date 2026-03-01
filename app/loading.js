/**
 * @file Global loading page.
 * Minimal animated loading spinner with decorative background.
 *
 * @module LoadingPage
 */

import PageBackground from './_components/ui/PageBackground';

/**
 * Global loading fallback component.
 * Shown by Next.js during route transitions.
 */
export default function Loading() {
  return (
    <main className="relative min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      <div className="flex min-h-screen items-center justify-center px-4">
        <PageBackground />

        <div className="relative flex flex-col items-center gap-6">
          {/* Spinner */}
          <div className="relative h-16 w-16 sm:h-20 sm:w-20">
            <div className="border-primary-500/30 absolute inset-0 animate-spin rounded-full border-4 border-t-transparent" />
            <div className="border-secondary-500/20 absolute inset-2 animate-spin rounded-full border-4 border-b-transparent [animation-direction:reverse] [animation-duration:1.5s]" />
            <div className="bg-primary-500/30 absolute inset-0 m-auto h-3 w-3 animate-pulse rounded-full" />
          </div>

          {/* Label */}
          <p className="from-primary-300 to-secondary-300 animate-pulse bg-linear-to-r bg-clip-text text-sm font-medium tracking-wider text-transparent sm:text-base">
            Loading...
          </p>
        </div>
      </div>
    </main>
  );
}
