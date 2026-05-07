/**
 * @file Upcoming events section — list preview of next scheduled events.
 * @module MemberUpcomingEventsSection
 */

'use client';

import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { GlassCard, SectionHeader, Pill, ActionButton } from './_ui';
import { motion } from 'framer-motion';

const STATUS_TONE = {
  Registered: 'emerald',
  Open: 'blue',
  Waitlist: 'amber',
  Closed: 'gray',
};

export default function UpcomingEventsSection({ upcomingEvents }) {
  return (
    <div className="lg:col-span-2">
      <GlassCard padding="p-5">
        <SectionHeader
          icon={Calendar}
          title="Upcoming Events"
          subtitle="Workshops, contests, and meetups you can join"
          accent="blue"
          action={
            <ActionButton
              tone="primary"
              icon={ArrowRight}
              href="/account/member/events"
            >
              View All
            </ActionButton>
          }
        />
        <div className="space-y-2.5">
          {upcomingEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className="group flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 transition-all hover:border-white/[0.1] hover:bg-white/[0.04]"
            >
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                <div className="text-[9px] font-medium tracking-wide text-gray-500 uppercase">
                  {event.date.split(' ')[0]}
                </div>
                <div className="text-base font-bold text-white leading-none">
                  {event.date.split(' ')[1]?.replace(',', '')}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Pill tone={event.accent}>{event.category}</Pill>
                  <Pill tone={STATUS_TONE[event.status] ?? 'gray'}>
                    {event.status}
                  </Pill>
                </div>
                <h3 className="mt-1.5 truncate text-sm font-semibold text-white group-hover:text-blue-300">
                  {event.title}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {event.time}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {event.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {event.attendees} going
                  </span>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-gray-600 transition-colors group-hover:text-gray-300" />
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
