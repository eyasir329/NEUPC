'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Trophy, Award, TrendingUp,
  CheckCircle2, Clock, XCircle, Check,
  Users, Activity, Sparkles, Lock,
} from 'lucide-react';
import {
  PageHeader, GlassCard, SectionHeader, EmptyState,
  Pill, TabBar, ActionButton, PageShell,
} from '../../_components/_ui';

function fmtDate(str, opts = { year: 'numeric', month: 'short', day: 'numeric' }) {
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
  if (diff < 60) return `${diff}s ago`;
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
  Workshop: 'blue', Contest: 'violet', Seminar: 'cyan', Bootcamp: 'orange',
  Hackathon: 'amber', Meetup: 'emerald', Other: 'gray',
};

function regStatus(s) { return REG_STATUS[s] ?? REG_STATUS.registered; }
function evtCat(c) { return EVT_CAT[c] ?? 'gray'; }

// ─── Timeline Tab ─────────────────────────────────────────────────────────────

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

  if (!items.length)
    return (
      <EmptyState
        icon={TrendingUp}
        title="No activity yet"
        description="Join events to see your timeline."
      />
    );

  return (
    <div className="flex flex-col">
      {items.map((item, i) => {
        const sConf = regStatus(item.status);
        const Icon = sConf.icon;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-3.5 border-b border-white/6 py-3 last:border-b-0"
          >
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border bg-violet-500/10 border-violet-500/20 text-violet-400`}>
              <CalendarDays size={14} strokeWidth={2} />
            </div>
            <div className="flex w-full flex-col gap-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-gray-500">{item.kind}</span>
                <span className="shrink-0 text-[11.5px] tabular-nums text-gray-400">{fmtDate(item.date)}</span>
              </div>
              <div className="text-[13.5px] font-medium leading-snug text-gray-200">{item.title}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Events Tab ───────────────────────────────────────────────────────────────

function EventsTab({ registrations }) {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return registrations;
    return registrations.filter((r) => r.status === filter);
  }, [registrations, filter]);

  if (!registrations.length)
    return (
      <EmptyState
        icon={CalendarDays}
        title="No event registrations"
        description="Register for upcoming events to track your participation."
        accent="blue"
        action={<ActionButton href="/account/guest/events" tone="primary">Browse events</ActionButton>}
      />
    );

  const filterOpts = ['all', 'attended', 'confirmed', 'registered', 'cancelled'];
  const tabs = filterOpts
    .map((s) => ({
      value: s,
      label: s === 'all' ? 'All' : regStatus(s).label,
      count: s === 'all' ? registrations.length : registrations.filter((r) => r.status === s).length,
    }))
    .filter((t) => t.count > 0);

  return (
    <div className="space-y-4">
      {tabs.length > 1 && <TabBar tabs={tabs} value={filter} onChange={setFilter} />}
      <div className="flex flex-col">
        {filtered.map((reg, i) => {
          const sConf = regStatus(reg.status);
          const SIcon = sConf.icon;
          const { mo, d } = fmtMonthDay(reg.events?.start_date);
          return (
            <motion.div
              key={reg.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 border-b border-white/6 py-3 last:border-b-0"
            >
              <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-white/6 bg-white/2 py-1.5 text-center">
                <span className="text-[9.5px] font-semibold uppercase tracking-widest text-violet-400">{mo}</span>
                <span className="text-lg font-semibold leading-none tabular-nums text-gray-200">{d}</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  {reg.events?.category && <Pill tone={evtCat(reg.events.category)}>{reg.events.category}</Pill>}
                  {reg.attended && <Pill tone="emerald" icon={Check}>Attended</Pill>}
                </div>
                <div className="text-[13.5px] font-semibold leading-snug text-gray-200">{reg.events?.title ?? 'Unknown Event'}</div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {reg.events?.start_date && (
                    <span className="flex items-center gap-1"><CalendarDays size={12} /> {fmtDate(reg.events.start_date)}</span>
                  )}
                  {reg.registered_at && (
                    <span className="flex items-center gap-1"><Clock size={12} /> Registered {timeAgo(reg.registered_at)}</span>
                  )}
                  {reg.team_name && (
                    <span className="flex items-center gap-1"><Users size={12} /> {reg.team_name}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Pill tone={sConf.tone} icon={SIcon}>{sConf.label}</Pill>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Achievements Tab (locked for guests) ─────────────────────────────────────

function AchievementsTab() {
  return (
    <div className="space-y-6">
      <GlassCard className="border-amber-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-amber-950/20">
        <EmptyState
          icon={Trophy}
          title="Achievements are a member benefit"
          description="Members earn contest rankings, badges, and achievement records that are tracked and verified by NEUPC."
          accent="amber"
          action={
            <ActionButton href="/account/guest/membership-application" tone="amber" icon={Lock}>
              Apply for membership
            </ActionButton>
          }
        />
      </GlassCard>

      <div>
        <SectionHeader icon={Lock} title="Locked Achievements" subtitle="Become a member to start earning" accent="gray" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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
              transition={{ duration: 0.2, delay: i * 0.025 }}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-white/6 bg-white/1.5 px-3 py-3.5 text-center opacity-60"
            >
              <div className="relative">
                <div className="text-2xl grayscale">{item.icon}</div>
                <Lock className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full bg-gray-900 p-0.5 text-gray-400" />
              </div>
              <p className="line-clamp-2 text-[11px] font-medium text-gray-300">{item.title}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Certificates Tab (locked for guests) ─────────────────────────────────────

function CertificatesTab({ attended }) {
  return (
    <GlassCard className="border-violet-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-violet-950/20">
      <EmptyState
        icon={Award}
        title="Certificates are a member benefit"
        description={attended > 0
          ? `You've attended ${attended} eligible event${attended !== 1 ? 's' : ''}. Apply for membership to claim and download your certificates.`
          : 'Attend events and apply for membership to earn verified certificates.'}
        accent="violet"
        action={
          <ActionButton href="/account/guest/membership-application" tone="primary" icon={Lock}>
            Apply for membership
          </ActionButton>
        }
      />
    </GlassCard>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const FALLBACK_REGISTRATIONS = [
  {
    id: 'fr1', status: 'attended', attended: true,
    registered_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    team_name: null,
    events: {
      title: 'JavaScript Fundamentals',
      category: 'Seminar',
      start_date: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  },
  {
    id: 'fr2', status: 'attended', attended: true,
    registered_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    team_name: 'Team Alpha',
    events: {
      title: 'NEUPC Hackathon 2025',
      category: 'Hackathon',
      start_date: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  },
  {
    id: 'fr3', status: 'registered', attended: false,
    registered_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    team_name: null,
    events: {
      title: 'Web Development Workshop',
      category: 'Workshop',
      start_date: new Date(Date.now() + 3 * 86400000).toISOString(),
    },
  },
  {
    id: 'fr4', status: 'confirmed', attended: false,
    registered_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    team_name: null,
    events: {
      title: 'Competitive Programming Contest #12',
      category: 'Contest',
      start_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    },
  },
  {
    id: 'fr5', status: 'attended', attended: true,
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

export default function GuestParticipationClient({ registrations: rawRegistrations = [], certificates = [] }) {
  const registrations = rawRegistrations.length > 0 ? rawRegistrations : FALLBACK_REGISTRATIONS;
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

  const attended = registrations.filter((r) => r.attended || r.status === 'attended').length;

  const tabCounts = {
    timeline: registrations.length,
    events: registrations.length,
    achievements: 0,
    certificates: 0,
  };

  const uiTabs = TABS.map((t) => ({ value: t.id, label: t.label, icon: t.icon, count: tabCounts[t.id] }));

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
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
          {activeTab === 'timeline' && <TimelineTab registrations={registrations} />}
          {activeTab === 'events' && <EventsTab registrations={registrations} />}
          {activeTab === 'achievements' && <AchievementsTab />}
          {activeTab === 'certificates' && <CertificatesTab attended={attended} />}
        </motion.div>
      </AnimatePresence>

      <GlassCard className="border-emerald-500/20 bg-linear-to-br from-gray-900 via-gray-900 to-emerald-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-[14px] font-semibold text-white">Unlock participation insights</h3>
            <p className="mt-0.5 text-[12.5px] text-gray-400">Members see contest rankings, performance trends, leaderboard standings &amp; exportable reports.</p>
          </div>
          <ActionButton href="/account/guest/membership-application" tone="emerald" className="shrink-0">
            Apply for membership
          </ActionButton>
        </div>
      </GlassCard>
    </PageShell>
  );
}
