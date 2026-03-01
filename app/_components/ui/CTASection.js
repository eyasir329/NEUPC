/**
 * @file C T A Section
 * @module CTASection
 */

'use client';

import Link from 'next/link';
import { useIsMember } from './UserRoleProvider';
import { useScrollReveal } from '@/app/_lib/hooks';
import { cn } from '@/app/_lib/utils';

/**
 * CTASection — Reusable call-to-action section for page bottoms.
 *
 * @param {string} icon           – Emoji icon (e.g. "🎯")
 * @param {string} title          – CTA heading
 * @param {string} description    – CTA body text
 * @param {object} primaryAction  – { label: string, href: string }
 * @param {object} secondaryAction – { label: string, href: string }
 */
export default function CTASection({
  icon = '🎯',
  title,
  description,
  primaryAction = { label: 'Join the Club', href: '/join' },
  secondaryAction = { label: 'Contact Us', href: '/contact' },
}) {
  const isMember = useIsMember();
  const isExternal = primaryAction.href?.startsWith('http');
  const isJoinAction = primaryAction.href === '/join';
  const [ref, isVisible] = useScrollReveal({ threshold: 0.2 });

  // Hide join-related primary action for non-guest members
  const showPrimary = !(isJoinAction && isMember);

  return (
    <section ref={ref} className="relative overflow-hidden py-20">
      <div className="via-primary-500/5 absolute inset-0 bg-linear-to-b from-transparent to-transparent" />
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'mx-auto max-w-3xl text-center transition-all duration-700',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div
            className={cn(
              'mb-6 text-5xl transition-all duration-700',
              isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            )}
            style={{ transitionDelay: isVisible ? '100ms' : '0ms' }}
          >
            {icon}
          </div>

          <h2
            className={cn(
              'mb-4 text-3xl font-bold text-white transition-all duration-700 md:text-4xl',
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            )}
            style={{ transitionDelay: isVisible ? '200ms' : '0ms' }}
          >
            {title}
          </h2>

          <p
            className={cn(
              'mb-8 text-lg text-gray-300 transition-all duration-700',
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            )}
            style={{ transitionDelay: isVisible ? '300ms' : '0ms' }}
          >
            {description}
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            {showPrimary &&
              (isExternal ? (
                <a
                  href={primaryAction.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="from-primary-500 to-secondary-500 group inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  {primaryAction.label}
                  <svg
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </a>
              ) : (
                <Link
                  href={primaryAction.href}
                  className="from-primary-500 to-secondary-500 group inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  {primaryAction.label}
                  <svg
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              ))}

            <Link
              href={secondaryAction.href}
              className="group inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/20 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-white/40 hover:bg-white/20"
            >
              {secondaryAction.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
