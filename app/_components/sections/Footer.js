/**
 * @file Footer component
 * @module Footer
 */

import Link from 'next/link';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';

const defaultSocial = {
  facebook: '',
  github: '',
  linkedin: '',
  youtube: '',
  twitter: '',
};

const defaultContact = {
  email: '',
  phone: '',
  address: '',
  officeHours: '',
};

const defaultDescription =
  'A technical sanctum dedicated to the advancement of competitive programming and systems engineering at Netrokona University.';

// Inline SVG brand icons — no extra dependency needed
const BRAND_ICONS = {
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path
        d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="black" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path
        d="M4 4l16 16M4 20L20 4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M3 5h4l10 14h4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
};

const SOCIAL_HOVER = {
  facebook: 'hover:text-blue-400',
  github: 'hover:text-neon-lime',
  linkedin: 'hover:text-sky-400',
  youtube: 'hover:text-red-400',
  twitter: 'hover:text-zinc-200',
};

const DEFAULT_NAV_LINKS = [
  { href: '/about', label: 'About Us' },
  { href: '/events', label: 'Events' },
  { href: '/achievements', label: 'Achievements' },
  { href: '/committee', label: 'Committee' },
];

const DEFAULT_RESOURCE_LINKS = [
  { href: '/blogs', label: 'Blog' },
  { href: '/roadmaps', label: 'Roadmaps' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer({
  session,
  social = {},
  contact = {},
  footer = {},
  settings = {},
}) {
  const currentYear = new Date().getFullYear();
  const isLoggedIn = !!session?.user;

  const socialLinks = { ...defaultSocial, ...social };
  const contactInfo = { ...defaultContact, ...contact };
  if (contact?.office_hours && !contact?.officeHours) {
    contactInfo.officeHours = contact.office_hours;
  }
  const footerDescription = footer.description || defaultDescription;

  const activeSocials = Object.entries(socialLinks).filter(([, url]) => url);

  const navLinks =
    settings?.site_navigation?.footerExplore || DEFAULT_NAV_LINKS;
  const resourceLinks = [
    ...(settings?.site_navigation?.footerResources || DEFAULT_RESOURCE_LINKS),
    ...(!isLoggedIn ? [{ href: '/join', label: 'Join Us' }] : []),
  ];

  return (
    <footer className="relative pt-16 pb-10 sm:pt-20 sm:pb-12 lg:pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top divider */}
        <div className="via-neon-lime/15 mb-12 h-px w-full bg-linear-to-r from-transparent to-transparent sm:mb-16 lg:mb-20" />

        {/* Main grid — stacks on mobile, 2-col on md, 4-col on lg */}
        <div className="mb-12 grid grid-cols-2 gap-x-8 gap-y-10 sm:mb-16 sm:gap-x-10 md:grid-cols-4 lg:mb-20 lg:gap-x-16">
          {/* Brand — full width on mobile, spans 2 cols on md+ */}
          <div className="col-span-2 space-y-5 md:col-span-4 lg:col-span-1">
            <div className="font-heading text-2xl font-black tracking-tighter text-white italic sm:text-3xl">
              {settings?.site_name || 'NEUPC'}
            </div>
            <p className="max-w-xs text-sm leading-relaxed font-light text-zinc-500 italic">
              {footerDescription}
            </p>
            {/* Social icons */}
            <div className="flex flex-wrap gap-3 pt-1">
              {activeSocials.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platform}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 text-zinc-500 transition-all hover:scale-110 hover:border-white/20 ${SOCIAL_HOVER[platform] ?? 'hover:text-neon-lime'}`}
                >
                  {BRAND_ICONS[platform] ?? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 space-y-4 sm:space-y-5">
            <p className="font-heading text-[10px] font-bold tracking-widest text-white uppercase sm:text-[11px]">
              {settings?.footer_explore_heading || 'Explore'}
            </p>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-neon-lime inline-block font-mono text-[10px] tracking-wider text-zinc-500 uppercase transition-all hover:translate-x-1 sm:text-[11px]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1 space-y-4 sm:space-y-5">
            <p className="font-heading text-[10px] font-bold tracking-widest text-white uppercase sm:text-[11px]">
              {settings?.footer_resources_heading || 'Resources'}
            </p>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-neon-lime inline-block font-mono text-[10px] tracking-wider text-zinc-500 uppercase transition-all hover:translate-x-1 sm:text-[11px]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — full width on mobile so address/email aren't squeezed */}
          <div className="col-span-2 space-y-4 sm:space-y-5 md:col-span-2 lg:col-span-1">
            <p className="font-heading text-[10px] font-bold tracking-widest text-white uppercase sm:text-[11px]">
              Contact
            </p>
            <ul className="space-y-3">
              {contactInfo.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="text-neon-lime mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs leading-relaxed font-light text-zinc-500 italic">
                    {contactInfo.address.split('\n').join(', ')}
                  </span>
                </li>
              )}
              {contactInfo.email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="text-neon-lime h-3.5 w-3.5 shrink-0" />
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="hover:text-neon-lime text-xs font-light text-zinc-500 italic transition-colors"
                  >
                    {contactInfo.email}
                  </a>
                </li>
              )}
              {contactInfo.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="text-neon-lime h-3.5 w-3.5 shrink-0" />
                  <a
                    href={`tel:${contactInfo.phone.replace(/[^+\d]/g, '')}`}
                    className="hover:text-neon-lime text-xs font-light text-zinc-500 italic transition-colors"
                  >
                    {contactInfo.phone}
                  </a>
                </li>
              )}
              {contactInfo.officeHours && (
                <li className="flex items-start gap-2.5">
                  <Clock className="text-neon-lime mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs leading-relaxed font-light text-zinc-500 italic">
                    {contactInfo.officeHours}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="font-mono text-[9px] font-bold tracking-[0.25em] text-zinc-600 uppercase sm:text-[10px]">
            © 2025 - {currentYear}{' '}
            {settings?.site_name_full ||
              'Netrokona University Programming Club'}
            . All rights reserved.
          </p>
          <Link
            href="/developers"
            className="hover:text-neon-lime font-mono text-[9px] tracking-[0.25em] text-zinc-600 uppercase transition-colors sm:text-[10px]"
          >
            {settings?.footer_developer_credit || 'Built by NEUPC Devs'}
          </Link>
        </div>
      </div>
    </footer>
  );
}
