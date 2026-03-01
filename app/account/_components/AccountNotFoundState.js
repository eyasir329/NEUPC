/**
 * @file Account not-found state — reusable 404 UI for /account/* subroutes.
 *   Shows contextual heading, suggestions, and navigation back to the
 *   relevant dashboard.
 * @module AccountNotFoundState
 */

'use client';

import Link from 'next/link';
import { FileQuestion, LayoutDashboard, ArrowLeft } from 'lucide-react';

/**
 * Quick-link suggestions shown inside the not-found card.
 * @type {{ label: string, href: string }[]}
 */
const DEFAULT_SUGGESTIONS = [
  { label: 'Profile', href: 'profile' },
  { label: 'Settings', href: 'settings' },
  { label: 'Notifications', href: 'notifications' },
];

/**
 * Reusable account not-found component.
 *
 * @param {{
 *   title?: string,
 *   description?: string,
 *   dashboardHref?: string,
 *   suggestions?: { label: string, href: string }[]
 * }} props
 *   title          — heading text (default: "Page Not Found")
 *   description    — explanatory paragraph
 *   dashboardHref  — base path for the "Back to Dashboard" link (default: /account)
 *   suggestions    — optional quick-link array to show as alternatives
 */
export default function AccountNotFoundState({
  title = 'Page Not Found',
  description = "The page you're looking for doesn't exist or has been moved.",
  dashboardHref = '/account',
  suggestions,
}) {
  const links =
    suggestions ??
    DEFAULT_SUGGESTIONS.map((s) => ({
      ...s,
      href: `${dashboardHref}/${s.href}`,
    }));

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/20">
          <FileQuestion className="h-8 w-8 text-amber-400" />
        </div>

        {/* 404 label */}
        <p className="mb-2 text-sm font-semibold tracking-wider text-amber-400 uppercase">
          404
        </p>

        {/* Heading */}
        <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
          {title}
        </h2>

        {/* Description */}
        <p className="mb-8 text-sm text-gray-400 sm:text-base">{description}</p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={dashboardHref}
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-6 py-3 text-sm font-semibold text-blue-300 transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 active:scale-95"
          >
            <LayoutDashboard className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            Back to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-gray-300 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Go Back
          </button>
        </div>

        {/* Quick links / suggestions */}
        {links.length > 0 && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="mb-3 text-xs font-semibold tracking-wider text-gray-300 uppercase">
              Try these pages
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Support link */}
        <p className="mt-6 text-sm text-gray-500">
          Think this is an error?{' '}
          <Link
            href="/contact"
            className="text-blue-400 underline underline-offset-2 transition-colors hover:text-blue-300"
          >
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
