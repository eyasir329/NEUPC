'use client';

import { useMemo } from 'react';
import { Calendar, CalendarCheck, TrendingUp, Sparkles } from 'lucide-react';
import { GlassCard, ActionButton } from '@/app/account/member/_components/_ui';
import EventListLayout from '@/app/account/_components/events/EventListLayout';
import EventContentDetail from '@/app/account/_components/events/EventContentDetail';
import { enrichEvent } from '@/app/account/_components/events/eventUtils';
import { computeStats } from '@/app/account/_components/events/eventConstants';

const FALLBACK_EVENTS = [
  { id: 'fe1', title: 'Web Development Workshop', category: 'Workshop', start_date: new Date(Date.now() + 3 * 86400000).toISOString(), location: 'CSE Lab-B', description: 'A hands-on workshop covering modern web development techniques including React, Next.js, and Tailwind CSS. Open to all students.' },
  { id: 'fe2', title: 'Competitive Programming Contest #12', category: 'Contest', start_date: new Date(Date.now() + 5 * 86400000).toISOString(), location: 'Online', description: 'Monthly competitive programming round hosted on Codeforces. Duration: 2.5 hours, 6 problems across various difficulty levels.' },
  { id: 'fe3', title: 'Advanced Algorithms Bootcamp', category: 'Bootcamp', start_date: new Date(Date.now() + 10 * 86400000).toISOString(), location: 'CSE Lab-A', description: 'A 3-day intensive bootcamp on advanced algorithms: graph theory, segment trees, and dynamic programming optimisations.' },
  { id: 'fe4', title: 'Git & GitHub for Beginners', category: 'Workshop', start_date: new Date(Date.now() + 14 * 86400000).toISOString(), location: 'Room 301', description: 'Learn version control fundamentals with Git and collaboration workflows on GitHub. No prior experience required.' },
  { id: 'fe5', title: 'JavaScript Fundamentals', category: 'Seminar', start_date: new Date(Date.now() - 12 * 86400000).toISOString(), location: 'Auditorium', description: 'An introductory seminar on JavaScript covering variables, functions, DOM manipulation, and async programming.' },
  { id: 'fe6', title: 'NEUPC Hackathon 2025', category: 'Hackathon', start_date: new Date(Date.now() - 20 * 86400000).toISOString(), location: 'Innovation Hub', description: '24-hour hackathon focused on building solutions for local community problems. Teams of 2–4 members.' },
];

const TABS = [
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

const MEMBERSHIP_CTA = (
  <GlassCard className="border-violet-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-violet-950/30">
    <div className="mb-3 flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-violet-400" />
      <p className="text-[13px] font-semibold text-white">Unlock more events</p>
    </div>
    <p className="mb-3 text-[12px] text-gray-400">
      Members get bootcamps, mentor sessions, and post-event recordings.
    </p>
    <ActionButton href="/account/guest/membership-application" tone="indigo" className="w-full justify-center">
      <Sparkles className="h-3.5 w-3.5" /> Apply for membership
    </ActionButton>
  </GlassCard>
);

const MEMBER_BENEFITS_CARD = (
  <GlassCard className="border-indigo-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-indigo-950/30">
    <div className="mb-3 flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-indigo-400" />
      <p className="text-[13px] font-semibold text-white">Member-only benefits</p>
    </div>
    <p className="mb-3 text-[12px] text-gray-400">
      Priority registration, exclusive materials, and post-event recordings.
    </p>
    <ActionButton href="/account/guest/membership-application" tone="indigo" className="w-full justify-center">
      Apply for membership
    </ActionButton>
  </GlassCard>
);

export default function GuestEventsClient({ events: serverEvents }) {
  const source = serverEvents?.length > 0 ? serverEvents : FALLBACK_EVENTS;

  const allEvents = useMemo(() => source.map(enrichEvent), [source]);

  const stats = computeStats('guest', allEvents);

  const tabs = TABS.map((t) => ({
    ...t,
    count: allEvents.filter((e) => filterFn(e, t.value)).length,
  }));

  return (
    <EventListLayout
      pageHeader={{ icon: Calendar, title: 'Events', subtitle: 'Discover upcoming contests, workshops and bootcamps', accent: 'blue' }}
      tabs={tabs}
      events={allEvents}
      filterFn={filterFn}
      stats={stats}
      sidebarCta={MEMBERSHIP_CTA}
      renderDetail={(event, onBack) => (
        <EventContentDetail
          event={event}
          onBack={onBack}
          rightSlot={MEMBER_BENEFITS_CARD}
        />
      )}
    />
  );
}
