'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar, Bell, CheckCircle, Flame, Clock, MapPin,
  Lock, Trophy, Check, ChevronRight, BookOpen, Target,
  User, Award, ArrowRight, TrendingUp, Star, Zap,
  Sparkles, Pin, AlertTriangle, Info,
} from 'lucide-react';
import {
  PageShell, PageHeader, GlassCard, SectionHeader,
  StatCard, Pill, GradientBar, ActionButton, Avatar, EmptyState,
} from './_ui';

// ─── Fallback data (shown when DB returns empty) ───────────────────────────────

const FALLBACK_EVENTS = [
  {
    id: 'fe1', title: 'Web Development Workshop', category: 'Workshop',
    start_date: new Date(Date.now() + 3 * 86400000).toISOString(),
    location: 'CSE Lab-B', venue_type: 'offline', status: 'upcoming',
  },
  {
    id: 'fe2', title: 'Competitive Programming Contest #12', category: 'Contest',
    start_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    location: 'Online', venue_type: 'online', status: 'upcoming',
  },
  {
    id: 'fe3', title: 'Advanced Algorithms Bootcamp', category: 'Bootcamp',
    start_date: new Date(Date.now() + 8 * 86400000).toISOString(),
    location: 'CSE Lab-A', venue_type: 'offline', status: 'upcoming',
  },
];

const FALLBACK_REGISTRATIONS = [
  {
    id: 'fr1', status: 'attended', attended: true,
    registered_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    events: { title: 'JavaScript Fundamentals', start_date: new Date(Date.now() - 10 * 86400000).toISOString() },
  },
  {
    id: 'fr2', status: 'attended', attended: true,
    registered_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    events: { title: 'Git & GitHub Workshop', start_date: new Date(Date.now() - 15 * 86400000).toISOString() },
  },
  {
    id: 'fr3', status: 'registered', attended: false,
    registered_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    events: { title: 'Intro to Competitive Programming', start_date: new Date(Date.now() + 2 * 86400000).toISOString() },
  },
];

const FALLBACK_NOTICES = [
  {
    id: 'fn1', notice_type: 'event', is_pinned: false,
    title: 'Registration open: Web Dev Workshop',
    content: 'Registration is now open until Feb 21. Limited to 40 participants.',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'fn2', notice_type: 'general', is_pinned: true,
    title: 'New resource added: DP Cheatsheet',
    content: 'A comprehensive dynamic programming reference sheet is now available in Resources.',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'fn3', notice_type: 'deadline', is_pinned: false,
    title: 'NEUPC Monthly Contest #27 starts soon',
    content: 'Starts May 24, 20:00 BDT on Codeforces — 2.5 hours, 6 problems.',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const isPast = (iso) => iso && new Date(iso) < new Date();

const NOTICE_ICON = {
  event: Calendar, general: Info, urgent: AlertTriangle,
  deadline: Flame, achievement: Trophy,
};
const NOTICE_TONE = {
  event: 'blue', general: 'gray', urgent: 'rose', deadline: 'amber', achievement: 'amber',
};

// ─── Hero ──────────────────────────────────────────────────────────────────────

function GuestHero({ userName, stats }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gray-900 p-6 sm:p-8"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-8 left-1/3 h-40 w-40 rounded-full bg-violet-500/8 blur-2xl" />
      </div>

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={userName} size="xl" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/20 text-[9px] font-bold text-indigo-300">G</span>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-indigo-400">Welcome back</p>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{userName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Pill tone="violet">Guest account</Pill>
              <Pill tone="gray"><Trophy className="h-3 w-3" /> {stats.attended} attended</Pill>
              <Pill tone="gray"><Flame className="h-3 w-3" /> {stats.upcoming} upcoming</Pill>
            </div>
          </div>
        </div>

        <div className="min-w-65 shrink-0 rounded-xl border border-white/8 bg-white/2 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-200">Membership application</span>
            <span className="font-mono text-lg font-bold text-white">0/4</span>
          </div>
          <GradientBar value={0} max={4} tone="indigo" />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">Not started · ~3 min</span>
            <Link href="/account/guest/membership-application" className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300">
              Apply now <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function GuestDashboardClient({ user, events = [], registrations = [], notices = [] }) {
  const displayEvents = events.length ? events : FALLBACK_EVENTS;
  const displayRegistrations = registrations.length ? registrations : FALLBACK_REGISTRATIONS;
  const displayNotices = notices.length ? notices : FALLBACK_NOTICES;

  const userName = user?.full_name?.split(' ')[0] || 'Guest';

  const upcomingEvents = displayEvents.filter((e) => !isPast(e.start_date)).slice(0, 3);
  const attended = displayRegistrations.filter((r) => r.attended || r.status === 'attended');
  const registered = displayRegistrations.filter((r) => ['registered', 'confirmed'].includes(r.status) && !isPast(r.events?.start_date));
  const recentAttendance = attended.slice(0, 3);

  const stats = {
    registered: displayRegistrations.length,
    upcoming: upcomingEvents.length,
    attended: attended.length,
    notices: displayNotices.length,
  };

  const STAT_DEFS = [
    { key: 'registered', icon: Calendar, label: 'Registered', sublabel: 'active events', accent: 'blue', delay: 0 },
    { key: 'attended', icon: CheckCircle, label: 'Attended', sublabel: 'total events', accent: 'emerald', delay: 0.05 },
    { key: 'upcoming', icon: Flame, label: 'Upcoming', sublabel: 'events ahead', accent: 'amber', delay: 0.1 },
    { key: 'notices', icon: Bell, label: 'Notices', sublabel: 'club updates', accent: 'violet', delay: 0.15 },
  ];

  const memberPerks = [
    { icon: Zap, label: 'Contest participation & rankings' },
    { icon: TrendingUp, label: 'Performance analytics' },
    { icon: Star, label: 'Achievement badges' },
    { icon: BookOpen, label: 'Exclusive resources & editorials' },
  ];

  const quickActions = [
    { id: 1, label: 'Profile Settings', icon: User, href: '/account/guest/profile' },
    { id: 2, label: 'My Participation', icon: Award, href: '/account/guest/participation' },
    { id: 3, label: 'Browse Events', icon: Calendar, href: '/account/guest/events' },
  ];

  return (
    <PageShell>
      <GuestHero userName={userName} stats={stats} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_DEFS.map((s) => (
          <StatCard key={s.key} icon={s.icon} label={s.label} value={stats[s.key]} sublabel={s.sublabel} accent={s.accent} delay={s.delay} />
        ))}
      </div>

      {/* Upcoming events + Recent notices */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <GlassCard padding="p-0" className="overflow-hidden">
          <div className="p-5 pb-0">
            <SectionHeader icon={Calendar} title="Upcoming events" accent="blue"
              action={<ActionButton href="/account/guest/events" tone="ghost"><ChevronRight className="h-3.5 w-3.5" /></ActionButton>}
            />
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState icon={Calendar} title="No upcoming events" description="Check back soon." accent="blue" />
            </div>
          ) : (
            <div className="divide-y divide-white/4">
              {upcomingEvents.map((e) => {
                const isRegistered = displayRegistrations.some((r) => r.events?.title === e.title || r.event_id === e.id);
                return (
                  <div key={e.id} className="flex items-center gap-3.5 px-5 py-3.5">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-white/6 bg-white/2">
                      <span className="text-[9px] font-medium uppercase tracking-wide text-gray-500">{fmtDate(e.start_date).split(' ')[0]}</span>
                      <span className="text-sm font-bold text-white">{fmtDate(e.start_date).split(' ')[1]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-gray-100">{e.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11.5px] text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtTime(e.start_date)}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location || 'TBD'}</span>
                        {e.category && <Pill tone="gray">{e.category}</Pill>}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isRegistered
                        ? <Pill tone="emerald"><Check className="h-3 w-3" /> Registered</Pill>
                        : <ActionButton href="/account/guest/events" tone="primary">Register</ActionButton>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard padding="p-0" className="overflow-hidden">
          <div className="p-5 pb-0">
            <SectionHeader icon={Bell} title="Recent notices" accent="violet"
              action={<ActionButton href="/account/guest/notifications" tone="ghost"><ChevronRight className="h-3.5 w-3.5" /></ActionButton>}
            />
          </div>
          <div className="divide-y divide-white/4">
            {displayNotices.slice(0, 3).map((n) => {
              const Ico = NOTICE_ICON[n.notice_type] ?? Info;
              const tone = NOTICE_TONE[n.notice_type] ?? 'gray';
              return (
                <div key={n.id} className="relative flex items-start gap-3 px-5 py-3">
                  {n.is_pinned && (
                    <span aria-hidden className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-indigo-500" />
                  )}
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/6 bg-white/2 text-gray-500`}>
                    <Ico className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-gray-200 line-clamp-1">{n.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11.5px] text-gray-500">{n.content}</p>
                    <p className="mt-1 font-mono text-[10.5px] text-gray-600">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Membership CTA + Recent attendance */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <GlassCard>
          <SectionHeader icon={Sparkles} title="Membership application" accent="indigo" action={<Pill tone="amber">Not started</Pill>} />
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[13px] font-medium text-gray-200">You&apos;re 0% applied</p>
              <p className="mt-0.5 text-[11.5px] text-gray-500">Takes ~3 minutes · 4 short steps</p>
            </div>
            <span className="font-mono text-xl font-bold text-white">0/4</span>
          </div>
          <GradientBar value={0} max={4} tone="indigo" />
          <div className="mt-4 grid grid-cols-4 gap-2">
            {['Basics', 'Academic', 'Profiles', 'Review'].map((s, i) => (
              <div key={s} className="rounded-lg border border-white/6 bg-white/2 px-2.5 py-2 text-center">
                <span className="block font-mono text-[9.5px] text-gray-600">0{i + 1}</span>
                <span className="text-[11px] text-gray-400">{s}</span>
              </div>
            ))}
          </div>
          <ActionButton href="/account/guest/membership-application" tone="primary" className="mt-4 w-full justify-center" icon={ChevronRight}>
            Start application
          </ActionButton>
        </GlassCard>

        <GlassCard padding="p-0" className="overflow-hidden">
          <div className="p-5 pb-0">
            <SectionHeader icon={Trophy} title="Recent attendance" accent="amber"
              action={<ActionButton href="/account/guest/participation" tone="ghost"><ChevronRight className="h-3.5 w-3.5" /></ActionButton>}
            />
          </div>
          {recentAttendance.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState icon={Trophy} title="No attendance yet" description="Register for events to get started." accent="amber" />
            </div>
          ) : (
            <div className="divide-y divide-white/4">
              {recentAttendance.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-gray-200">{r.events?.title ?? 'Event'}</p>
                    <p className="font-mono text-[11px] text-gray-600">{fmtDate(r.events?.start_date || r.registered_at)}</p>
                  </div>
                  <span title="Certificate available for members" className="cursor-help">
                    <Pill tone="gray"><Lock className="h-3 w-3" /> Cert</Pill>
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Member perks banner */}
      <GlassCard className="border-indigo-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-indigo-950/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex-1">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">Upgrade to membership</p>
            <h3 className="text-[15px] font-semibold text-white">Unlock the full NEUPC experience</h3>
            <p className="mt-1 text-[12.5px] text-gray-400">Contest rankings, bootcamps, performance analytics, and exclusive resources.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {memberPerks.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-[12px] text-gray-300">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-indigo-400" /> {label}
                </div>
              ))}
            </div>
          </div>
          <ActionButton href="/account/guest/membership-application" tone="indigo" icon={ArrowRight} className="shrink-0">
            Apply for membership
          </ActionButton>
        </div>
      </GlassCard>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        {quickActions.map((a) => (
          <Link key={a.id} href={a.href} className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-gray-900 px-4 py-3.5 transition-all hover:border-white/[0.14] hover:bg-white/2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/6 bg-white/2 text-gray-400 transition-colors group-hover:text-gray-200">
              <a.icon className="h-4 w-4" />
            </div>
            <span className="flex-1 text-[13px] font-medium text-gray-200">{a.label}</span>
            <ChevronRight className="h-4 w-4 text-gray-600 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
