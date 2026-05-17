'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronRight, Search } from 'lucide-react';
import { cn, driveImageUrl, getInitials } from '@/app/_lib/utils';
import { buildBreadcrumbs } from './breadcrumbConfig';
import { getRoleTheme } from './roleTheme';

export default function DashboardTopbar({ activeRole, notificationCount = 0, session }) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  const theme = getRoleTheme(activeRole);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const notifHref = activeRole ? `/account/${activeRole}/notifications` : '/account';
  const avatarSrc = driveImageUrl(session?.avatar_url || session?.image || '');
  const hasAvatar = avatarSrc && !/^[A-Z?]{1,3}$/.test(avatarSrc);
  const initials = getInitials(session?.name || 'U');

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-2 border-b backdrop-blur-xl transition-[box-shadow,border-color,background] duration-200',
        scrolled
          ? 'border-[#1E293B] bg-[#0B1121]/95 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.5)]'
          : 'border-[#1E293B] bg-[#0B1121]/80',
        'pl-14 pr-3 sm:pl-16 sm:pr-4 lg:pl-6 lg:pr-6 xl:pl-8 xl:pr-8 2xl:pl-10 2xl:pr-10',
        'sm:gap-3'
      )}
    >
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[12.5px]">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          const hideOnMobile = !isLast && i < crumbs.length - 2;
          return (
            <span
              key={c.href}
              className={cn('flex shrink-0 items-center gap-1.5', hideOnMobile && 'hidden sm:flex')}
            >
              {i > 0 && <ChevronRight className="h-3 w-3 text-slate-600" strokeWidth={2} />}
              {isLast ? (
                <span className={cn('truncate font-semibold', theme.accentText)}>{c.label}</span>
              ) : (
                <Link href={c.href} className="truncate text-slate-500 transition-colors hover:text-slate-300">
                  {c.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Search — icon only on mobile, full pill on md+ */}
      <button
        type="button"
        aria-label="Search"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1E293B] bg-[#131B2C] text-slate-400 transition-colors hover:border-[#334155] hover:bg-[#1A233A] hover:text-slate-200 md:hidden"
      >
        <Search className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Search"
        className="hidden h-9 items-center gap-2 rounded-full border border-[#1E293B] bg-[#131B2C] px-3 text-[12.5px] text-slate-500 transition-colors hover:border-[#334155] hover:bg-[#1A233A] hover:text-slate-300 md:flex md:w-52 lg:w-64 xl:w-80"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left truncate">Search events, resources…</span>
        <kbd className="shrink-0 rounded-full border border-[#1E293B] bg-[#0B1121] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">⌘K</kbd>
      </button>

      {/* Notifications */}
      <Link
        href={notifHref}
        aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} unread` : 'Notifications'}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#1E293B] bg-[#131B2C] text-slate-400 transition-colors hover:border-[#334155] hover:bg-[#1A233A] hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-white/40 outline-none"
      >
        <Bell className="h-4 w-4" />
        {notificationCount > 0 && (
          <span
            aria-live="polite"
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm shadow-rose-500/30"
          >
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </Link>

      {/* User avatar pill */}
      <Link
        href={activeRole ? `/account/${activeRole}/profile` : '/account'}
        className="flex items-center gap-3 bg-[#131B2C] border border-[#1E293B] pl-3 pr-1.5 py-1.5 rounded-full ml-1 hover:border-[#334155] transition-colors"
      >
        <div className="text-right hidden sm:block">
          <p className={cn('text-[9px] font-bold uppercase tracking-widest leading-none mb-1', theme.accentText)}>
            Member
          </p>
          <p className="text-xs font-bold text-slate-100 leading-none truncate max-w-25">
            {session?.name || 'User'}
          </p>
        </div>
        <div className={cn('w-7 h-7 rounded-full border border-white/10 overflow-hidden shrink-0 flex items-center justify-center text-[11px] font-bold text-white bg-linear-to-br', theme.gradient)}>
          {hasAvatar ? (
            <img src={avatarSrc} alt={session?.name || 'User'} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
      </Link>
    </header>
  );
}
