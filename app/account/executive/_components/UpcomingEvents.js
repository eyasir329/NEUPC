/**
 * @file Upcoming events component
 * @module UpcomingEvents
 */

'use client';

import { Calendar, Users, ArrowRight } from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  ActionButton,
  Pill,
} from '@/app/account/_components/ui';

export default function UpcomingEvents({ upcomingEvents }) {
  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={Calendar}
        title="Upcoming Events"
        subtitle="Manage event operations"
        accent="blue"
        action={
          <ActionButton
            tone="primary"
            href="/account/executive/events/manage"
            icon={ArrowRight}
          >
            View all
          </ActionButton>
        }
      />
      <div className="space-y-2.5">
        {upcomingEvents.map((event) => (
          <div
            key={event.id}
            className="group flex items-start justify-between gap-3 rounded-xl border border-white/6 bg-white/2 p-4 transition-all hover:border-white/10 hover:bg-white/4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-200 transition-colors group-hover:text-white">
                {event.name}
              </p>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="text-xs text-gray-500">{event.date}</span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Users className="h-3 w-3" />
                  {event.registrations} registered
                </span>
              </div>
            </div>
            <Pill tone={event.statusColor === 'green' ? 'emerald' : 'rose'}>
              {event.status}
            </Pill>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
