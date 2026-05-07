/**
 * @file Member Events Client — restyled with shared `_ui` primitives
 *   to mirror the problem-solving page design language.
 * @module MemberEventsClient
 */

'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Ticket,
  Loader2,
  X,
  ChevronRight,
  Trophy,
  GraduationCap,
  Mic,
  Code2,
  Sparkles,
} from 'lucide-react';
import {
  registerForEventAction,
  cancelEventRegistrationAction,
} from '@/app/_lib/member-events-actions';
import {
  PageHeader,
  GlassCard,
  StatCard,
  TabBar,
  EmptyState,
  Pill,
  GradientBar,
} from '../../_components/_ui';
import { motion, AnimatePresence } from 'framer-motion';

const now = new Date();
const d = (daysOffset, h = 10) => {
  const t = new Date(now);
  t.setDate(t.getDate() + daysOffset);
  t.setHours(h, 0, 0, 0);
  return t.toISOString();
};

const MOCK_EVENTS = [
  { id: 'ev-1', title: 'React 19 & Server Components Deep-dive', description: 'Hands-on with concurrent rendering, Suspense boundaries, and the new server-component model. Bring a laptop with Node 20.', kind: 'Workshop', tone: 'violet', icon: Code2, start_date: d(2, 14), duration: '3h', location: 'Lab 301 · CSE Building', host: 'Shafin Rahman', max_participants: 30, registration_count: 24, registered: false },
  { id: 'ev-2', title: 'Inter-University Hackathon 2026', description: '24-hour hackathon · teams of 2-4 · BDT 50,000 prize pool. Sponsored by Brain Station 23.', kind: 'Hackathon', tone: 'amber', icon: Trophy, start_date: d(8, 9), duration: '24h', location: 'Main Auditorium', host: 'NEUPC Board', max_participants: 80, registration_count: 67, registered: true },
  { id: 'ev-3', title: 'Git, GitHub & CI/CD Mastery', description: 'From branching strategies to GitHub Actions pipelines. Live demo of deploying a Next.js app to Vercel.', kind: 'Seminar', tone: 'blue', icon: Mic, start_date: d(14, 14), duration: '2h', location: 'Online · Zoom', host: 'Raisa Hossain', max_participants: 100, registration_count: 63, registered: false },
  { id: 'ev-4', title: 'CTF Competition · Season 3', description: 'Capture-the-Flag cybersecurity challenge. Beginner-friendly tracks · prizes for top 3 teams.', kind: 'Contest', tone: 'rose', icon: Trophy, start_date: d(21, 13), duration: '6h', location: 'CSE Building · Room 408', host: 'Security SIG', max_participants: 50, registration_count: 50, registered: false },
  { id: 'ev-5', title: 'AI/ML for Competitive Programmers', description: 'Use ML to find patterns in problem datasets. Practical PyTorch session.', kind: 'Workshop', tone: 'emerald', icon: Sparkles, start_date: d(27, 11), duration: '4h', location: 'Lab 405', host: 'Tanvir Ahmed', max_participants: 40, registration_count: 18, registered: true },
  { id: 'ev-6', title: 'Spring Bootcamp Cohort 5', description: 'Six-week structured program covering full-stack JavaScript, system design, and behavioural interviews.', kind: 'Bootcamp', tone: 'cyan', icon: GraduationCap, start_date: d(35, 10), duration: '6 weeks', location: 'Hybrid', host: 'Mehedi Hasan', max_participants: 60, registration_count: 42, registered: false },
];

const MOCK_PAST_EVENTS = [
  { id: 'pev-1', title: 'Python Bootcamp · Cohort 4', kind: 'Bootcamp', tone: 'cyan', start_date: d(-30), attended: true },
  { id: 'pev-2', title: 'Open Source Contribution Day', kind: 'Workshop', tone: 'violet', start_date: d(-45), attended: true },
  { id: 'pev-3', title: 'UI/UX Design Fundamentals', kind: 'Seminar', tone: 'blue', start_date: d(-60), attended: false },
  { id: 'pev-4', title: 'NEUPC Monthly Contest #26', kind: 'Contest', tone: 'rose', start_date: d(-75), attended: true },
  { id: 'pev-5', title: 'Resume & LinkedIn Workshop', kind: 'Workshop', tone: 'amber', start_date: d(-90), attended: true },
];

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
const fmtMonth = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
const fmtDay = (iso) => new Date(iso).getDate();
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const isPast = (iso) => (iso ? new Date(iso) < new Date() : false);

function RSVPButton({ event, registered, onDone }) {
  const [pending, startTransition] = useTransition();
  const isFull =
    event.max_participants &&
    event.registration_count >= event.max_participants &&
    !registered;

  const register = () =>
    startTransition(async () => {
      const res = await registerForEventAction(event.id);
      onDone(res.error ? { type: 'error', text: res.error } : { type: 'success', text: `Registered for "${event.title}"!` });
    });

  if (registered) {
    return (
      <Pill tone="emerald" icon={CheckCircle2}>
        Registered
      </Pill>
    );
  }
  if (isFull) {
    return <Pill tone="gray">Full</Pill>;
  }
  return (
    <button
      type="button"
      onClick={register}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300 transition hover:border-blue-500/50 hover:bg-blue-500/20 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ticket className="h-3 w-3" />}
      Register
    </button>
  );
}

function EventCard({ event, onFlash, delay = 0 }) {
  const Icon = event.icon ?? Calendar;
  const filled = event.max_participants
    ? Math.min(100, Math.round((event.registration_count / event.max_participants) * 100))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
    >
      <div className="flex items-start gap-3 border-b border-white/[0.05] p-4">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
          <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
            {fmtMonth(event.start_date)}
          </span>
          <span className="font-mono text-xl font-bold text-white tabular-nums leading-none">
            {fmtDay(event.start_date)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Pill tone={event.tone} icon={Icon}>
              {event.kind}
            </Pill>
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-blue-300">
            {event.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="line-clamp-2 text-[12px] leading-relaxed text-gray-400">
          {event.description}
        </p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {fmtTime(event.start_date)}
            {event.duration ? ` · ${event.duration}` : ''}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {event.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" /> {event.host}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between text-[10px] text-gray-500">
              <span>
                {event.registration_count}/{event.max_participants ?? '∞'} attending
              </span>
              <span className="font-mono tabular-nums">{filled}%</span>
            </div>
            {event.max_participants && (
              <GradientBar
                value={filled}
                tone={filled >= 90 ? 'rose' : filled >= 70 ? 'amber' : 'blue'}
                height="h-1"
              />
            )}
          </div>
          <RSVPButton event={event} registered={event.registered} onDone={onFlash} />
        </div>
      </div>
    </motion.div>
  );
}

function Flash({ msg, onClose }) {
  const isErr = msg.type === 'error';
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
        isErr
          ? 'border-rose-500/25 bg-rose-500/10 text-rose-300'
          : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
      }`}
    >
      {isErr ? <XCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
      <span className="flex-1">{msg.text}</span>
      <button onClick={onClose} type="button">
        <X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" />
      </button>
    </motion.div>
  );
}

export default function MemberEventsClient({ events: serverEvents, myRegistrations }) {
  const useMock = !serverEvents || serverEvents.length === 0;
  const [tab, setTab] = useState('all');
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(id);
  }, [flash]);

  const allEvents = useMemo(() => {
    if (useMock) return MOCK_EVENTS;
    const regMap = {};
    for (const r of myRegistrations || []) {
      if (r.event_id) regMap[r.event_id] = r.status !== 'cancelled';
    }
    return serverEvents.map((e) => ({
      ...e,
      tone: 'violet',
      icon: Calendar,
      kind: e.category || e.kind || 'Event',
      registered: !!regMap[e.id],
    }));
  }, [serverEvents, myRegistrations, useMock]);

  const pastEvents = useMock ? MOCK_PAST_EVENTS : allEvents.filter((e) => isPast(e.start_date));
  const upcoming = allEvents.filter((e) => !isPast(e.start_date));
  const registered = upcoming.filter((e) => e.registered);
  const available = upcoming.filter((e) => !e.registered);

  const tabs = [
    { value: 'all', label: 'All upcoming', icon: Calendar, count: upcoming.length },
    { value: 'registered', label: 'Registered', icon: CheckCircle2, count: registered.length },
    { value: 'available', label: 'Open', icon: Ticket, count: available.length },
    { value: 'past', label: 'Past', icon: CalendarDays, count: pastEvents.length },
  ];

  const display =
    tab === 'all' ? upcoming :
    tab === 'registered' ? registered :
    tab === 'available' ? available :
    [];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Calendar}
        title="Events"
        subtitle="Workshops, contests, hackathons, and bootcamps you can join"
        accent="blue"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Calendar} label="Upcoming" value={upcoming.length} sublabel="Open events" accent="blue" delay={0} />
        <StatCard icon={CheckCircle2} label="Registered" value={registered.length} sublabel="Your seat saved" accent="emerald" delay={0.05} />
        <StatCard icon={Ticket} label="Open Slots" value={available.length} sublabel="Available now" accent="violet" delay={0.1} />
        <StatCard icon={CalendarDays} label="Attended" value={pastEvents.filter((e) => e.attended).length} sublabel="Past events" accent="amber" delay={0.15} />
      </div>

      <AnimatePresence>
        {flash && <Flash msg={flash} onClose={() => setFlash(null)} />}
      </AnimatePresence>

      <TabBar tabs={tabs} value={tab} onChange={setTab} />

      {tab !== 'past' &&
        (display.length === 0 ? (
          <GlassCard padding="p-0">
            <EmptyState
              icon={CalendarDays}
              title="No events to show"
              description="Try switching tabs or check back later."
              accent="blue"
            />
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {display.map((event, i) => (
              <EventCard key={event.id} event={event} onFlash={setFlash} delay={i * 0.04} />
            ))}
          </div>
        ))}

      {tab === 'past' && (
        <GlassCard padding="p-0">
          {pastEvents.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No past events" accent="gray" />
          ) : (
            pastEvents.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02] ${
                  i < pastEvents.length - 1 ? 'border-b border-white/[0.04]' : ''
                }`}
              >
                {e.attended ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-gray-600" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-200">{e.title}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {fmtDate(e.start_date)} · {e.kind}
                  </p>
                </div>
                <Pill tone={e.tone}>{e.kind}</Pill>
                <Pill tone={e.attended ? 'emerald' : 'gray'}>
                  {e.attended ? 'Attended' : 'Missed'}
                </Pill>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-600" />
              </motion.div>
            ))
          )}
        </GlassCard>
      )}
    </div>
  );
}
