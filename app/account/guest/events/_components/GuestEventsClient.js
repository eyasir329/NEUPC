/**
 * @file Guest events client component
 * @module GuestEventsClient
 */

'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CalendarCheck,
  CheckCircle,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  XCircle,
  Loader2,
  X,
} from 'lucide-react';
import { registerForEventAction } from '@/app/_lib/actions/member-events-actions';
import { GlassCard, ActionButton } from '@/app/account/_components/ui';
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
      className={`fixed top-6 right-4 left-4 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm shadow-2xl backdrop-blur-xl sm:right-6 sm:left-auto sm:max-w-md ${
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

function RegisterCta({ event, onFlash, onRegistered }) {
  const [pending, startTransition] = useTransition();
  const canRegister =
    event._bucket !== 'completed' && event._userStatus !== 'Registered';

  const handle = () => {
    if (!canRegister) return;
    startTransition(async () => {
      const res = await registerForEventAction(event.id);
      if (res.error) onFlash({ type: 'error', text: res.error });
      else {
        onFlash({ type: 'success', text: `Registered for "${event.title}"!` });
        onRegistered(event.id);
      }
    });
  };

  if (event._bucket === 'completed') return null;

  return (
    <button
      onClick={handle}
      disabled={pending || !canRegister}
      className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
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

const TABS = [
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

const MEMBERSHIP_CTA = (
  <GlassCard className="border-violet-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-violet-950/30">
    <div className="mb-3 flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-violet-400" />
      <p className="text-[13px] font-semibold text-white">Unlock more events</p>
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
);

const MEMBER_BENEFITS_CARD = (
  <GlassCard className="border-indigo-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-indigo-950/30">
    <div className="mb-3 flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-indigo-400" />
      <p className="text-[13px] font-semibold text-white">
        Member-only benefits
      </p>
    </div>
    <p className="mb-3 text-[12px] text-gray-400">
      Priority registration, exclusive materials, and post-event recordings.
    </p>
    <ActionButton
      href="/account/guest/membership-application"
      tone="indigo"
      className="w-full justify-center"
    >
      Apply for membership
    </ActionButton>
  </GlassCard>
);

export default function GuestEventsClient({
  events: serverEvents,
  myRegistrations,
}) {
  const [flash, setFlash] = useState(null);
  // Event ids registered in this session (optimistic, on top of server data)
  const [justRegistered, setJustRegistered] = useState(() => new Set());

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
      _userStatus:
        regMap[e.id] || justRegistered.has(e.id) ? 'Registered' : null,
    }));
  }, [serverEvents, myRegistrations, justRegistered]);

  const stats = computeStats('guest', allEvents);

  const tabs = TABS.map((t) => ({
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
      sidebarCta={MEMBERSHIP_CTA}
      renderDetail={(event, onBack) => (
        <EventContentDetail
          event={event}
          onBack={onBack}
          topSlot={
            <RegisterCta
              event={event}
              onFlash={setFlash}
              onRegistered={(id) =>
                setJustRegistered((prev) => new Set(prev).add(id))
              }
            />
          }
          rightSlot={MEMBER_BENEFITS_CARD}
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
