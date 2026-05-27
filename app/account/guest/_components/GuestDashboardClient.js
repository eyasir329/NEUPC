'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Bell, CheckCircle, Flame, Clock, MapPin,
  Lock, Trophy, Check, ChevronRight, BookOpen, Target,
  User, Award, ArrowRight, TrendingUp, Star, Zap,
  Sparkles, Pin, AlertTriangle, Info, ShieldAlert,
  Loader2, ExternalLink, ShieldCheck,
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

// ─── Hero Component ────────────────────────────────────────────────────────────

function GuestHero({ userName, avatarUrl, stats, latestApplication }) {
  // Determine membership state
  const hasApp = !!latestApplication;
  const isPending = latestApplication?.status === 'pending';
  const isRejected = latestApplication?.status === 'rejected';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
    >
      {/* Decorative Glow Elements */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl opacity-60" />
        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl opacity-55" />
      </div>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* User Info Section */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <Avatar name={userName} src={avatarUrl} size="xl" />
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-500/20 text-[10px] font-black text-indigo-300 shadow-lg backdrop-blur-sm">G</span>
          </div>
          <div>
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-indigo-400">
              <Sparkles className="h-3 w-3 animate-pulse" /> Welcome back
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1 sm:text-4xl">{userName}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tone="violet" className="bg-violet-500/10 border-violet-500/20 text-violet-300 font-semibold px-3 py-1">Guest Account</Pill>
              <Pill tone="emerald" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-300 px-2.5 py-0.5"><Trophy className="h-3.5 w-3.5 mr-0.5" /> {stats.attended} Attended</Pill>
              <Pill tone="blue" className="bg-blue-500/10 border-blue-500/20 text-blue-300 px-2.5 py-0.5"><Flame className="h-3.5 w-3.5 mr-0.5" /> {stats.upcoming} Upcoming</Pill>
            </div>
          </div>
        </div>

        {/* Dynamic Stepper Card */}
        <div className="w-full lg:max-w-md shrink-0 rounded-2xl border border-white/10 bg-zinc-950/45 p-5 shadow-xl backdrop-blur-md">
          {isPending ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Clock className="h-4 w-4 animate-spin" /> Under Review
                </span>
                <span className="text-[11px] font-medium text-zinc-500">Submitted {fmtDate(latestApplication.created_at)}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-zinc-300 font-medium">
                Your full club membership request is being evaluated by the committee.
              </p>
              <div className="mt-1 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[11px] font-semibold text-zinc-500">Response in 2-3 business days</span>
                <Link href="/account/guest/membership-application" className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors">
                  Check details <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ) : isRejected ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                  <ShieldAlert className="h-4 w-4" /> Application Declined
                </span>
                <span className="text-[11px] font-medium text-zinc-500">Reviewed recently</span>
              </div>
              <p className="text-[13px] leading-relaxed text-zinc-300 font-medium line-clamp-1">
                {latestApplication.rejection_reason || 'Rejection reason not specified.'}
              </p>
              <div className="mt-1 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[11px] font-semibold text-rose-400/80">Re-apply at any time</span>
                <Link href="/account/guest/membership-application" className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 transition-all">
                  Re-apply Now <ArrowRight className="h-3 w-3 ml-0.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Club Membership Application</span>
                <span className="font-mono text-sm font-bold text-white bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-500/20">0/4 Steps</span>
              </div>
              <GradientBar value={0} max={4} tone="indigo" height="h-2" />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-500">Not started · Takes ~3 mins</span>
                <Link href="/account/guest/membership-application" className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                  Apply for Membership <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function GuestDashboardClient({
  user,
  events = [],
  registrations = [],
  notices = [],
  latestApplication,
}) {
  const displayEvents = events.length ? events : FALLBACK_EVENTS;
  const displayRegistrations = registrations.length ? registrations : FALLBACK_REGISTRATIONS;
  const displayNotices = notices.length ? notices : FALLBACK_NOTICES;

  const userName = user?.full_name?.split(' ')[0] || 'Guest';
  const isImage = user?.avatar_url && (user.avatar_url.startsWith('http') || user.avatar_url.startsWith('/api/image/'));
  const avatarUrl = isImage ? user.avatar_url : null;

  const upcomingEvents = displayEvents.filter((e) => !isPast(e.start_date)).slice(0, 3);
  const attended = displayRegistrations.filter((r) => r.attended || r.status === 'attended');
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
    { icon: TrendingUp, label: 'Performance analytics dashboard' },
    { icon: Star, label: 'Achievement badges & profiles' },
    { icon: BookOpen, label: 'Exclusive resources & editorials' },
  ];

  const quickActions = [
    { id: 1, label: 'Profile Settings', icon: User, href: '/account/guest/profile', desc: 'Manage your visibility' },
    { id: 2, label: 'My Participation', icon: Award, href: '/account/guest/participation', desc: 'Event timeline history' },
    { id: 3, label: 'Browse Events', icon: Calendar, href: '/account/guest/events', desc: 'Discover club activities' },
  ];

  return (
    <PageShell className="text-zinc-300 selection:bg-indigo-500/30 space-y-6">
      <GuestHero userName={userName} avatarUrl={avatarUrl} stats={stats} latestApplication={latestApplication} />

      {/* Stats Cards with spring physics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_DEFS.map((s) => (
          <StatCard
            key={s.key}
            icon={s.icon}
            label={s.label}
            value={stats[s.key]}
            sublabel={s.sublabel}
            accent={s.accent}
            delay={s.delay}
          />
        ))}
      </div>

      {/* Upcoming events + Recent notices grid */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Events Layout Card */}
        <GlassCard padding="p-0" className="overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="flex items-center gap-2.5 text-base font-bold text-white">
              <Calendar className="h-5 w-5 text-blue-400" />
              Upcoming Events
            </h3>
            <ActionButton href="/account/guest/events" tone="ghost" className="rounded-xl px-3 py-1.5">
              See all <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </ActionButton>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="p-10 text-center">
              <EmptyState icon={Calendar} title="No upcoming events found" description="Check back later for contests, workshops, and meetups." accent="blue" />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {upcomingEvents.map((e) => {
                const isRegistered = displayRegistrations.some((r) => r.events?.title === e.title || r.event_id === e.id);
                const evDate = fmtDate(e.start_date);
                const evMo = evDate.split(' ')[0].toUpperCase();
                const evD = evDate.split(' ')[1];

                return (
                  <motion.div
                    key={e.id}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                    className="flex items-center gap-4 px-6 py-4 transition-colors"
                  >
                    {/* Calendar Chip Icon */}
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-zinc-950/60 shadow-inner">
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-400">{evMo}</span>
                      <span className="text-base font-extrabold text-white leading-none mt-0.5">{evD}</span>
                    </div>

                    {/* Details column */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">{e.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1 font-medium"><Clock className="h-3.5 w-3.5" /> {fmtTime(e.start_date)}</span>
                        <span className="flex items-center gap-1 font-medium"><MapPin className="h-3.5 w-3.5" /> {e.location || 'TBD'}</span>
                        {e.category && <span className="rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">{e.category}</span>}
                      </div>
                    </div>

                    {/* Action Pill */}
                    <div className="shrink-0">
                      {isRegistered ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold tracking-wide text-emerald-400 uppercase">
                          <Check className="h-3.5 w-3.5" /> Registered
                        </span>
                      ) : (
                        <ActionButton href="/account/guest/events" tone="primary" className="rounded-lg shadow-sm">
                          Register
                        </ActionButton>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Notices Card */}
        <GlassCard padding="p-0" className="overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="flex items-center gap-2.5 text-base font-bold text-white">
              <Bell className="h-5 w-5 text-violet-400" />
              Recent Notices
            </h3>
            <ActionButton href="/account/guest/notifications" tone="ghost" className="rounded-xl px-3 py-1.5">
              Inbox <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </ActionButton>
          </div>

          <div className="divide-y divide-white/5">
            {displayNotices.slice(0, 3).map((n) => {
              const Ico = NOTICE_ICON[n.notice_type] ?? Info;
              const tone = NOTICE_TONE[n.notice_type] ?? 'gray';
              return (
                <div key={n.id} className="group relative flex items-start gap-4 px-6 py-4 hover:bg-white/[0.01] transition-all">
                  {n.is_pinned && (
                    <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  )}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/5 bg-zinc-950/40 text-zinc-400 group-hover:text-violet-400 transition-colors">
                    <Ico className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold text-zinc-100 line-clamp-1 group-hover:text-violet-300 transition-colors">{n.title}</p>
                      {n.is_pinned && <Pin className="h-3 w-3 text-zinc-500 shrink-0 transform rotate-45" />}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-zinc-400 font-medium">{n.content}</p>
                    <p className="mt-1.5 font-mono text-[10px] text-zinc-500 font-semibold">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Membership Application Details / Comparative Section */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Interactive Application Stepper Details */}
        <GlassCard className="border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
          <SectionHeader
            icon={Sparkles}
            title="Membership Application Track"
            accent="indigo"
            action={
              latestApplication?.status ? (
                <Pill
                  tone={
                    latestApplication.status === 'pending' ? 'amber'
                      : latestApplication.status === 'rejected' ? 'rose'
                      : 'emerald'
                  }
                  className="font-bold uppercase tracking-wider text-[10px]"
                >
                  {latestApplication.status}
                </Pill>
              ) : (
                <Pill tone="amber" className="font-bold uppercase tracking-wider text-[10px]">Not Started</Pill>
              )
            }
          />

          {latestApplication?.status === 'pending' ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Verification in progress</p>
                  <p className="mt-0.5 text-xs text-zinc-400 font-medium">NEUPC moderators are matching your profiles</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
              <div className="rounded-xl border border-white/5 bg-zinc-950/30 p-4 font-medium text-xs leading-relaxed text-zinc-400 space-y-2">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Student ID</span>
                  <span className="font-mono text-zinc-200">{latestApplication.student_id}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Department</span>
                  <span className="text-zinc-200">{latestApplication.department}</span>
                </div>
                <div className="flex justify-between">
                  <span>Codeforces Handle</span>
                  <span className="font-mono text-indigo-400">{latestApplication.codeforces_handle || '—'}</span>
                </div>
              </div>
              <ActionButton href="/account/guest/membership-application" tone="indigo" className="w-full justify-center py-2">
                Modify Application details
              </ActionButton>
            </div>
          ) : latestApplication?.status === 'rejected' ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Review Complete - Declined</p>
                  <p className="mt-0.5 text-xs text-zinc-400 font-medium">Please verify details and resubmit</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </div>
              {latestApplication.rejection_reason && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-left">
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-rose-400 font-black">Moderator Notes</p>
                  <p className="text-xs text-zinc-300 font-semibold leading-relaxed">{latestApplication.rejection_reason}</p>
                </div>
              )}
              <ActionButton href="/account/guest/membership-application" tone="violet" className="w-full justify-center py-2" icon={ArrowRight}>
                Re-apply for Membership
              </ActionButton>
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Complete your Application</p>
                  <p className="mt-0.5 text-xs text-zinc-400 font-medium">4 quick steps to join competitive programming cohorts</p>
                </div>
                <span className="font-mono text-base font-extrabold text-white bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">0 / 4 Steps</span>
              </div>
              <GradientBar value={0} max={4} tone="indigo" />
              <div className="grid grid-cols-4 gap-2.5">
                {['Basics', 'Academic', 'Profiles', 'Review'].map((s, i) => (
                  <div key={s} className="rounded-xl border border-white/5 bg-zinc-950/40 px-2 py-2.5 text-center shadow-inner">
                    <span className="block font-mono text-[10px] font-bold text-zinc-600">0{i + 1}</span>
                    <span className="text-[11px] font-bold text-zinc-400 mt-0.5 block">{s}</span>
                  </div>
                ))}
              </div>
              <ActionButton href="/account/guest/membership-application" tone="indigo" className="w-full justify-center py-2" icon={ChevronRight}>
                Start Application Process
              </ActionButton>
            </div>
          )}
        </GlassCard>

        {/* Recent Attendance list */}
        <GlassCard padding="p-0" className="overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="flex items-center gap-2.5 text-base font-bold text-white">
              <Trophy className="h-5 w-5 text-amber-400" />
              Recent Attendance
            </h3>
            <ActionButton href="/account/guest/participation" tone="ghost" className="rounded-xl px-3 py-1.5">
              Activity <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </ActionButton>
          </div>

          {recentAttendance.length === 0 ? (
            <div className="p-10 text-center">
              <EmptyState icon={Trophy} title="No event participation records" description="Register and scan codes in workshops or contests to see timeline." accent="amber" />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentAttendance.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.01] transition-colors">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-inner">
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-zinc-100">{r.events?.title ?? 'Event'}</p>
                    <p className="font-mono text-[10px] text-zinc-500 mt-0.5 font-bold">{fmtDate(r.events?.start_date || r.registered_at)}</p>
                  </div>
                  <span title="Claim your certificate as a registered member" className="cursor-help">
                    <Pill tone="gray" className="bg-zinc-950/45 border-white/5 text-[10px] text-zinc-500"><Lock className="h-3 w-3 mr-0.5" /> Cert</Pill>
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Member perks layout */}
      <GlassCard className="border-indigo-500/20 bg-linear-to-br from-zinc-950 via-zinc-900 to-indigo-950/30 relative overflow-hidden shadow-xl p-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Unlock your potential</span>
            <h3 className="text-lg font-bold text-white mt-1">Upgrade to Premium Membership</h3>
            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed font-semibold">
              Leverage the ultimate platform features, priority events, post-contest evaluations, and specialized bootcamps.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {memberPerks.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-xs font-semibold text-zinc-300">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                    <Icon className="h-3 w-3" />
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </div>
          <ActionButton href="/account/guest/membership-application" tone="indigo" icon={ArrowRight} className="shrink-0 w-full lg:w-auto justify-center px-5 py-2.5">
            Apply for Membership
          </ActionButton>
        </div>
      </GlassCard>

      {/* Quick Launcher deck */}
      <div className="grid gap-4 sm:grid-cols-3">
        {quickActions.map((a) => (
          <Link
            key={a.id}
            href={a.href}
            className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-4 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.02] shadow-md hover:shadow-black/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-zinc-950/40 text-zinc-400 transition-all group-hover:scale-105 group-hover:text-indigo-400 group-hover:border-indigo-500/20 group-hover:shadow-[0_0_8px_rgba(99,102,241,0.2)] shadow-inner">
              <a.icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-extrabold text-zinc-100 group-hover:text-indigo-300 transition-colors">{a.label}</span>
              <span className="block text-[10px] text-zinc-500 mt-0.5 font-medium leading-none">{a.desc}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
