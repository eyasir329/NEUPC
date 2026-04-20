/**
 * @file Footer
 * @module Footer
 */

import Link from 'next/link';
import { Mail, MapPin, Terminal, Code2, Globe } from 'lucide-react';

const defaultSocial = {
  facebook: 'https://facebook.com',
  github: 'https://github.com',
  linkedin: 'https://linkedin.com',
  youtube: 'https://youtube.com',
  twitter: 'https://twitter.com',
};

const defaultContact = {
  email: 'contact@neupc.edu',
  phone: '+880 123 456 7890',
  address: 'Netrokona University\nNetrokona, Bangladesh',
};

const defaultDescription =
  'A technical sanctum dedicated to the advancement of competitive programming and systems engineering at Netrokona University.';

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
  const footerDescription = footer.description || defaultDescription;

  // Pick first 3 social links that have URLs
  const activeSocials = Object.entries(socialLinks)
    .filter(([, url]) => url)
    .slice(0, 3);

  const socialIcons = [Terminal, Code2, Globe];
  const socialColors = [
    'hover:text-neon-lime',
    'hover:text-neon-violet',
    'hover:text-neon-lime',
  ];

  return (
    <footer className="relative pt-32 pb-16">
      <div className="mx-auto max-w-7xl px-8">
        {/* ── Top divider ────────────────────────────────────────── */}
        <div className="via-neon-lime/15 mb-24 h-px w-full bg-linear-to-r from-transparent to-transparent" />

        {/* ── 4-Column Grid ──────────────────────────────────────── */}
        <div className="mb-24 grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-4">
          {/* NEUPC Description */}
          <div className="space-y-8">
            <div className="font-heading text-3xl font-black tracking-tighter text-white italic">
              {settings?.site_name || 'NEUPC'}
            </div>
            <p className="text-sm leading-relaxed font-light text-zinc-500 italic">
              {footerDescription}
            </p>
            <div className="flex space-x-6">
              {activeSocials.map(([platform, url], i) => {
                const IconComponent = socialIcons[i % socialIcons.length];
                return (
                  <a
                    key={platform}
                    className={`text-zinc-500 ${socialColors[i % socialColors.length]} transition-colors`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={platform}
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <div className="font-heading text-[11px] font-bold tracking-widest text-white uppercase">
              Quick Links
            </div>
            <ul className="space-y-4">
              {[
                { href: '/about', label: 'About Us' },
                { href: '/events', label: 'Engineering Logs' },
                { href: '/achievements', label: 'Hall of Victories' },
                { href: '/committee', label: 'Committee' },
                { href: '/gallery', label: 'Gallery' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-neon-lime inline-block font-mono text-[11px] text-zinc-500 uppercase transition-all hover:translate-x-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-6">
            <div className="font-heading text-[11px] font-bold tracking-widest text-white uppercase">
              Resources
            </div>
            <ul className="space-y-4">
              {[
                { href: '/blogs', label: 'Documentation' },
                { href: '/roadmaps', label: 'Source Vault' },
                ...(!isLoggedIn ? [{ href: '/join', label: 'Join Us' }] : []),
                { href: '/contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-neon-lime inline-block font-mono text-[11px] text-zinc-500 uppercase transition-all hover:translate-x-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="font-heading text-[11px] font-bold tracking-widest text-white uppercase">
              Contact Info
            </div>
            <ul className="space-y-4">
              {contactInfo.address && (
                <li className="flex items-center gap-3 text-sm text-zinc-500 italic">
                  <MapPin className="text-neon-lime h-4.5 w-4.5 shrink-0" />
                  <span>{contactInfo.address.split('\n').join(', ')}</span>
                </li>
              )}
              {contactInfo.email && (
                <li className="flex items-center gap-3 text-sm text-zinc-500 italic">
                  <Mail className="text-neon-lime h-4.5 w-4.5 shrink-0" />
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="hover:text-neon-lime transition-colors"
                  >
                    {contactInfo.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* ── Bottom Bar ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-between border-t border-white/5 pt-12 font-mono text-[10px] font-bold tracking-[0.3em] text-zinc-600 uppercase md:flex-row">
          <div>
            © {currentYear}{' '}
            {settings?.site_name_full ||
              'Netrokona University Programming Club'}
            . All Rights Reserved.
          </div>
          <div className="mt-6 flex items-center gap-5 md:mt-0">
            <Link
              href="/developers"
              className="hover:text-neon-lime transition-colors"
            >
              {settings?.footer_developer_credit || 'Built by NEUPC Devs'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
