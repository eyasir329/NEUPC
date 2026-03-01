/**
 * @file Navbar
 * @module Navbar
 */

'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { Menu, X, ChevronDown, LogOut, UserCircle } from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { signOutAction } from '@/app/_lib/actions';

// ─── Configuration ──────────────────────────────────────────────────────────

/** Navigation structure — direct links, dropdown groups, and CTA button. */
const NAV_CONFIG = {
  links: [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Events' },
    { href: '/achievements', label: 'Achievements' },
  ],
  dropdowns: [
    {
      id: 'archives',
      label: 'Archives',
      items: [
        { href: '/blogs', label: 'Blogs' },
        { href: '/roadmaps', label: 'Roadmaps' },
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
  cta: { href: '/account', label: 'Get Started', style: 'primary' },
};

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Desktop dropdown menu with hover-reveal. */
function DesktopDropdown({ dropdown }) {
  return (
    <li className="group relative">
      <button className="text-primary-100 hover:text-secondary-400 flex items-center gap-1 text-base font-medium transition-colors duration-200">
        {dropdown.label}
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
      </button>
      <ul className="bg-background-dark border-primary-700 shadow-glow invisible absolute top-full left-0 mt-2 min-w-50 translate-y-2 transform rounded-xl border opacity-0 transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        {dropdown.items.map((item, index) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'text-primary-100 hover:bg-primary-800 hover:text-secondary-400 block px-5 py-3 text-sm transition-colors duration-200',
                index === 0 && 'rounded-t-xl',
                index === dropdown.items.length - 1 && 'rounded-b-xl'
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

/** Mobile accordion dropdown. */
function MobileDropdown({ dropdown, isOpen, onToggle, onNavigate }) {
  return (
    <li>
      <button
        onClick={onToggle}
        className="text-primary-100 hover:bg-primary-800 hover:text-secondary-400 flex w-full items-center justify-between rounded-lg px-5 py-3 text-base font-medium transition-colors duration-200"
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
          isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {dropdown.items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className="text-primary-200 hover:text-secondary-400 block px-10 py-2 text-sm transition-colors duration-200"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

// ─── Navbar ─────────────────────────────────────────────────────────────────

/**
 * Navbar — Responsive navigation bar with desktop dropdowns and mobile drawer.
 *
 * @param {Object} session – NextAuth session object (controls auth-aware UI)
 */
export default function Navbar({ session }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = useCallback(
    (id) => setOpenDropdown((prev) => (prev === id ? null : id)),
    []
  );

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, []);

  const isLoggedIn = Boolean(session?.user);

  return (
    <nav className="relative z-50">
      {/* ── Desktop Navigation ────────────────────────────────── */}
      <ul className="hidden items-center gap-6 lg:flex xl:gap-8">
        {NAV_CONFIG.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-primary-100 hover:text-secondary-400 text-base font-medium transition-colors duration-200"
            >
              {link.label}
            </Link>
          </li>
        ))}

        {NAV_CONFIG.dropdowns.map((dropdown) => (
          <DesktopDropdown key={dropdown.id} dropdown={dropdown} />
        ))}

        {isLoggedIn ? (
          <>
            <li>
              <Link
                href="/account"
                className="group flex items-center justify-center"
                title="Go to Account"
              >
                <UserCircle className="border-primary-500/50 hover:border-primary-500 hover:shadow-primary-500/30 text-primary-300 hover:text-primary-100 h-10 w-10 rounded-full transition-all duration-200 hover:scale-105" />
              </Link>
            </li>
            <li>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex items-center justify-center rounded-lg border-2 border-red-500/50 p-2 text-red-300 transition-all duration-200 hover:scale-105 hover:border-red-500 hover:bg-red-500/10"
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
              className={cn(
                'rounded-lg px-5 py-2 text-base font-semibold transition-all duration-200',
                NAV_CONFIG.cta.style === 'primary'
                  ? 'bg-primary-500 hover:bg-primary-600 shadow-soft hover:shadow-glow text-white'
                  : 'border-primary-500/50 text-primary-300 hover:border-primary-500 hover:bg-primary-500/10 border-2'
              )}
            >
              {NAV_CONFIG.cta.label}
            </Link>
          </li>
        )}
      </ul>

      {/* ── Mobile Menu Button ────────────────────────────────── */}
      <button
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        className="text-primary-100 hover:text-secondary-400 transition-colors duration-200 lg:hidden"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <X className="h-7 w-7" />
        ) : (
          <Menu className="h-7 w-7" />
        )}
      </button>

      {/* ── Mobile Navigation ─────────────────────────────────── */}
      <div
        className={cn(
          'bg-background-dark/95 fixed inset-0 top-20 backdrop-blur-md transition-all duration-300 lg:hidden',
          mobileMenuOpen
            ? 'visible opacity-100'
            : 'pointer-events-none invisible opacity-0'
        )}
      >
        <ul className="mx-auto flex max-w-md flex-col gap-1 p-6">
          {NAV_CONFIG.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={closeMobileMenu}
                className="text-primary-100 hover:bg-primary-800 hover:text-secondary-400 block rounded-lg px-5 py-3 text-base font-medium transition-colors duration-200"
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
            />
          ))}

          {isLoggedIn ? (
            <>
              <li className="mt-4">
                <Link
                  href="/account"
                  onClick={closeMobileMenu}
                  className="border-primary-500/50 bg-primary-500/10 text-primary-300 hover:border-primary-500 hover:bg-primary-500/20 block w-full rounded-lg border-2 px-5 py-3 text-center text-base font-semibold transition-all duration-200"
                >
                  My Account
                </Link>
              </li>
              <li className="mt-2">
                <form action={signOutAction}>
                  <button
                    type="submit"
                    onClick={closeMobileMenu}
                    className="block w-full rounded-lg border-2 border-red-500/50 px-5 py-3 text-center text-base font-semibold text-red-300 transition-all duration-200 hover:border-red-500 hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </form>
              </li>
            </>
          ) : (
            <li className="mt-4">
              <Link
                href={NAV_CONFIG.cta.href}
                onClick={closeMobileMenu}
                className={cn(
                  'block rounded-lg px-5 py-3 text-center text-base font-semibold transition-all duration-200',
                  NAV_CONFIG.cta.style === 'primary'
                    ? 'bg-primary-500 hover:bg-primary-600 shadow-soft text-white'
                    : 'border-primary-500/50 text-primary-300 hover:border-primary-500 hover:bg-primary-500/10 border-2'
                )}
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
