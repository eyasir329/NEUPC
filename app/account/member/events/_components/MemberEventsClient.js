'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle, CalendarCheck, TrendingUp, CheckCircle2, XCircle, Loader2, X, Sparkles } from 'lucide-react';
import { registerForEventAction } from '@/app/_lib/member-events-actions';
import { GlassCard } from '@/app/account/member/_components/_ui';
import EventListLayout from '@/app/account/_components/events/EventListLayout';
import { enrichEvent, isPast } from '@/app/account/_components/events/eventUtils';
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
      {isErr
        ? <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
        : <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />}
      <span className="flex-1 font-semibold tracking-wide">{msg.text}</span>
      <button onClick={onClose} type="button" className="ml-2 hover:scale-110 transition-transform">
        <X className="h-4 w-4 opacity-70 hover:opacity-100" />
      </button>
    </motion.div>
  );
}

// ─── Register CTA ──────────────────────────────────────────────────────────────

function RegisterCta({ event, onFlash }) {
  const [pending, startTransition] = useTransition();
  const canRegister = event._bucket !== 'completed' && event._userStatus !== 'Registered';

  const handle = () => {
    if (!canRegister) return;
    startTransition(async () => {
      const res = await registerForEventAction(event.id);
      if (res.error) onFlash({ type: 'error', text: res.error });
      else onFlash({ type: 'success', text: `Registered for "${event.title}"!` });
    });
  };

  return (
    <div className="flex flex-col gap-2 w-full md:w-auto">
      <button
        onClick={handle}
        disabled={pending || !canRegister}
        className="w-full md:w-48 py-3 px-6 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-600/20 active:scale-95 transition-all disabled:opacity-50"
      >
        {pending
          ? <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          : event._bucket === 'completed'
          ? 'View Past Event'
          : event._userStatus === 'Registered'
          ? 'Registered ✓'
          : 'Register Now'}
      </button>
      <p className="text-center text-xs text-gray-500 font-medium">
        {event._userStatus === 'Registered' ? 'You have a confirmed ticket' : 'Secure your spot today'}
      </p>
    </div>
  );
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TABS_BASE = [
  { value: 'All',        label: 'All Events', icon: Calendar      },
  { value: 'Upcoming',   label: 'Upcoming',   icon: Calendar      },
  { value: 'Ongoing',    label: 'Ongoing',    icon: TrendingUp    },
  { value: 'Completed',  label: 'Completed',  icon: CalendarCheck },
  { value: 'Registered', label: 'Registered', icon: CheckCircle   },
];

function filterFn(event, tab) {
  if (tab === 'All')        return true;
  if (tab === 'Upcoming')   return event._bucket === 'upcoming';
  if (tab === 'Ongoing')    return event._bucket === 'ongoing';
  if (tab === 'Completed')  return event._bucket === 'completed';
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

export default function MemberEventsClient({ events: serverEvents, myRegistrations }) {
  const [flash, setFlash] = useState(null);

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
      pageHeader={{ icon: Calendar, title: 'Events', subtitle: 'Discover and register for upcoming contests, workshops and bootcamps', accent: 'blue' }}
      tabs={tabs}
      events={allEvents}
      filterFn={filterFn}
      stats={stats}
      sidebarCta={SIDEBAR_CTA}
      getDetailProps={(event) => ({
        detailRows: [
          { label: 'Status',   value: event._userStatus === 'Registered' ? 'Registered' : event._isUpcoming ? 'Open' : 'Past' },
          { label: 'Category', value: event._type },
          { label: 'Access',   value: 'Members Only', accent: 'text-emerald-400' },
        ],
        ctaSlot: <RegisterCta event={event} onFlash={setFlash} />,
      })}
      flashSlot={
        <AnimatePresence>
          {flash && <Flash msg={flash} onClose={() => setFlash(null)} />}
        </AnimatePresence>
      }
    />
  );
}
