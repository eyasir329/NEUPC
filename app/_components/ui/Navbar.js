/**
 * @file Navbar
 * @module Navbar
 */

'use client';

import Link from 'next/link';
import {
  useState,
  useCallback,
  useEffect,
  useRef,
  startTransition,
} from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, LogOut, UserCircle, Moon, Sun } from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { signOutAction } from '@/app/_lib/actions';

const NAV_CONFIG = {
  links: [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Events' },
    { href: '/achievements', label: 'Achievements' },
  ],
  dropdowns: [
    {
      id: 'archives',
      label: 'Library',
      items: [
        { href: '/blogs', label: 'Blogs' },
        { href: '/roadmaps', label: 'Roadmaps' },
        { href: '/resources', label: 'Resources' },
      ],
    },
    {
      id: 'clubinfo',
      label: 'Club Info',
      items: [
        { href: '/about', label: 'About' },
        { href: '/committee', label: 'Committee' },
        { href: '/gallery', label: 'Gallery' },
      ],
    },
    {
      id: 'connect',
      label: 'Connect',
      items: [
        { href: '/contact', label: 'Contact' },
        { href: '/developers', label: 'Developers' },
      ],
    },
  ],
  cta: { href: '/account', label: 'Get Started' },
};

const THEME_KEY = 'neupc-theme';

function isNavActive(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

function isDropdownActive(pathname, dropdown) {
  return dropdown.items.some((item) => isNavActive(pathname, item.href));
}

function DesktopDropdown({ dropdown, isOpen, onToggle, pathname }) {
  const ref = useRef(null);
  const active = isDropdownActive(pathname, dropdown);
  const isArchives = dropdown.id === 'archives';
  const activeColor = isArchives
    ? 'text-neon-lime dark:text-neon-lime text-emerald-600'
    : 'text-neon-violet';
  const hoverItem = isArchives
    ? 'hover:text-emerald-600 dark:hover:text-neon-lime'
    : 'hover:text-violet-600 dark:hover:text-neon-violet';
  const activeItem = isArchives
    ? 'text-emerald-600 dark:text-neon-lime'
    : 'text-violet-600 dark:text-neon-violet';

  return (
    <li ref={ref} className="group relative py-2">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1.5 font-heading text-[11px] font-bold uppercase tracking-widest transition-colors duration-200',
          active
            ? activeColor
            : 'text-slate-500 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {dropdown.label}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            isOpen ? 'rotate-180' : 'group-hover:rotate-180'
          )}
        />
      </button>
      <ul
        className={cn(
          'absolute top-full left-0 z-50 mt-2 min-w-[12rem] space-y-1 rounded-xl border p-3 shadow-2xl backdrop-blur-xl transition-all duration-200',
          'bg-white/95 dark:bg-[#0c0e16]',
          isArchives
            ? 'border-emerald-100 dark:border-neon-lime/20'
            : 'border-violet-100 dark:border-neon-violet/20',
          isOpen
            ? 'visible translate-y-0 opacity-100'
            : 'invisible translate-y-2 opacity-0 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100'
        )}
        role="menu"
      >
        {dropdown.items.map((item) => (
          <li key={item.href} role="none">
            <Link
              href={item.href}
              role="menuitem"
              className={cn(
                'block rounded-lg px-3 py-1.5 font-mono text-[11px] transition-colors duration-200',
                isNavActive(pathname, item.href)
                  ? activeItem
                  : cn('text-slate-500 dark:text-zinc-400', hoverItem)
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

function MobileDropdown({ dropdown, isOpen, onToggle, onNavigate, pathname }) {
  const active = isDropdownActive(pathname, dropdown);
  const isArchives = dropdown.id === 'archives';
  const activeColor = isArchives
    ? 'bg-emerald-50 text-emerald-700 dark:bg-white/5 dark:text-neon-lime'
    : 'bg-violet-50 text-violet-700 dark:bg-white/5 dark:text-neon-violet';
  const inactiveColor =
    'text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white';
  const activeItemColor = isArchives
    ? 'text-emerald-700 dark:text-neon-lime'
    : 'text-violet-700 dark:text-neon-violet';

  return (
    <li>
      <button
        onClick={onToggle}
        className={cn(
          'flex w-full touch-manipulation items-center justify-between rounded-lg px-5 py-3.5 text-base font-medium transition-colors duration-200',
          active ? activeColor : inactiveColor
        )}
        aria-expanded={isOpen}
      >
        {dropdown.label}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <ul
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {dropdown.items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'block px-10 py-2.5 text-sm transition-colors duration-200',
                isNavActive(pathname, item.href)
                  ? activeItemColor
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default function Navbar({ session }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [theme, setTheme] = useState('dark');
  const pathname = usePathname();
  const navRef = useRef(null);

  // Initialize theme from storage/DOM
  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const initial = stored === 'light' || stored === 'dark'
      ? stored
      : document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(initial);
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleDropdown = useCallback(
    (id) => setOpenDropdown((prev) => (prev === id ? null : id)),
    []
  );

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, []);

  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      startTransition(() => {
        setMobileMenuOpen(false);
        setOpenDropdown(null);
      });
    }
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { closeMobileMenu(); setOpenDropdown(null); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeMobileMenu]);

  useEffect(() => {
    if (openDropdown === null) return;
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenDropdown(null);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [openDropdown]);

  const isLoggedIn = Boolean(session?.user);

  return (
    <nav ref={navRef} className="relative z-50">
      {/* ── Desktop ────────────────────────────────────────────── */}
      <ul className="hidden items-center gap-8 lg:flex xl:gap-12">
        {NAV_CONFIG.links.map((link) => {
          const active = isNavActive(pathname, link.href);
          return (
            <li key={link.href} className="relative">
              <Link
                href={link.href}
                className={cn(
                  'font-heading whitespace-nowrap text-[11px] font-bold uppercase tracking-widest transition-colors duration-200',
                  active
                    ? 'text-emerald-600 dark:text-neon-lime'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white'
                )}
              >
                {link.label}
              </Link>
              {active && (
                <span
                  aria-hidden
                  className="pulse-dot absolute -top-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-neon-lime"
                />
              )}
            </li>
          );
        })}

        {NAV_CONFIG.dropdowns.map((dropdown) => (
          <DesktopDropdown
            key={dropdown.id}
            dropdown={dropdown}
            isOpen={openDropdown === dropdown.id}
            onToggle={() => toggleDropdown(dropdown.id)}
            pathname={pathname}
          />
        ))}

        {/* Theme toggle */}
        <li>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all hover:border-slate-400 hover:text-slate-900 dark:border-white/15 dark:text-zinc-400 dark:hover:border-neon-lime/60 dark:hover:text-neon-lime"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </li>

        {isLoggedIn ? (
          <>
            <li>
              <Link href="/account" title="Go to Account">
                <UserCircle className="h-10 w-10 rounded-full text-slate-400 transition-all hover:scale-105 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white" />
              </Link>
            </li>
            <li>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-400 transition-all hover:scale-105 hover:border-red-400 hover:bg-red-50 dark:border-red-500/50 dark:text-red-400 dark:hover:border-red-500 dark:hover:bg-red-500/10"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </form>
            </li>
          </>
        ) : (
          <li>
            <Link
              href={NAV_CONFIG.cta.href}
              className="font-heading whitespace-nowrap rounded-full bg-neon-lime px-7 py-2.5 text-[11px] font-bold uppercase tracking-widest text-black shadow-lg transition-all hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black"
            >
              {NAV_CONFIG.cta.label}
            </Link>
          </li>
        )}
      </ul>

      {/* ── Mobile header controls ──────────────────────────────── */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={toggleTheme}
          className="touch-manipulation rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:text-slate-900 dark:border-white/20 dark:text-zinc-400 dark:hover:text-neon-lime"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="touch-manipulation p-1 text-slate-600 transition-colors hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {/* ── Mobile backdrop ─────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ───────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-x-0 top-[69px] bottom-0 z-50 bg-white/95 backdrop-blur-md transition-all duration-300 dark:bg-[#05060b]/98 lg:hidden',
          mobileMenuOpen
            ? 'visible opacity-100'
            : 'pointer-events-none invisible opacity-0'
        )}
      >
        <ul className="pb-safe mx-auto flex h-full max-w-md flex-col gap-0.5 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {NAV_CONFIG.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={closeMobileMenu}
                className={cn(
                  'block touch-manipulation rounded-lg px-5 py-3.5 text-base font-medium transition-colors duration-200',
                  isNavActive(pathname, link.href)
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-white/5 dark:text-neon-lime'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white'
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}

          {NAV_CONFIG.dropdowns.map((dropdown) => (
            <MobileDropdown
              key={dropdown.id}
              dropdown={dropdown}
              isOpen={openDropdown === dropdown.id}
              onToggle={() => toggleDropdown(dropdown.id)}
              onNavigate={closeMobileMenu}
              pathname={pathname}
            />
          ))}

          <li className="my-3 border-t border-slate-100 dark:border-white/10" />

          {isLoggedIn ? (
            <>
              <li>
                <Link
                  href="/account"
                  onClick={closeMobileMenu}
                  className="block w-full touch-manipulation rounded-lg border border-slate-200 bg-slate-50 px-5 py-3.5 text-center text-base font-semibold text-slate-700 transition-all hover:border-slate-400 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-neon-lime/40 dark:hover:text-neon-lime"
                >
                  My Account
                </Link>
              </li>
              <li className="mt-2">
                <form action={signOutAction}>
                  <button
                    type="submit"
                    onClick={closeMobileMenu}
                    className="block w-full touch-manipulation rounded-lg border border-red-200 px-5 py-3.5 text-center text-base font-semibold text-red-500 transition-all hover:bg-red-50 dark:border-red-500/50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </form>
              </li>
            </>
          ) : (
            <li>
              <Link
                href={NAV_CONFIG.cta.href}
                onClick={closeMobileMenu}
                className="block touch-manipulation rounded-lg bg-neon-lime px-5 py-3.5 text-center text-base font-bold text-black transition-all hover:brightness-110"
              >
                {NAV_CONFIG.cta.label}
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
