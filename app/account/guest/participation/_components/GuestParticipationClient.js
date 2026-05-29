/**
 * @file Guest participation client component
 * @module GuestParticipationClient
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Trophy,
  Award,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Check,
  Users,
  Activity,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  PageHeader,
  GlassCard,
  SectionHeader,
  EmptyState,
  Pill,
  TabBar,
  ActionButton,
  PageShell,
} from '@/app/account/_components/ui';

// ─── Formatting helpers ────────────────────────────────────────────────────────

function fmtDate(
  str,
  opts = { year: 'numeric', month: 'short', day: 'numeric' }
) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', opts);
}

function fmtMonthDay(str) {
  if (!str) return { mo: '—', d: '—' };
  const d = new Date(str);
  return {
    mo: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    d: d.getDate().toString().padStart(2, '0'),
  };
}

function timeAgo(str) {
  if (!str) return '';
  const diff = Math.floor((Date.now() - new Date(str)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDate(str);
}

const REG_STATUS = {
  attended: { label: 'Attended', tone: 'emerald', icon: CheckCircle2 },
  confirmed: { label: 'Confirmed', tone: 'blue', icon: CheckCircle2 },
  registered: { label: 'Registered', tone: 'violet', icon: Clock },
  cancelled: { label: 'Cancelled', tone: 'rose', icon: XCircle },
};

const EVT_CAT = {
  Workshop: 'blue',
  Contest: 'violet',
  Seminar: 'cyan',
  Bootcamp: 'orange',
  Hackathon: 'amber',
  Meetup: 'emerald',
  Other: 'gray',
};

function regStatus(s) {
  return REG_STATUS[s] ?? REG_STATUS.registered;
}
function evtCat(c) {
  return EVT_CAT[c] ?? 'gray';
}

// ─── Timeline Tab Component ───────────────────────────────────────────────────

function TimelineTab({ registrations }) {
  const items = useMemo(() => {
    return registrations
      .map((r) => ({
        id: r.id,
        title: r.events?.title ?? 'Event',
        kind: 'Registered',
        date: r.registered_at,
        status: r.status,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [registrations]);

  if (!items.length) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No activity yet"
        description="Join events to see your timeline."
      />
    );
  }

  return (
    <GlassCard className="border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
      <div className="flex flex-col divide-y divide-white/5">
        {items.map((item, i) => {
          const sConf = regStatus(item.status);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.01)' }}
              className="flex gap-4 px-5 py-4 transition-colors"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-400 shadow-inner">
                <CalendarDays className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="flex w-full min-w-0 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black tracking-wider text-zinc-500 uppercase">
                    {item.kind}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-zinc-400">
                    {fmtDate(item.date)}
                  </span>
                </div>
                <div className="text-[13.5px] leading-snug font-bold text-zinc-100">
                  {item.title}
                </div>
                <div className="mt-1">
                  <Pill
                    tone={sConf.tone}
                    icon={sConf.icon}
                    className="text-[10px] font-bold tracking-wider uppercase"
                  >
                    {sConf.label}
                  </Pill>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ─── Events Tab Component ──────────────────────────────────────────────────────

function EventsTab({ registrations }) {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return registrations;
    return registrations.filter((r) => r.status === filter);
  }, [registrations, filter]);

  if (!registrations.length) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No event registrations"
        description="Register for upcoming events to track your participation."
        accent="blue"
        action={
          <ActionButton href="/account/guest/events" tone="primary">
            Browse events
          </ActionButton>
        }
      />
    );
  }

  const filterOpts = [
    'all',
    'attended',
    'confirmed',
    'registered',
    'cancelled',
  ];
  const tabs = filterOpts
    .map((s) => ({
      value: s,
      label: s === 'all' ? 'All' : regStatus(s).label,
      count:
        s === 'all'
          ? registrations.length
          : registrations.filter((r) => r.status === s).length,
    }))
    .filter((t) => t.count > 0);

  return (
    <div className="space-y-5">
      {tabs.length > 1 && (
        <TabBar tabs={tabs} value={filter} onChange={setFilter} />
      )}

      <GlassCard
        padding="p-0"
        className="overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-xl"
      >
        <div className="divide-y divide-white/5">
          {filtered.map((reg, i) => {
            const sConf = regStatus(reg.status);
            const SIcon = sConf.icon;
            const { mo, d } = fmtMonthDay(reg.events?.start_date);
            return (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.01)' }}
                className="flex items-center gap-4 px-6 py-4.5 transition-colors"
              >
                <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-white/10 bg-zinc-950/40 py-2 text-center shadow-inner">
                  <span className="text-[9px] font-black tracking-wider text-violet-400 uppercase">
                    {mo}
                  </span>
                  <span className="mt-0.5 text-xl leading-none font-extrabold text-zinc-100">
                    {d}
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {reg.events?.category && (
                      <Pill
                        tone={evtCat(reg.events.category)}
                        className="text-[10px] font-black tracking-wider uppercase"
                      >
                        {reg.events.category}
                      </Pill>
                    )}
                    {reg.attended && (
                      <Pill
                        tone="emerald"
                        icon={Check}
                        className="text-[10px] font-black tracking-wider uppercase"
                      >
                        Attended
                      </Pill>
                    )}
                  </div>
                  <div className="text-[14px] leading-snug font-extrabold text-zinc-100">
                    {reg.events?.title ?? 'Unknown Event'}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold text-zinc-500">
                    {reg.events?.start_date && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />{' '}
                        {fmtDate(reg.events.start_date)}
                      </span>
                    )}
                    {reg.registered_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Registered{' '}
                        {timeAgo(reg.registered_at)}
                      </span>
                    )}
                    {reg.team_name && (
                      <span className="flex items-center gap-1 text-indigo-400">
                        <Users className="h-3.5 w-3.5" /> {reg.team_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Pill
                    tone={sConf.tone}
                    icon={SIcon}
                    className="text-[10px] font-bold tracking-wider uppercase"
                  >
                    {sConf.label}
                  </Pill>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Achievements Tab (locked) ─────────────────────────────────────────────────

function AchievementsTab() {
  return (
    <div className="space-y-6">
      <GlassCard className="relative overflow-hidden border-amber-500/20 bg-linear-to-br from-zinc-950 via-zinc-900/60 to-amber-950/20 p-6 shadow-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl" />
        </div>
        <EmptyState
          icon={Trophy}
          title="Achievements are a Member benefit"
          description="NEUPC officially audits and awards achievements, progress badges, and rankings to fully approved members."
          accent="amber"
          action={
            <ActionButton
              href="/account/guest/membership-application"
              tone="amber"
              icon={Lock}
              className="px-4 py-2"
            >
              Apply for Membership
            </ActionButton>
          }
        />
      </GlassCard>

      <div>
        <SectionHeader
          icon={Lock}
          title="Locked Achievements"
          subtitle="Become a member to start earning these awards"
          accent="gray"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { id: 'l1', title: 'ICPC Qualifier', icon: '🌍' },
            { id: 'l2', title: '100 Problems Solved', icon: '🎯' },
            { id: 'l3', title: 'Bootcamp Graduate', icon: '🎓' },
            { id: 'l4', title: 'Contest Winner', icon: '🏆' },
            { id: 'l5', title: 'Hackathon Finalist', icon: '🚀' },
            { id: 'l6', title: 'Speedster', icon: '⚡' },
            { id: 'l7', title: 'Marathon Coder', icon: '🏃' },
            { id: 'l8', title: 'Polyglot', icon: '🗣️' },
          ].map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.025 }}
              whileHover={{ scale: 1.02 }}
              className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/5 bg-zinc-950/40 px-3 py-4 text-center opacity-40 transition-all hover:border-white/10 hover:bg-zinc-900/40 hover:opacity-60"
            >
              <div className="relative">
                <div className="text-3xl grayscale">{item.icon}</div>
                <div className="absolute -right-1 -bottom-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white/10 bg-zinc-950 p-0.5 text-zinc-400">
                  <Lock className="h-2.5 w-2.5" />
                </div>
              </div>
              <p className="line-clamp-2 text-xs leading-snug font-bold text-zinc-300">
                {item.title}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Certificates Tab (locked) ─────────────────────────────────────────────────

function CertificatesTab({ attended }) {
  return (
    <GlassCard className="relative overflow-hidden border-violet-500/20 bg-linear-to-br from-zinc-950 via-zinc-900/60 to-violet-950/20 p-6 shadow-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl" />
      </div>
      <EmptyState
        icon={Award}
        title="Certificates are a Member benefit"
        description={
          attended > 0
            ? `You have attended ${attended} verified event${attended !== 1 ? 's' : ''}. Upgrade to club membership to generate and claim your certificates.`
            : 'Participate in club events and upgrade to full membership to earn official PDF credentials.'
        }
        accent="violet"
        action={
          <ActionButton
            href="/account/guest/membership-application"
            tone="violet"
            icon={Lock}
            className="px-4 py-2"
          >
            Apply for Membership
          </ActionButton>
        }
      />
    </GlassCard>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const FALLBACK_REGISTRATIONS = [
  {
    id: 'fr1',
    status: 'attended',
    attended: true,
    registered_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    team_name: null,
    events: {
      title: 'JavaScript Fundamentals',
      category: 'Seminar',
      start_date: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  },
  {
    id: 'fr2',
    status: 'attended',
    attended: true,
    registered_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    team_name: 'Team Alpha',
    events: {
      title: 'NEUPC Hackathon 2025',
      category: 'Hackathon',
      start_date: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  },
  {
    id: 'fr3',
    status: 'registered',
    attended: false,
    registered_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    team_name: null,
    events: {
      title: 'Web Development Workshop',
      category: 'Workshop',
      start_date: new Date(Date.now() + 3 * 86400000).toISOString(),
    },
  },
  {
    id: 'fr4',
    status: 'confirmed',
    attended: false,
    registered_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    team_name: null,
    events: {
      title: 'Competitive Programming Contest #12',
      category: 'Contest',
      start_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    },
  },
  {
    id: 'fr5',
    status: 'attended',
    attended: true,
    registered_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    team_name: null,
    events: {
      title: 'Git & GitHub Workshop',
      category: 'Workshop',
      start_date: new Date(Date.now() - 35 * 86400000).toISOString(),
    },
  },
];

const TABS = [
  { id: 'timeline', label: 'Timeline', icon: TrendingUp },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'certificates', label: 'Certificates', icon: Award },
];

export default function GuestParticipationClient({
  registrations: rawRegistrations = [],
  certificates = [],
}) {
  const registrations =
    rawRegistrations.length > 0 ? rawRegistrations : FALLBACK_REGISTRATIONS;
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p && TABS.some((t) => t.id === p)) return p;
    }
    return 'timeline';
  });

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState(null, '', url.toString());
    }
  }, []);

  const attended = registrations.filter(
    (r) => r.attended || r.status === 'attended'
  ).length;

  const tabCounts = {
    timeline: registrations.length,
    events: registrations.length,
    achievements: 0,
    certificates: 0,
  };

  const uiTabs = TABS.map((t) => ({
    value: t.id,
    label: t.label,
    icon: t.icon,
    count: tabCounts[t.id],
  }));

  return (
    <PageShell className="space-y-6 text-zinc-300 selection:bg-violet-500/30">
      <PageHeader
        icon={Activity}
        title="My Activity"
        subtitle="A record of your participation and event history"
        accent="violet"
      />

      <TabBar tabs={uiTabs} value={activeTab} onChange={handleTabChange} />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeTab === 'timeline' && (
            <TimelineTab registrations={registrations} />
          )}
          {activeTab === 'events' && (
            <EventsTab registrations={registrations} />
          )}
          {activeTab === 'achievements' && <AchievementsTab />}
          {activeTab === 'certificates' && (
            <CertificatesTab attended={attended} />
          )}
        </motion.div>
      </AnimatePresence>

      <GlassCard className="relative overflow-hidden border border-emerald-500/20 bg-linear-to-br from-zinc-950 via-zinc-900/60 to-emerald-950/20 p-5 shadow-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-inner">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white">
              Unlock detailed participation analytics
            </h3>
            <p className="mt-1 text-xs leading-relaxed font-semibold text-zinc-400">
              Full members unlock competitive stats, detailed performance
              metrics, cohort ranks, and global leaderboard integration.
            </p>
          </div>
          <ActionButton
            href="/account/guest/membership-application"
            tone="emerald"
            className="shrink-0 px-4 py-2 font-bold"
          >
            Upgrade to Member
          </ActionButton>
        </div>
      </GlassCard>
    </PageShell>
  );
}
