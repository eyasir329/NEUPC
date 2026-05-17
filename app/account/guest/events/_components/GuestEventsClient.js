'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CalendarCheck,
  CalendarX,
  ChevronLeft,
  Clock,
  MapPin,
  FileText,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  PageShell,
  TabBar,
  PageHeader,
  GlassCard,
  ActionButton,
} from '../../_components/_ui';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const fmtTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const isPast = (iso) => (iso ? new Date(iso) < new Date() : false);

const STATS_CONFIG = [
  {
    id: 'upcoming',
    title: 'Upcoming',
    subtext: 'Next scheduled',
    icon: Calendar,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 'open',
    title: 'Open Slots',
    subtext: 'Available now',
    icon: CalendarCheck,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    id: 'past',
    title: 'Past Events',
    subtext: 'Completed',
    icon: CalendarX,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
];

const MainContent = ({ activeTab, events, stats, onEventClick }) => {
  const filteredEvents =
    activeTab === 'Upcoming'
      ? events.filter((e) => e.isUpcoming)
      : events.filter((e) => e.category === activeTab);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        {/* Event List */}
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/6 pb-3">
            <p className="text-xs font-medium text-gray-500">
              {filteredEvents.length === 0
                ? `No events found in ${activeTab}`
                : `Showing ${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredEvents.length > 0 ? (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                {filteredEvents.map((event, index) => {
                  const dateObj = new Date(event.start_date || new Date());
                  const month = dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                  });
                  const day = dateObj.toLocaleDateString('en-US', {
                    day: 'numeric',
                  });

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: 'easeOut',
                      }}
                      onClick={() => onEventClick(event.id)}
                      className="group relative flex cursor-pointer flex-col gap-5 overflow-hidden rounded-2xl border border-white/8 bg-gray-900 p-5 transition-all duration-300 hover:border-white/12 hover:bg-white/2 sm:flex-row"
                    >
                      {event.isUpcoming && (
                        <div className="absolute top-0 left-0 h-full w-1 bg-emerald-500/50" />
                      )}

                      {/* Date block */}
                      <div className="z-10 hidden h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-white/5 bg-gray-900/50 shadow-inner transition-all group-hover:border-violet-500/40 sm:flex">
                        <span className="mb-1 text-[9px] leading-none font-bold tracking-widest text-violet-400 uppercase">
                          {month}
                        </span>
                        <span className="text-xl leading-none font-bold text-white">
                          {day}
                        </span>
                      </div>

                      <div className="z-10 flex min-w-0 flex-1 flex-col justify-center">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-violet-300 uppercase">
                            {event.type}
                          </span>
                          {event.isUpcoming && (
                            <span className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                              Open
                            </span>
                          )}
                        </div>
                        <h3 className="mb-1 line-clamp-2 text-base leading-snug font-semibold text-gray-200 transition-colors group-hover:text-violet-400">
                          {event.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-4 text-xs font-medium text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-gray-600" />{' '}
                            {event.time}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-gray-600" />
                            <span className="max-w-37.5 truncate">
                              {event.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full shrink-0 items-center justify-between gap-4 border-t border-white/6 pt-3 text-xs font-medium text-gray-500 sm:ml-4 sm:w-auto sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:pt-0">
                        <span className="rounded-md border border-white/8 bg-white/3 px-2.5 py-1 font-semibold tracking-wide text-gray-400">
                          {event.status}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/2 p-12 text-center"
              >
                <CalendarX size={48} className="mb-4 text-gray-700" />
                <h3 className="mb-1 text-lg font-medium text-gray-300">
                  No {activeTab} events
                </h3>
                <p className="max-w-sm text-sm text-gray-500">
                  There are currently no events in this category. Check back
                  later!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar */}
        <div className="sticky top-14 hidden flex-col gap-6 lg:flex">
          <div className="rounded-xl border border-white/6 bg-gray-900 p-5 transition-all hover:border-white/10">
            <h3 className="mb-4 text-sm font-semibold text-gray-200">
              Overview
            </h3>
            <div className="flex flex-col gap-4 text-sm">
              {stats.map((stat) => (
                <div
                  key={stat.id}
                  className="group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md ${stat.bg}`}
                    >
                      <stat.icon size={12} className={stat.color} />
                    </div>
                    <span className="font-medium text-gray-400 transition-colors group-hover:text-gray-300">
                      {stat.title}
                    </span>
                  </div>
                  <span className="font-semibold text-white tabular-nums">
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <GlassCard className="border-violet-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-violet-950/30">
            <div className="mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-violet-400" />
              <p className="text-[13px] font-semibold text-white">
                Unlock more events
              </p>
            </div>
            <p className="mb-3 text-[12px] text-gray-400">
              Members get bootcamps, mentor sessions, and post-event recordings.
            </p>
            <ActionButton
              href="/account/guest/membership-application"
              tone="indigo"
              className="w-full justify-center"
            >
              <Sparkles className="h-3.5 w-3.5" /> Apply for membership
            </ActionButton>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

const EventDetail = ({ event, onBack }) => (
  <div className="flex flex-col gap-6 pb-12 lg:gap-8">
    <button
      onClick={onBack}
      className="flex w-max items-center gap-2 rounded-lg border border-white/8 bg-gray-900 px-4 py-2 text-xs font-semibold text-gray-300 transition-all hover:bg-white/6 hover:text-white active:scale-95"
    >
      <ChevronLeft size={16} /> Back to Events
    </button>

    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
      <div className="flex items-start gap-5">
        <div className="mt-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-violet-500/30 bg-linear-to-br from-violet-500/20 to-purple-500/20 text-violet-400 shadow-inner">
          <Calendar size={32} />
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-white/8 bg-white/6 px-2.5 py-1 text-[10px] font-bold tracking-wider text-gray-300 uppercase">
              {event.type}
            </span>
            {event.isUpcoming && (
              <span className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Registration Open
              </span>
            )}
          </div>
          <h1 className="mb-4 text-3xl leading-snug font-bold tracking-tight text-white lg:text-4xl">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" /> {event.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-500" /> {event.time}
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-500" /> {event.location}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <GlassCard>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-200">
            <FileText size={16} className="text-violet-400" /> About Event
          </h3>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-300">
            {event.description || 'No description provided.'}
          </p>
        </GlassCard>
      </div>

      <div className="flex flex-col gap-6">
        <GlassCard>
          <h3 className="mb-4 text-sm font-bold text-gray-200">
            Event Details
          </h3>
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex items-center justify-between border-b border-white/6 py-2">
              <span className="font-medium text-gray-500">Status</span>
              <span className="font-semibold text-gray-200">
                {event.status}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-white/6 py-2">
              <span className="font-medium text-gray-500">Category</span>
              <span className="font-semibold text-gray-200">{event.type}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-medium text-gray-500">Access</span>
              <span className="font-semibold text-violet-400">Public</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border-indigo-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-indigo-950/30">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <p className="text-[13px] font-semibold text-white">
              Member-only benefits
            </p>
          </div>
          <p className="mb-3 text-[12px] text-gray-400">
            Priority registration, exclusive materials, and post-event
            recordings.
          </p>
          <ActionButton
            href="/account/guest/membership-application"
            tone="indigo"
            className="w-full justify-center"
          >
            Apply for membership
          </ActionButton>
        </GlassCard>
      </div>
    </div>
  </div>
);

const FALLBACK_EVENTS = [
  {
    id: 'fe1', title: 'Web Development Workshop', category: 'Workshop',
    start_date: new Date(Date.now() + 3 * 86400000).toISOString(),
    location: 'CSE Lab-B', description: 'A hands-on workshop covering modern web development techniques including React, Next.js, and Tailwind CSS. Open to all students.',
  },
  {
    id: 'fe2', title: 'Competitive Programming Contest #12', category: 'Contest',
    start_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    location: 'Online', description: 'Monthly competitive programming round hosted on Codeforces. Duration: 2.5 hours, 6 problems across various difficulty levels.',
  },
  {
    id: 'fe3', title: 'Advanced Algorithms Bootcamp', category: 'Bootcamp',
    start_date: new Date(Date.now() + 10 * 86400000).toISOString(),
    location: 'CSE Lab-A', description: 'A 3-day intensive bootcamp on advanced algorithms: graph theory, segment trees, and dynamic programming optimisations.',
  },
  {
    id: 'fe4', title: 'Git & GitHub for Beginners', category: 'Workshop',
    start_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    location: 'Room 301', description: 'Learn version control fundamentals with Git and collaboration workflows on GitHub. No prior experience required.',
  },
  {
    id: 'fe5', title: 'JavaScript Fundamentals', category: 'Seminar',
    start_date: new Date(Date.now() - 12 * 86400000).toISOString(),
    location: 'Auditorium', description: 'An introductory seminar on JavaScript covering variables, functions, DOM manipulation, and async programming.',
  },
  {
    id: 'fe6', title: 'NEUPC Hackathon 2025', category: 'Hackathon',
    start_date: new Date(Date.now() - 20 * 86400000).toISOString(),
    location: 'Innovation Hub', description: '24-hour hackathon focused on building solutions for local community problems. Teams of 2–4 members.',
  },
];

export default function GuestEventsClient({ events: serverEvents }) {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [selectedEventId, setSelectedEventId] = useState(null);

  const sourceEvents = (serverEvents && serverEvents.length > 0) ? serverEvents : FALLBACK_EVENTS;

  const allEvents = useMemo(() => {
    return (sourceEvents || []).map((e) => {
      const isEventPast = isPast(e.start_date);
      const category = isEventPast ? 'Past events' : 'Open events';
      const status = isEventPast ? 'Past' : 'Registration Open';

      return {
        ...e,
        type: e.category || e.kind || 'Event',
        status,
        category,
        date: fmtDate(e.start_date),
        time: fmtTime(e.start_date),
        location: e.location || 'Virtual',
        isUpcoming: !isEventPast,
      };
    });
  }, [sourceEvents]);

  const stats = STATS_CONFIG.map((stat) => {
    let count = 0;
    if (stat.id === 'upcoming')
      count = allEvents.filter((e) => e.isUpcoming).length;
    else if (stat.id === 'open')
      count = allEvents.filter((e) => e.category === 'Open events').length;
    else if (stat.id === 'past')
      count = allEvents.filter((e) => e.category === 'Past events').length;
    return { ...stat, count };
  });

  const tabs = [
    {
      id: 'Upcoming',
      label: 'All Events',
      icon: Calendar,
      count: allEvents.filter((e) => e.isUpcoming).length,
    },
    {
      id: 'Open events',
      label: 'Open Slots',
      icon: CalendarCheck,
      count: allEvents.filter((e) => e.category === 'Open events').length,
    },
    {
      id: 'Past events',
      label: 'Past Events',
      icon: CalendarX,
      count: allEvents.filter((e) => e.category === 'Past events').length,
    },
  ];

  const selectedEvent = selectedEventId
    ? allEvents.find((e) => e.id === selectedEventId)
    : null;
  const uiTabs = tabs.map((t) => ({
    value: t.id,
    label: t.label,
    icon: t.icon,
    count: t.count,
  }));

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
      <AnimatePresence mode="popLayout">
        {selectedEvent ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <EventDetail
              event={selectedEvent}
              onBack={() => setSelectedEventId(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <PageHeader
              icon={Calendar}
              title="Events"
              subtitle="Discover upcoming contests, workshops and bootcamps"
              accent="blue"
            />
            <TabBar
              tabs={uiTabs}
              value={activeTab}
              onChange={(id) => {
                setActiveTab(id);
                setSelectedEventId(null);
              }}
            />
            <MainContent
              activeTab={activeTab}
              events={allEvents}
              stats={stats}
              onEventClick={setSelectedEventId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
