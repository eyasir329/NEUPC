/**
 * @file Upcoming events section component
 * @module UpcomingEventsSection
 */

'use client';

import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Users, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

export default function UpcomingEventsSection({ upcomingEvents }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-light tracking-widest text-zinc-100 uppercase">
              Upcoming Events
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Workshops, contests, and meetups you can join
            </p>
          </div>
        </div>
        <Link
          href="/account/member/events"
          className="flex shrink-0 items-center gap-2 text-xs font-bold tracking-widest text-zinc-500 uppercase transition-colors hover:text-zinc-100"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {upcomingEvents.length === 0 && (
        <p className="py-6 text-center text-sm text-zinc-500">
          No upcoming events right now — check back soon.
        </p>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {upcomingEvents.map((event) => (
          <EventCard
            key={event.id}
            date={event.date}
            title={event.title}
            time={event.time}
            location={event.location}
            attendees={event.attendees ? `${event.attendees} going` : null}
            type={event.category}
            status={event.status}
          />
        ))}
      </div>
    </div>
  );
}

function EventCard({ date, title, time, location, attendees, type, status }) {
  const [month, day] = date.split(' ');
  const cleanDay = day?.replace(',', '');

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group flex cursor-pointer gap-5 rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-indigo-500/30 hover:bg-white/10"
    >
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50 shadow-lg shadow-black/40 backdrop-blur-xl transition-colors group-hover:border-indigo-500/30">
        <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
          {month}
        </span>
        <span className="mt-1 text-xl leading-none font-light text-zinc-100">
          {cleanDay}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded-lg border border-white/10 bg-zinc-900/50 px-2 py-0.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase backdrop-blur-xl">
            {type}
          </span>
          <span
            className={`shrink-0 rounded-lg border px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase ${status === 'Registered' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'}`}
          >
            {status}
          </span>
        </div>
        <h4 className="mb-2 truncate text-base font-bold text-zinc-100 transition-colors group-hover:text-indigo-400">
          {title}
        </h4>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-zinc-500">
          <span className="flex shrink-0 items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {time}
          </span>
          <span className="flex max-w-[140px] items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" />{' '}
            <span className="truncate">{location}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {attendees && (
              <>
                <Users className="h-3.5 w-3.5" /> {attendees}
              </>
            )}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
