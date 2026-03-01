/**
 * @file Account error boundary — reusable error UI shown when a server
 *   or client error occurs within the /account/* segment. Offers retry,
 *   dashboard, and support links.
 * @module AccountError
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  RotateCcw,
  LayoutDashboard,
  HelpCircle,
} from 'lucide-react';

/**
 * Reusable account error boundary component.
 *
 * @param {{
 *   error: Error & { digest?: string },
 *   reset: () => void,
 *   title?: string,
 *   dashboardHref?: string
 * }} props
 *   error         — the caught error object
 *   reset         — Next.js retry callback
 *   title         — optional page context label (e.g. "Events", "Users")
 *   dashboardHref — link for the "Back to Dashboard" button (default: /account)
 */
export default function AccountError({
  error,
  reset,
  title,
  dashboardHref = '/account',
}) {
  useEffect(() => {
    console.error(`[Account Error]${title ? ` (${title})` : ''}:`, error);
  }, [error, title]);

  const heading = title ? `Failed to Load ${title}` : 'Something Went Wrong';

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>

        {/* Heading */}
        <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
          {heading}
        </h2>

        {/* Description */}
        <p className="mb-2 text-sm text-gray-400 sm:text-base">
          An unexpected error occurred while loading this page.
        </p>

        {/* Error detail (collapsed in production) */}
        {error?.message && (
          <div className="mx-auto mb-6 max-w-md rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-left font-mono text-xs leading-relaxed wrap-break-word text-gray-400">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-1 text-left text-[10px] text-gray-500">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-6 py-3 text-sm font-semibold text-blue-300 transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 active:scale-95"
          >
            <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
            Try Again
          </button>

          <Link
            href={dashboardHref}
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-gray-300 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95"
          >
            <LayoutDashboard className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            Back to Dashboard
          </Link>
        </div>

        {/* Support link */}
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <p className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <HelpCircle className="h-4 w-4" />
            Persistent issue?{' '}
            <Link
              href="/contact"
              className="text-blue-400 underline underline-offset-2 transition-colors hover:text-blue-300"
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
