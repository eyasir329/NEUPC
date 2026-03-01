/**
 * @file Section Header
 * @module SectionHeader
 */

'use client';

import { cn } from '@/app/_lib/utils';
import { useScrollReveal } from '@/app/_lib/hooks';

/**
 * SectionHeader — Reusable section header with badge, title, gradient divider,
 * and optional subtitle. Uses scroll-triggered entrance animation.
 *
 * @param {string}  badge     – Badge text (e.g. "Upcoming Events")
 * @param {string}  badgeIcon – Emoji icon for the badge (e.g. "🎯")
 * @param {string}  title     – Main heading text
 * @param {string}  [subtitle] – Optional subtitle/description
 * @param {string}  [badgeClassName] – Custom badge styling
 * @param {string}  [titleClassName] – Custom title styling
 * @param {string}  [dividerClassName] – Custom divider gradient
 * @param {string}  [className] – Additional wrapper classes
 */
export default function SectionHeader({
  badge,
  badgeIcon,
  title,
  subtitle,
  badgeClassName,
  titleClassName,
  dividerClassName,
  className,
}) {
  const [ref, isVisible] = useScrollReveal({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={cn('mb-12 text-center md:mb-16 lg:mb-20', className)}
    >
      {/* Badge */}
      {badge && (
        <div
          className={cn(
            'mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium shadow-lg backdrop-blur-md transition-all duration-700 hover:bg-white/15 hover:shadow-xl md:mb-6',
            isVisible
              ? 'translate-y-0 opacity-100'
              : '-translate-y-4 opacity-0',
            badgeClassName
          )}
        >
          {badgeIcon && <span className="text-2xl">{badgeIcon}</span>}
          <span className="text-primary-300">{badge}</span>
        </div>
      )}

      {/* Title */}
      <h2
        className={cn(
          'mb-4 text-3xl font-bold text-white transition-all duration-700 sm:text-4xl md:mb-6 md:text-5xl lg:text-6xl',
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
          titleClassName
        )}
        style={{ transitionDelay: isVisible ? '150ms' : '0ms' }}
      >
        {title}
      </h2>

      {/* Gradient Divider */}
      <div
        className={cn(
          'from-primary-500 via-secondary-300 to-primary-500 shadow-glow mx-auto h-1.5 rounded-full bg-linear-to-r transition-all duration-700 md:w-40',
          isVisible ? 'w-32 opacity-100' : 'w-0 opacity-0',
          dividerClassName
        )}
        style={{ transitionDelay: isVisible ? '300ms' : '0ms' }}
      />

      {/* Subtitle */}
      {subtitle && (
        <p
          className={cn(
            'mx-auto mt-6 max-w-2xl text-base text-gray-300 transition-all duration-700 md:text-lg lg:text-xl',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          )}
          style={{ transitionDelay: isVisible ? '400ms' : '0ms' }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
