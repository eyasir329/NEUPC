/**
 * @file Shared dashboard topbar — sticky, role-themed, breadcrumbs + quick actions.
 * Rendered for every role inside AccountLayoutClient.
 *
 * @module DashboardTopbar
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronRight, HelpCircle, Search } from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { buildBreadcrumbs } from './breadcrumbConfig';
import { getRoleTheme } from './roleTheme';

export default function DashboardTopbar({ activeRole, notificationCount = 0 }) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  const theme = getRoleTheme(activeRole);

  const notifHref = activeRole
    ? `/account/${activeRole}/notifications`
    : '/account';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/[0.06] bg-gray-950/80 px-4 backdrop-blur-xl sm:px-6',
        // Reserve space for mobile hamburger (which sits at left:4 / 16px)
        'pl-16 lg:pl-6'
      )}
    >
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-1.5 text-[12.5px]"
      >
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={c.href} className="flex shrink-0 items-center gap-1.5">
              {i > 0 && (
                <ChevronRight
                  className="h-3 w-3 text-gray-600"
                  strokeWidth={2}
                />
              )}
              {isLast ? (
                <span
                  className={cn('truncate font-semibold', theme.accentText)}
                >
                  {c.label}
                </span>
              ) : (
                <Link
                  href={c.href}
                  className="truncate text-gray-500 transition-colors hover:text-gray-300"
                >
                  {c.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Search trigger (hidden on small) */}
      <button
        type="button"
        aria-label="Search"
        className="hidden h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[12.5px] text-gray-500 transition-colors hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-gray-300 md:flex md:w-64 lg:w-72"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-gray-400">
          ⌘K
        </kbd>
      </button>

      {/* Notifications */}
      <Link
        href={notifHref}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-gray-400 transition-colors hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-gray-200"
      >
        <Bell className="h-4 w-4" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm shadow-rose-500/30">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </Link>

      {/* Help */}
      <button
        type="button"
        aria-label="Help"
        className="hidden h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-gray-400 transition-colors hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-gray-200 sm:flex"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
    </header>
  );
}
