/**
 * @file Events
 * @module Events
 */

import Link from 'next/link';
import { cn, formatDate } from '@/app/_lib/utils';
import SectionHeader from '../ui/SectionHeader';
import SectionBackground from '../ui/SectionBackground';

// ─── Configuration ──────────────────────────────────────────────────────────

/** Category → emoji mapping */
const CATEGORY_EMOJI = {
  Bootcamp: '📚',
  Contest: '🏆',
  Workshop: '💼',
  'Tech Talk': '💼',
  Hackathon: '💻',
};

/** Color scheme tokens for primary / secondary event cards */
const COLOR_SCHEMES = {
  primary: {
    hoverBorder: 'hover:border-primary-500/50',
    gradientOverlay: 'from-primary-500/20 via-primary-400/10',
    topBorder: 'from-primary-500 to-secondary-500',
    badge: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
    titleGradient: 'from-primary-300 via-primary-200 to-secondary-300',
    iconBg: 'from-primary-500/20 to-primary-600/20',
    iconColor: 'text-primary-300',
    dateColor: 'text-primary-300',
    button:
      'from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 hover:shadow-primary-500/50',
  },
  secondary: {
    hoverBorder: 'hover:border-secondary-500/50',
    gradientOverlay: 'from-secondary-500/20 via-secondary-400/10',
    topBorder: 'from-secondary-500 to-primary-500',
    badge: 'bg-secondary-500/20 text-secondary-300 border-secondary-500/30',
    titleGradient: 'from-secondary-300 via-secondary-200 to-primary-300',
    iconBg: 'from-secondary-500/20 to-secondary-600/20',
    iconColor: 'text-secondary-300',
    dateColor: 'text-secondary-300',
    button:
      'from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 hover:shadow-secondary-500/50',
  },
};

// ─── SVG Icon Paths (reusable) ──────────────────────────────────────────────
const ICONS = {
  calendar:
    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  location: [
    'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
    'M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  ],
  participants:
    'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  arrowRight: 'M17 8l4 4m0 0l-4 4m4-4H3',
};

/**
 * Render a single SVG icon inside a styled container.
 */
function MetaIcon({ paths, colorClasses }) {
  const pathList = Array.isArray(paths) ? paths : [paths];
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br',
        colorClasses.iconBg
      )}
    >
      <svg
        className={cn('h-5 w-5', colorClasses.iconColor)}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {pathList.map((d, i) => (
          <path
            key={i}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={d}
          />
        ))}
      </svg>
    </div>
  );
}

// ─── EventCard ──────────────────────────────────────────────────────────────

/**
 * EventCard — Glassmorphic card for a single event.
 *
 * @param {object} event       – Event data from DB
 * @param {string} colorScheme – 'primary' | 'secondary'
 */
function EventCard({ event, colorScheme = 'primary' }) {
  const c = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.primary;
  const emoji = CATEGORY_EMOJI[event.category] || '📅';
  const eventLink = `/events/${event.slug || event.id}`;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl md:p-8',
        c.hoverBorder
      )}
    >
      {/* Hover glow */}
      <div
        className={cn(
          'absolute -top-10 -right-10 h-40 w-40 rounded-full bg-linear-to-br to-transparent opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100',
          c.gradientOverlay
        )}
      />
      {/* Top border reveal */}
      <div
        className={cn(
          'absolute top-0 left-0 h-1 w-0 bg-linear-to-r transition-all duration-500 group-hover:w-full',
          c.topBorder
        )}
      />

      <div className="relative">
        {/* Category badge */}
        <div
          className={cn(
            'mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-md',
            c.badge
          )}
        >
          <span className="text-base">{emoji}</span>
          {event.category || 'Event'}
        </div>

        {/* Title */}
        <h3
          className={cn(
            'mb-3 bg-linear-to-r bg-clip-text text-xl leading-tight font-bold text-transparent transition-all duration-300 group-hover:scale-[1.02] md:mb-4 md:text-2xl',
            c.titleGradient
          )}
        >
          {event.title}
        </h3>

        {/* Description */}
        <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-300 transition-colors group-hover:text-gray-200 md:text-base">
          {event.description}
        </p>

        {/* Meta info */}
        <div className="mb-6 space-y-3 text-sm md:text-base">
          {/* Date */}
          <div className="flex items-center gap-3 text-gray-400 transition-colors group-hover:text-gray-300">
            <MetaIcon paths={ICONS.calendar} colorClasses={c} />
            <span className={cn('font-medium', c.dateColor)}>
              {formatDate(event.start_date || event.date)}
            </span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-3 text-gray-400 transition-colors group-hover:text-gray-300">
              <MetaIcon paths={ICONS.location} colorClasses={c} />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Participants */}
          {event.max_participants && (
            <div className="flex items-center gap-3 text-gray-400 transition-colors group-hover:text-gray-300">
              <MetaIcon paths={ICONS.participants} colorClasses={c} />
              <span>{event.max_participants}+ Participants</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          href={eventLink}
          className={cn(
            'group/link inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] md:text-base',
            c.button
          )}
        >
          Learn More
          <svg
            className="h-5 w-5 transition-transform group-hover/link:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={ICONS.arrowRight}
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// ─── Events Section ─────────────────────────────────────────────────────────

/**
 * Events — Homepage section showing the latest 3 events.
 *
 * @param {Array} events – Array of event objects from the database
 */
function Events({ events = [] }) {
  const displayEvents = events.slice(0, 3);

  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
      <SectionBackground />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            badgeIcon="🎯"
            badge="Upcoming Events"
            title="Recent Events"
            subtitle="Join our upcoming workshops, contests, and tech talks to enhance your skills and connect with the community"
          />

          {/* Events Grid */}
          {displayEvents.length > 0 ? (
            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
              {displayEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  colorScheme={index % 2 === 0 ? 'primary' : 'secondary'}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-lg text-gray-400">
                No upcoming events at the moment. Check back soon!
              </p>
            </div>
          )}

          {/* View All */}
          <div className="mt-12 text-center md:mt-16">
            <Link
              href="/events"
              className="from-primary-500 via-secondary-500 to-primary-600 hover:shadow-3xl group hover:shadow-primary-500/50 relative inline-flex items-center gap-3 overflow-hidden rounded-xl bg-linear-to-r px-8 py-4 text-base font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105 md:px-12 md:py-5 md:text-lg"
            >
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">View All Events</span>
              <svg
                className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 md:h-6 md:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Events;
