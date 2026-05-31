/**
 * @file Member events client component
 * @module MemberEventsClient
 */

'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCircle,
  CalendarCheck,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { registerForEventAction } from '@/app/_lib/actions/member-events-actions';
import { GlassCard } from '@/app/account/_components/ui';
import EventListLayout from '@/app/account/_components/events/EventListLayout';
import EventContentDetail from '@/app/account/_components/events/EventContentDetail';
import { enrichEvent } from '@/app/account/_components/events/eventUtils';
import { computeStats } from '@/app/account/_components/events/eventConstants';

// ─── Flash toast ───────────────────────────────────────────────────────────────

function Flash({ msg, onClose }) {
  const isErr = msg.type === 'error';
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm shadow-2xl backdrop-blur-xl ${
        isErr
          ? 'border-rose-500/30 bg-rose-950/80 text-rose-200'
          : 'border-emerald-500/30 bg-emerald-950/80 text-emerald-200'
      }`}
    >
      {isErr ? (
        <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
      ) : (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
      )}
      <span className="flex-1 font-semibold tracking-wide">{msg.text}</span>
      <button
        onClick={onClose}
        type="button"
        className="ml-2 transition-transform hover:scale-110"
      >
        <X className="h-4 w-4 opacity-70 hover:opacity-100" />
      </button>
    </motion.div>
  );
}

// ─── Register CTA ──────────────────────────────────────────────────────────────

function RegisterCta({ event, onFlash }) {
  const [pending, startTransition] = useTransition();
  const canRegister =
    event._bucket !== 'completed' && event._userStatus !== 'Registered';

  const handle = () => {
    if (!canRegister) return;
    startTransition(async () => {
      const res = await registerForEventAction(event.id);
      if (res.error) onFlash({ type: 'error', text: res.error });
      else
        onFlash({ type: 'success', text: `Registered for "${event.title}"!` });
    });
  };

  if (event._bucket === 'completed') return null;

  return (
    <button
      onClick={handle}
      disabled={pending || !canRegister}
      className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500 active:scale-95 disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
      ) : event._userStatus === 'Registered' ? (
        'Registered ✓'
      ) : (
        'Register Now'
      )}
    </button>
  );
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TABS_BASE = [
  { value: 'All', label: 'All Events', icon: Calendar },
  { value: 'Upcoming', label: 'Upcoming', icon: Calendar },
  { value: 'Ongoing', label: 'Ongoing', icon: TrendingUp },
  { value: 'Completed', label: 'Completed', icon: CalendarCheck },
  { value: 'Registered', label: 'Registered', icon: CheckCircle },
];

function filterFn(event, tab) {
  if (tab === 'All') return true;
  if (tab === 'Upcoming') return event._bucket === 'upcoming';
  if (tab === 'Ongoing') return event._bucket === 'ongoing';
  if (tab === 'Completed') return event._bucket === 'completed';
  if (tab === 'Registered') return event._userStatus === 'Registered';
  return true;
}

const SIDEBAR_CTA = (
  <GlassCard className="border-violet-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-violet-950/30">
    <div className="mb-3 flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-violet-400" />
      <p className="text-[13px] font-semibold text-white">What&apos;s next?</p>
    </div>
    <p className="text-[12px] text-gray-400">
      Stay updated with the latest events and member networking opportunities.
    </p>
  </GlassCard>
);

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function MemberEventsClient({
  events: serverEvents,
  myRegistrations,
}) {
  const [flash, setFlash] = useState(null);
  // Event id from a ?event= deep link (e.g. from the Daily Activity feed).
  const [initialEventId, setInitialEventId] = useState(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('event');
    if (id) setInitialEventId(id);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 5000);
    return () => clearTimeout(id);
  }, [flash]);

  const allEvents = useMemo(() => {
    const regMap = {};
    for (const r of myRegistrations || []) {
      if (r.event_id) regMap[r.event_id] = r.status !== 'cancelled';
    }
    return (serverEvents || []).map((e) => ({
      ...enrichEvent(e),
      _userStatus: regMap[e.id] ? 'Registered' : null,
    }));
  }, [serverEvents, myRegistrations]);

  const stats = computeStats('member', allEvents);

  const tabs = TABS_BASE.map((t) => ({
    ...t,
    count: allEvents.filter((e) => filterFn(e, t.value)).length,
  }));

  return (
    <EventListLayout
      pageHeader={{
        icon: Calendar,
        title: 'Events',
        subtitle:
          'Discover and register for upcoming contests, workshops and bootcamps',
        accent: 'blue',
      }}
      tabs={tabs}
      events={allEvents}
      filterFn={filterFn}
      stats={stats}
      sidebarCta={SIDEBAR_CTA}
      initialEventId={initialEventId}
      renderDetail={(event, onBack) => (
        <EventContentDetail
          event={event}
          onBack={onBack}
          topSlot={<RegisterCta event={event} onFlash={setFlash} />}
          rightSlot={
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-900">
              <div className="border-b border-white/[0.08] px-4 py-3">
                <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  Your Registration
                </span>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {[
                  {
                    label: 'Status',
                    value:
                      event._userStatus === 'Registered'
                        ? 'Registered ✓'
                        : event._bucket === 'completed'
                          ? 'Past'
                          : 'Open',
                    highlight:
                      event._userStatus === 'Registered'
                        ? 'text-emerald-400'
                        : event._bucket === 'upcoming'
                          ? 'text-indigo-300'
                          : 'text-gray-400',
                  },
                  {
                    label: 'Access',
                    value: 'Members Only',
                    highlight: 'text-gray-200',
                  },
                  ...(event.max_participants
                    ? [
                        {
                          label: 'Capacity',
                          value: `${event.registrationCount ?? 0} / ${event.max_participants}`,
                          highlight: 'text-gray-200',
                        },
                      ]
                    : []),
                ].map(({ label, value, highlight }) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
                  >
                    <span className="shrink-0 text-xs text-gray-500">
                      {label}
                    </span>
                    <span
                      className={`text-right text-xs font-semibold ${highlight}`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          }
        />
      )}
      flashSlot={
        <AnimatePresence>
          {flash && <Flash msg={flash} onClose={() => setFlash(null)} />}
        </AnimatePresence>
      }
    />
  );
}
