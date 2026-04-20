'use client';

/**
 * @file Events — Homepage section
 * @module Events
 */

import Link from 'next/link';
import { cn, formatDate, driveImageUrl } from '@/app/_lib/utils';
import SafeImg from '../ui/SafeImg';
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
  upcoming: 'text-emerald-600 dark:text-neon-lime',
  ongoing: 'text-violet-600 dark:text-neon-violet',
  completed: 'text-slate-400 dark:text-zinc-500',
};

const CARD_BG = [
  {
    ph: 'bg-violet-50 border-violet-200 dark:bg-neon-violet/10 dark:border-neon-violet/20',
    tag: 'bg-emerald-500/90 text-white dark:bg-neon-lime/90 dark:text-black',
    hover: 'group-hover:text-emerald-600 dark:group-hover:text-neon-lime',
  },
  {
    ph: 'bg-emerald-50 border-emerald-200 dark:bg-neon-lime/10 dark:border-neon-lime/20',
    tag: 'bg-violet-600/90 text-white',
    hover: 'group-hover:text-violet-600 dark:group-hover:text-neon-violet',
  },
  {
    ph: 'bg-slate-100 border-slate-200 dark:bg-white/5 dark:border-white/10',
    tag: 'bg-slate-800 text-white dark:bg-white/90 dark:text-black',
    hover: 'group-hover:text-emerald-600 dark:group-hover:text-neon-lime',
  },
];

function EventCard({ event, index = 0 }) {
  const card = CARD_BG[index % CARD_BG.length];
  const statusKey = event.status || 'upcoming';
  const statusLabel = STATUS_LABEL[statusKey] || 'PENDING';
  const statusColor = STATUS_COLOR[statusKey] || STATUS_COLOR.upcoming;
  const eventLink = `/events/${event.slug || event.id}`;
  const hasImage = !!(event.cover_image || event.banner_image);

  return (
    <Link href={eventLink} className="group relative block">
      <div
        className={cn(
          'relative mb-6 aspect-4/5 overflow-hidden rounded-2xl border',
          card.ph
        )}
      >
        {hasImage ? (
          <SafeImg
            src={driveImageUrl(event.cover_image || event.banner_image)}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-white/80 via-white/10 to-transparent dark:from-[#05060b]/95 dark:via-[#05060b]/30 dark:to-transparent" />

        <div
          className={cn(
            'absolute top-4 left-4 rounded-full px-4 py-1.5 font-mono text-[10px] font-bold uppercase backdrop-blur-md',
            card.tag
          )}
        >
          {event.category || 'Event'}
        </div>

        <div className="absolute bottom-4 left-4 font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase dark:text-zinc-400">
          [ event_{String(index + 1).padStart(3, '0')} ]
        </div>
      </div>

      <h3
        className={cn(
          'font-heading mb-3 text-2xl font-black tracking-tight text-slate-900 uppercase italic transition-colors dark:text-white',
          card.hover
        )}
      >
        {event.title}
      </h3>

      <p className="mb-6 line-clamp-2 text-sm font-light leading-relaxed text-slate-500 dark:text-zinc-500">
        {event.description || 'Discover more about this exciting event.'}
      </p>

      <div className="flex items-center gap-4 border-t border-slate-200 pt-4 font-mono text-[10px] font-bold dark:border-white/5">
        <span className="tracking-[0.2em] text-slate-500 uppercase dark:text-zinc-500">
          {formatDate(event.start_date, { timeZone: 'UTC' })}
        </span>
        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/10" />
        <span className={cn('flex items-center gap-1.5 tracking-[0.2em] uppercase', statusColor)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', statusKey === 'upcoming' && 'pulse-dot bg-emerald-500 dark:bg-neon-lime', statusKey === 'ongoing' && 'pulse-dot bg-violet-500 dark:bg-neon-violet', statusKey === 'completed' && 'bg-slate-400 dark:bg-zinc-600')} />
          {statusLabel}
        </span>
      </div>
    </Link>
  );
}

function Events({
  events = [],
  featuredEvents = [],
  recentEvents = [],
  settings = {},
}) {
  const recent = recentEvents.length > 0 ? recentEvents : events.slice(0, 3);

  const {
    ref: gridRef,
    isVisible: gridVisible,
    getDelay,
  } = useStaggerReveal({ staggerMs: 120 });

  return (
    <section className="relative overflow-hidden px-8 py-32">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-0 top-1/4 h-[400px] w-[400px] rounded-full bg-neon-lime/5 blur-[140px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl space-y-16">
        <div className="flex flex-col items-end justify-between gap-8 md:flex-row">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="h-[1px] w-10 bg-emerald-500 dark:bg-neon-lime" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.5em] text-emerald-600 dark:text-neon-lime">
                Activity Feed / 002
              </span>
            </div>
            <h2 className="kinetic-headline font-heading text-5xl font-black uppercase text-slate-900 md:text-6xl dark:text-white">
              {settings?.homepage_events_title || 'Recent Events'}
            </h2>
          </div>
          <Link
            href="/events"
            className="font-heading shrink-0 rounded-full border border-slate-200 bg-slate-50 px-8 py-3.5 text-[11px] font-bold tracking-widest text-slate-500 uppercase transition-all hover:border-slate-900 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:border-neon-lime dark:hover:text-neon-lime"
          >
            View All Events →
          </Link>
        </div>

        {recent.length > 0 ? (
          <div ref={gridRef} className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {recent.slice(0, 3).map((event, index) => (
              <div
                key={event.id}
                className={cn(
                  'transition-all duration-700 ease-out',
                  gridVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                )}
                style={{
                  transitionDelay: gridVisible ? `${getDelay(index)}ms` : '0ms',
                }}
              >
                <EventCard event={event} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="font-mono text-[11px] tracking-[0.3em] text-slate-400 uppercase dark:text-zinc-600">
              {settings?.events_empty_message || '[ NO_EVENTS_FOUND ]'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default Events;
