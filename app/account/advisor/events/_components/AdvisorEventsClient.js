'use client';

import { useMemo } from 'react';
import { Calendar, CalendarCheck, TrendingUp, Sparkles } from 'lucide-react';
import { GlassCard } from '@/app/account/member/_components/_ui';
import EventListLayout from '@/app/account/_components/events/EventListLayout';
import { enrichEvent } from '@/app/account/_components/events/eventUtils';
import { computeStats } from '@/app/account/_components/events/eventConstants';

const TABS_BASE = [
  { value: 'All',       label: 'All Events', icon: Calendar      },
  { value: 'Upcoming',  label: 'Upcoming',   icon: Calendar      },
  { value: 'Ongoing',   label: 'Ongoing',    icon: TrendingUp    },
  { value: 'Completed', label: 'Completed',  icon: CalendarCheck },
];

function filterFn(event, tab) {
  if (tab === 'All')       return true;
  if (tab === 'Upcoming')  return event._bucket === 'upcoming';
  if (tab === 'Ongoing')   return event._bucket === 'ongoing';
  if (tab === 'Completed') return event._bucket === 'completed';
  return true;
}

const SIDEBAR_CTA = (
  <GlassCard className="border-violet-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-violet-950/30">
    <div className="mb-3 flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-violet-400" />
      <p className="text-[13px] font-semibold text-white">Event Oversight</p>
    </div>
    <p className="text-[12px] text-gray-400">
      Monitor registrations, attendance, and event progress across all club activities.
    </p>
  </GlassCard>
);

function getDetailProps(event) {
  return {
    detailRows: [
      { label: 'Status',     value: event._bucket, accent: 'text-gray-200 capitalize' },
      { label: 'Registered', value: event.registrationCount || 0 },
      { label: 'Attended',   value: event.attendedCount || 0 },
      { label: 'Access',     value: 'Club Members', accent: 'text-violet-400' },
    ],
  };
}

export default function AdvisorEventsClient({ events: serverEvents }) {
  const allEvents = useMemo(() => (serverEvents || []).map(enrichEvent), [serverEvents]);
  const stats = computeStats('observer', allEvents);
  const tabs = TABS_BASE.map((t) => ({ ...t, count: allEvents.filter((e) => filterFn(e, t.value)).length }));

  return (
    <EventListLayout
      pageHeader={{ icon: Calendar, title: 'Events', subtitle: 'Advisor oversight of club events and registrations', accent: 'blue' }}
      tabs={tabs}
      events={allEvents}
      filterFn={filterFn}
      stats={stats}
      sidebarCta={SIDEBAR_CTA}
      rowProps={{ showRegs: true }}
      getDetailProps={getDetailProps}
    />
  );
}
