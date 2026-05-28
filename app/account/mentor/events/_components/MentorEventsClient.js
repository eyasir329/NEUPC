'use client';

import { useMemo } from 'react';
import { Calendar, CalendarCheck, TrendingUp, Sparkles, Users } from 'lucide-react';
import { GlassCard } from '@/app/account/member/_components/_ui';
import EventListLayout from '@/app/account/_components/events/EventListLayout';
import EventContentDetail from '@/app/account/_components/events/EventContentDetail';
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
      <p className="text-[13px] font-semibold text-white">Club Events</p>
    </div>
    <p className="text-[12px] text-gray-400">
      Stay updated with upcoming workshops, contests, and mentoring sessions for your mentees.
    </p>
  </GlassCard>
);

export default function MentorEventsClient({ events: serverEvents }) {
  const allEvents = useMemo(() => (serverEvents || []).map(enrichEvent), [serverEvents]);
  const stats = computeStats('observer', allEvents);
  const tabs = TABS_BASE.map((t) => ({ ...t, count: allEvents.filter((e) => filterFn(e, t.value)).length }));

  return (
    <EventListLayout
      pageHeader={{ icon: Calendar, title: 'Events', subtitle: 'Club events and activities relevant to you and your mentees', accent: 'blue' }}
      tabs={tabs}
      events={allEvents}
      filterFn={filterFn}
      stats={stats}
      sidebarCta={SIDEBAR_CTA}
      rowProps={{ showRegs: true }}
      renderDetail={(event, onBack) => (
        <EventContentDetail
          event={event}
          onBack={onBack}
          rightSlot={
            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-900 transition-colors hover:border-white/[0.12]">
                <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-3">
                  <Users className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Registrations</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                      <p className="text-2xl font-bold text-white tabular-nums">{event.registrationCount ?? 0}</p>
                      <p className="text-[10px] text-gray-500">Registered</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                      <p className="text-2xl font-bold text-white tabular-nums">{event.attendedCount ?? 0}</p>
                      <p className="text-[10px] text-gray-500">Attended</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-900 transition-colors hover:border-white/[0.12]">
                <div className="border-b border-white/[0.08] px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Event Info</span>
                </div>
                <div className="divide-y divide-white/[0.06]">
                  {[
                    { label: 'Category', value: event.category || '—' },
                    { label: 'Venue',    value: event.venue_type ? event.venue_type.charAt(0).toUpperCase() + event.venue_type.slice(1) : '—' },
                    { label: 'Access',   value: 'Club Members' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.02]">
                      <span className="shrink-0 text-xs text-gray-500">{label}</span>
                      <span className="text-right text-xs font-semibold text-gray-200">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        />
      )}
    />
  );
}
