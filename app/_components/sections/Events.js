'use client';

/**
 * @file Events — Homepage section
 * @module Events
 */

import Link from 'next/link';
import { cn, formatDate, driveImageUrl } from '@/app/_lib/utils';
import SafeImg from '../ui/SafeImg';
import FeaturedEventSlider from './FeaturedEventSlider';
import { useStaggerReveal } from '@/app/_lib/hooks';

const CATEGORY_ICON = {
  Bootcamp: '📚',
  Contest: '🏆',
  Workshop: '🔧',
  Seminar: '🎤',
  Hackathon: '💻',
  Meetup: '🤝',
  Other: '📅',
};

const STATUS_LABEL = {
  upcoming: 'PENDING',
  ongoing: 'LIVE',
  completed: 'COMPLETED',
};

const STATUS_COLOR = {
  upcoming: 'text-neon-lime',
  ongoing: 'text-neon-violet',
  completed: 'text-zinc-500',
};

const CARD_BG = [
  { ph: 'bg-neon-violet/10 border-neon-violet/20', tag: 'bg-neon-lime/90 text-black', hover: 'group-hover:text-neon-lime' },
  { ph: 'bg-neon-lime/10 border-neon-lime/20', tag: 'bg-neon-violet/90 text-white', hover: 'group-hover:text-neon-violet' },
  { ph: 'bg-white/5 border-white/10', tag: 'bg-white/90 text-black', hover: 'group-hover:text-neon-lime' },
];

function EventCard({ event, index = 0 }) {
  const card = CARD_BG[index % CARD_BG.length];
  const emoji = CATEGORY_ICON[event.category] || '📅';
  const statusKey = event.status || 'upcoming';
  const statusLabel = STATUS_LABEL[statusKey] || 'PENDING';
  const statusColor = STATUS_COLOR[statusKey] || STATUS_COLOR.upcoming;
  const eventLink = `/events/${event.slug || event.id}`;
  const hasImage = !!(event.cover_image || event.banner_image);

  return (
    <Link href={eventLink} className="group relative block">
      {/* Image / placeholder */}
      <div className={cn('relative overflow-hidden mb-6 aspect-4/5 rounded-2xl border', card.ph)}>
        {hasImage ? (
          <SafeImg
            src={driveImageUrl(event.cover_image || event.banner_image)}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-site-bg/95 via-site-bg/30 to-transparent" />

        {/* Category tag */}
        <div className={cn('absolute top-4 left-4 px-4 py-1.5 font-mono text-[10px] font-bold uppercase rounded-full backdrop-blur-md', card.tag)}>
          {event.category || 'Event'}
        </div>

        {/* Event index */}
        <div className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
          [ event_{String(index + 1).padStart(3, '0')} ]
        </div>
      </div>

      <h3 className={cn('text-2xl font-heading font-black mb-3 tracking-tight text-white uppercase italic transition-colors', card.hover)}>
        {event.title}
      </h3>

      <p className="text-zinc-500 text-sm mb-6 font-light leading-relaxed line-clamp-2">
        {event.description || 'Discover more about this exciting event.'}
      </p>

      <div className={cn('flex items-center text-[10px] font-mono font-bold space-x-4 border-t border-white/5 pt-4', statusColor)}>
        <span>{formatDate(event.start_date)}</span>
        <span className="w-1 h-1 bg-white/10 rounded-full" />
        <span>STATUS: {statusLabel}</span>
      </div>
    </Link>
  );
}

function Events({ events = [], featuredEvents = [], recentEvents = [], settings = {} }) {
  const featured =
    featuredEvents.length > 0 ? featuredEvents : events.filter((e) => e.is_featured);
  const featuredIds = new Set(featured.map((e) => e.id));
  const recent =
    recentEvents.length > 0
      ? recentEvents.filter((e) => !featuredIds.has(e.id))
      : events.filter((e) => !e.is_featured).slice(0, 3);

  const hasContent = featured.length > 0 || recent.length > 0;
  const { ref: gridRef, isVisible: gridVisible, getDelay } = useStaggerReveal({ staggerMs: 120 });

  return (
    <section className="py-32 px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-3">
            <span className="text-neon-lime font-mono font-bold uppercase tracking-[0.4em] text-[11px]">
              Activity Feed
            </span>
            <h2 className="text-5xl font-heading font-black text-white uppercase tracking-tighter">
              {settings?.homepage_events_title || 'Recent Events'}
            </h2>
          </div>
          <Link
            href="/events"
            className="font-heading font-bold px-8 py-3.5 rounded-full border border-white/10 hover:border-neon-lime hover:text-neon-lime transition-all text-[11px] uppercase tracking-widest bg-white/5 text-zinc-400 shrink-0"
          >
            View All Events
          </Link>
        </div>

        {hasContent ? (
          <div className="space-y-16">
            {/* Featured slider */}
            {featured.length > 0 && (
              <FeaturedEventSlider events={featured} />
            )}

            {/* Recent grid */}
            {recent.length > 0 && (
              <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {recent.slice(0, 3).map((event, index) => (
                  <div
                    key={event.id}
                    className={cn(
                      'transition-all duration-700 ease-out',
                      gridVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    )}
                    style={{ transitionDelay: gridVisible ? `${getDelay(index)}ms` : '0ms' }}
                  >
                    <EventCard event={event} index={index} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="font-mono text-[11px] text-zinc-600 uppercase tracking-[0.3em]">
              {settings?.events_empty_message || '[ NO_EVENTS_FOUND ]'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default Events;
