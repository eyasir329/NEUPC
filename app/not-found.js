/**
 * @file Global 404 not-found page.
 * Shows search tips, popular page links, and navigation options.
 *
 * @module NotFoundPage
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageBackground from './_components/ui/PageBackground';
import { useDelayedLoad } from './_lib/hooks';
import { cn } from './_lib/utils';

/** @type {{ name: string, href: string, icon: string }[]} Popular pages for quick navigation */
const POPULAR_PAGES = [
  { name: 'About', href: '/about', icon: '📖' },
  { name: 'Events', href: '/events', icon: '📅' },
  { name: 'Committee', href: '/committee', icon: '👥' },
  { name: 'Gallery', href: '/gallery', icon: '📸' },
  { name: 'Contact', href: '/contact', icon: '📧' },
  { name: 'Developers', href: '/developers', icon: '💻' },
];

/**
 * Global 404 page component.
 */
export default function NotFound() {
  const router = useRouter();
  const isLoaded = useDelayedLoad();

  return (
    <main className="relative min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      <div className="flex min-h-screen items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <PageBackground />

        <div className={cn('relative w-full max-w-3xl transition-all duration-700', isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0')}>
          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl sm:p-12 md:p-16">
            {/* 404 heading */}
            <div className="from-primary-500 to-secondary-500 mb-4 bg-linear-to-r bg-clip-text text-center text-8xl font-bold text-transparent sm:text-9xl">
              404
            </div>

            <h1 className="from-primary-300 to-secondary-300 mb-4 bg-linear-to-r via-white bg-clip-text text-center text-3xl font-bold text-transparent sm:text-4xl md:text-5xl">
              Page Not Found
            </h1>

            <p className="mb-8 text-center text-sm text-gray-400 sm:text-base">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>

            {/* Search tip */}
            <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4 text-center sm:p-6">
              <p className="text-sm text-gray-300 sm:text-base">
                💡 <span className="font-semibold text-white">Tip:</span> Try checking the URL for typos, or use the navigation menu to find what you&apos;re looking for.
              </p>
            </div>

            {/* Action buttons */}
            <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Link
                href="/"
                className="group from-primary-500/40 to-secondary-500/40 border-primary-500/50 hover:shadow-primary-500/50 hover:border-primary-500/70 relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border bg-linear-to-r px-6 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 sm:px-8 sm:py-4 sm:text-base"
              >
                <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Go Home</span>
              </Link>

              <button
                onClick={() => router.back()}
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-white/40 hover:bg-white/10 hover:shadow-lg active:scale-95 sm:px-8 sm:py-4 sm:text-base"
              >
                <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Go Back</span>
              </button>
            </div>

            {/* Popular pages grid */}
            <div>
              <h2 className="mb-4 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Popular Pages
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {POPULAR_PAGES.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-gray-300 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white sm:p-4 sm:text-base"
                  >
                    <span className="text-lg transition-transform group-hover:scale-110">{page.icon}</span>
                    <span>{page.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Help link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                Still can&apos;t find what you need?{' '}
                <Link href="/contact" className="text-primary-300 hover:text-primary-200 transition-colors hover:underline">
                  Contact us for help
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
