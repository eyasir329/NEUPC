/**
 * @file Page Hero
 * @module PageHero
 */

'use client';

import { useDelayedLoad } from '@/app/_lib/hooks';
import { cn } from '@/app/_lib/utils';

/**
 * PageHero — Reusable hero section for all public pages.
 * Features staggered entrance animations for badge, title, description, and stats.
 *
 * @param {string}   badge       – Badge label text (e.g. "Upcoming Events")
 * @param {string}   badgeIcon   – Emoji or short string for badge icon (e.g. "📅")
 * @param {string}   title       – Page heading
 * @param {string}   description – Sub-heading paragraph
 * @param {string}   [subtitle]  – Optional second description line
 * @param {Array}    [stats]     – Optional stats array [{value, label, color?}]
 * @param {React.ReactNode} [children] – Optional extra content below description
 */
export default function PageHero({
  badge,
  badgeIcon,
  title,
  description,
  subtitle,
  stats,
  children,
}) {
  const isLoaded = useDelayedLoad(50);

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 z-0">
        <div className="from-primary-500/10 absolute -top-20 -left-20 h-96 w-96 rounded-full bg-linear-to-br to-transparent blur-3xl" />
        <div className="from-secondary-500/10 absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-linear-to-tl to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div
            className={cn(
              'mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-700',
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            )}
          >
            <span className="text-2xl">{badgeIcon}</span>
            <span className="text-primary-300">{badge}</span>
          </div>

          {/* Title */}
          <h1
            className={cn(
              'from-primary-300 to-secondary-300 mb-6 bg-linear-to-r via-white bg-clip-text text-4xl leading-tight font-bold text-transparent transition-all duration-700 md:text-5xl lg:text-6xl',
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            )}
            style={{ transitionDelay: '150ms' }}
          >
            {title}
          </h1>

          {/* Description */}
          <p
            className={cn(
              'mx-auto mb-4 max-w-2xl text-lg leading-relaxed text-gray-300 transition-all duration-700 md:text-xl',
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            )}
            style={{ transitionDelay: '300ms' }}
          >
            {description}
          </p>

          {/* Subtitle */}
          {subtitle && (
            <p
              className={cn(
                'mx-auto max-w-xl text-base text-gray-400 transition-all duration-700',
                isLoaded
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              )}
              style={{ transitionDelay: '400ms' }}
            >
              {subtitle}
            </p>
          )}

          {/* Optional children (custom CTA buttons, etc.) */}
          {children && (
            <div
              className={cn(
                'transition-all duration-700',
                isLoaded
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              )}
              style={{ transitionDelay: '450ms' }}
            >
              {children}
            </div>
          )}

          {/* Stats Grid */}
          {stats && stats.length > 0 && (
            <div
              className={cn(
                `mt-12 grid gap-6 ${
                  stats.length === 3
                    ? 'grid-cols-1 md:grid-cols-3'
                    : 'grid-cols-2 md:grid-cols-4'
                }`
              )}
            >
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-xl bg-white/10 p-4 backdrop-blur-md transition-all duration-700',
                    isLoaded
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-6 opacity-0'
                  )}
                  style={{ transitionDelay: `${500 + i * 100}ms` }}
                >
                  {stat.icon && (
                    <div className="mb-2 text-3xl">{stat.icon}</div>
                  )}
                  <div
                    className={`text-3xl font-bold ${stat.color || (i % 2 === 0 ? 'text-primary-300' : 'text-secondary-300')}`}
                  >
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
