'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function NotFound() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const popularPages = [
    { name: 'About', href: '/about', icon: '📖' },
    { name: 'Events', href: '/events', icon: '🎉' },
    { name: 'Committee', href: '/committee', icon: '👥' },
    { name: 'Gallery', href: '/gallery', icon: '📸' },
    { name: 'Contact', href: '/contact', icon: '📧' },
    { name: 'Developers', href: '/developers', icon: '💻' },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-b from-gray-900 via-black to-gray-900">
      {/* 404 Content */}
      <div className="flex min-h-screen items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        {/* Animated Decorative Elements */}
        <div className="from-primary-500/10 fixed top-20 right-10 h-72 w-72 animate-pulse rounded-full bg-linear-to-br to-transparent opacity-70 blur-3xl"></div>
        <div
          className="from-secondary-500/10 fixed bottom-20 left-10 h-72 w-72 animate-pulse rounded-full bg-linear-to-br to-transparent opacity-70 blur-3xl"
          style={{ animationDelay: '1s' }}
        ></div>

        <div
          className={`relative w-full max-w-4xl transition-all duration-700 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          {/* 404 Card */}
          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl sm:p-12 md:p-16">
            <div className="relative">
              {/* 404 Number */}
              <div className="mb-6 text-center">
                <div className="from-primary-300 to-secondary-300 mb-4 animate-pulse bg-linear-to-r via-white bg-clip-text text-8xl font-black text-transparent sm:text-9xl md:text-[12rem]">
                  404
                </div>
              </div>

              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="text-5xl sm:text-6xl">🔍</div>
              </div>

              {/* Title */}
              <h1 className="from-primary-300 to-secondary-300 mb-4 bg-linear-to-r via-white bg-clip-text text-center text-3xl font-bold text-transparent sm:text-4xl md:text-5xl">
                Page Not Found
              </h1>

              {/* Description */}
              <p className="mb-6 text-center text-sm text-gray-400 sm:text-base">
                Oops! The page you&apos;re looking for doesn&apos;t exist. It
                might have been moved or deleted.
              </p>

              {/* Search Suggestion Box */}
              <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-2xl">💡</div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">Quick Tip</h3>
                    <p className="text-sm text-gray-400">
                      Try checking the URL for typos, or use the navigation menu
                      to find what you&apos;re looking for.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                {/* Go Home Button */}
                <Link
                  href="/"
                  className="group border-primary-500/50 from-primary-500/40 to-secondary-500/40 hover:shadow-primary-500/50 hover:border-primary-500/70 inline-flex items-center justify-center gap-2 rounded-full border bg-linear-to-r px-6 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 sm:px-8 sm:py-4 sm:text-base"
                >
                  <svg
                    className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span>Go Home</span>
                </Link>

                {/* Go Back Button */}
                <button
                  onClick={() => window.history.back()}
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-white/40 hover:bg-white/10 hover:shadow-lg active:scale-95 sm:px-8 sm:py-4 sm:text-base"
                >
                  <svg
                    className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span>Go Back</span>
                </button>
              </div>

              {/* Popular Links */}
              <div className="text-center">
                <p className="mb-4 text-sm font-semibold text-gray-400">
                  Popular Pages
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                  {popularPages.map((page) => (
                    <Link
                      key={page.href}
                      href={page.href}
                      className="group/link rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:scale-105 hover:border-white/20 hover:bg-white/10"
                    >
                      <div className="mb-2 text-2xl transition-transform group-hover/link:scale-110">
                        {page.icon}
                      </div>
                      <div className="text-sm font-semibold text-gray-400 transition-colors group-hover/link:text-white">
                        {page.name}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Help Section */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-400">
                  Still can&apos;t find what you&apos;re looking for?{' '}
                  <Link
                    href="/contact"
                    className="text-primary-300 hover:text-primary-200 font-semibold transition-colors hover:underline"
                  >
                    Contact our support team
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Error Code Badge */}
          <div className="mt-6 flex justify-center">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
              <p className="text-xs text-gray-400">
                Error Code:{' '}
                <span className="text-primary-300 font-mono">404</span> • Page
                Not Found
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
