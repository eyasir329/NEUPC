'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn, formatDate, driveImageUrl } from '@/app/_lib/utils';
import SafeImg from '../ui/SafeImg';

const STATUS_LABEL = {
  upcoming: 'Upcoming',
  ongoing: 'Live Now',
  completed: 'Completed',
};

const STATUS_STYLES = {
  upcoming: { dot: 'bg-neon-lime animate-pulse', text: 'text-neon-lime' },
  ongoing: { dot: 'bg-neon-violet animate-pulse', text: 'text-neon-violet' },
  completed: {
    dot: 'bg-zinc-600',
    text: 'text-zinc-500',
  },
};

const CARD_ACCENT = [
  {
    border: 'border-neon-violet/20',
    tag: 'bg-neon-violet/90 text-black',
    glow: 'group-hover:shadow-neon-violet/10',
    hover: 'group-hover:text-neon-violet',
    badge: 'bg-neon-violet/10',
  },
  {
    border: 'border-neon-lime/20',
    tag: 'bg-neon-lime/90 text-black',
    glow: 'group-hover:shadow-neon-lime/10',
    hover: 'group-hover:text-neon-lime',
    badge: 'bg-neon-lime/10',
  },
  {
    border: 'border-white/10',
    tag: 'bg-white/90 text-black',
    glow: 'group-hover:shadow-white/5',
    hover: 'group-hover:text-white',
    badge: 'bg-white/5',
  },
];

// Animation variants
const sectionHeader = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};
const gridContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

function EventCard({ event, index = 0 }) {
  const accent = CARD_ACCENT[index % CARD_ACCENT.length];
  const statusKey = event.status || 'upcoming';
  const status = STATUS_STYLES[statusKey] || STATUS_STYLES.upcoming;
  const hasImage = !!(event.cover_image || event.banner_image);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Link
        href={`/events/${event.slug || event.id}`}
        className="group focus-visible:ring-neon-lime relative flex h-full flex-col rounded-2xl focus-visible:ring-2 focus-visible:outline-none"
      >
        {/* Image */}
        <div
          className={cn(
            'relative mb-5 w-full overflow-hidden rounded-2xl border transition-shadow duration-500',
            'aspect-[4/3] md:aspect-[4/5]',
            accent.border,
            accent.badge,
            'shadow-md group-hover:shadow-xl',
            accent.glow
          )}
        >
          {hasImage ? (
            <SafeImg
              src={driveImageUrl(event.cover_image || event.banner_image)}
              alt={event.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#05060b]/90 via-[#05060b]/20 to-transparent" />
          <div
            className={cn(
              'absolute top-3 left-3 rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-widest uppercase backdrop-blur-md sm:top-4 sm:left-4 sm:px-4 sm:py-1.5',
              accent.tag
            )}
          >
            {event.category || 'Event'}
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 sm:bottom-4 sm:left-4">
            <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
            <span
              className={cn(
                'font-mono text-[10px] font-bold tracking-widest uppercase',
                status.text
              )}
            >
              {STATUS_LABEL[statusKey] || 'Upcoming'}
            </span>
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-1 flex-col gap-3 px-1">
          <h3
            className={cn(
              'font-heading text-lg leading-tight font-black tracking-tight text-white uppercase italic transition-colors sm:text-xl md:text-2xl',
              accent.hover
            )}
          >
            {event.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-zinc-500">
            {event.description || 'Discover more about this exciting event.'}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/5 pt-4 font-mono text-[10px] font-semibold tracking-widest text-zinc-600 uppercase">
            <span>{formatDate(event.start_date, { timeZone: 'UTC' })}</span>
            {event.venue && (
              <>
                <span className="h-1 w-1 rounded-full bg-white/10" />
                <span className="max-w-[120px] truncate">{event.venue}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Events({
  events = [],
  featuredEvents = [],
  recentEvents = [],
  settings = {},
}) {
  const recent = recentEvents.length > 0 ? recentEvents : events.slice(0, 3);

  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="bg-neon-lime/5 absolute top-1/4 left-0 h-[300px] w-[300px] rounded-full blur-[120px] sm:h-[400px] sm:w-[400px] sm:blur-[140px]" />
        <div className="bg-neon-violet/5 absolute right-0 bottom-1/4 h-[200px] w-[200px] rounded-full blur-[100px] sm:h-[300px] sm:w-[300px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-12 sm:space-y-16">
        {/* Header */}
        <motion.div
          variants={sectionHeader}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px 0px' }}
          className="flex flex-col gap-6 sm:gap-8 md:flex-row md:items-end md:justify-between"
        >
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <span className="bg-neon-lime h-px w-8 sm:w-10" />
              <span className="text-neon-lime font-mono text-[10px] font-bold tracking-[0.4em] uppercase sm:text-[11px] sm:tracking-[0.5em]">
                Activity Feed / 002
              </span>
            </div>
            <h2 className="kinetic-headline font-heading text-4xl font-black text-white uppercase sm:text-5xl md:text-6xl">
              {settings?.homepage_events_title || 'Recent Events'}
            </h2>
          </div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/events"
              className="font-heading focus-visible:ring-neon-lime w-fit shrink-0 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-bold tracking-widest text-zinc-400 uppercase transition-colors hover:border-neon-lime hover:text-neon-lime focus-visible:ring-2 focus-visible:outline-none sm:px-8 sm:py-3.5 sm:text-[11px]"
            >
              View All →
            </Link>
          </motion.div>
        </motion.div>

        {/* Cards */}
        {recent.length > 0 ? (
          <motion.div
            variants={gridContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px 0px' }}
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3"
          >
            {recent.slice(0, 3).map((event, index) => (
              <motion.div key={event.id} variants={cardItem}>
                <EventCard event={event} index={index} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-4 py-20 text-center sm:py-24"
          >
            <div className="font-mono text-4xl opacity-20">[ ]</div>
            <p className="font-mono text-[11px] tracking-[0.3em] text-zinc-600 uppercase">
              {settings?.events_empty_message || 'No events found'}
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default Events;
