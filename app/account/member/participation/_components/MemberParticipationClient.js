/**
 * @file Member participation client component
 * @module MemberParticipationClient
 */

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Trophy,
  Award,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Medal,
  BarChart3,
  Download,
  Eye,
  ChevronRight,
  Users,
  Check,
  MapPin,
  Activity,
  Calendar,
  Ticket,
  CalendarCheck,
  Star,
  Lock,
  Filter,
  Shield,
  FileText,
  X,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  GlassCard,
  SectionHeader,
  GradientBar,
  EmptyState,
  Pill,
  TabBar,
  ActionButton,
  PageShell,
} from '@/app/account/_components/ui';
import { useScrollLock } from '@/app/_lib/utils/hooks';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDate(str);
}

// ─── Configs ──────────────────────────────────────────────────────────────────

const REG_STATUS = {
  attended: { label: 'Attended', tone: 'emerald', icon: CheckCircle2 },
  confirmed: { label: 'Confirmed', tone: 'blue', icon: CheckCircle2 },
  registered: { label: 'Registered', tone: 'violet', icon: Clock },
  cancelled: { label: 'Cancelled', tone: 'rose', icon: XCircle },
};

const CERT_TYPE = {
  participation: {
    label: 'Participation',
    tone: 'blue',
    bannerGlow: 'rgba(96,165,250,0.18)',
    sealGradient: 'linear-gradient(135deg,#60a5fa,#2563eb)',
  },
  completion: {
    label: 'Completion',
    tone: 'violet',
    bannerGlow: 'rgba(124,131,255,0.18)',
    sealGradient: 'linear-gradient(135deg,#7c83ff,#5b62cc)',
  },
  achievement: {
    label: 'Achievement',
    tone: 'amber',
    bannerGlow: 'rgba(251,191,36,0.18)',
    sealGradient: 'linear-gradient(135deg,#fbbf24,#d97706)',
  },
  appreciation: {
    label: 'Appreciation',
    tone: 'fuchsia',
    bannerGlow: 'rgba(217,70,239,0.18)',
    sealGradient: 'linear-gradient(135deg,#e879f9,#c026d3)',
  },
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

const TIMELINE_ICON = {
  event: { tone: 'violet', icon: CalendarDays },
  contest: { tone: 'amber', icon: Trophy },
  discussion: { tone: 'cyan', icon: MessageSquare },
};

const RESULT_TONE = {
  gold: {
    Icon: Trophy,
    gradient: 'from-amber-400 to-orange-600',
    tone: 'amber',
    label: 'Gold',
  },
  silver: {
    Icon: Medal,
    gradient: 'from-slate-300 to-slate-500',
    tone: 'gray',
    label: 'Silver',
  },
  bronze: {
    Icon: Award,
    gradient: 'from-orange-300 to-orange-600',
    tone: 'orange',
    label: 'Bronze',
  },
  badge: {
    Icon: Star,
    gradient: 'from-violet-400 to-fuchsia-600',
    tone: 'violet',
    label: 'Badge',
  },
};

const PROGRESS_TONES = ['violet', 'amber', 'cyan', 'rose', 'emerald', 'blue'];

function regStatus(s) {
  return REG_STATUS[s] ?? REG_STATUS.registered;
}
function evtCat(c) {
  return EVT_CAT[c] ?? 'gray';
}
function classify(result) {
  const v = (result || '').toLowerCase();
  if (/1st|first|champion|winner|gold/.test(v)) return RESULT_TONE.gold;
  if (/2nd|second|runner|silver/.test(v)) return RESULT_TONE.silver;
  if (/3rd|third|bronze/.test(v)) return RESULT_TONE.bronze;
  return RESULT_TONE.badge;
}

// ─── Timeline Tab ─────────────────────────────────────────────────────────────

function TimelineTab({ registrations, contestParticipations, myThreads }) {
  const items = useMemo(() => {
    const list = [
      ...registrations.map((r) => ({
        id: `e-${r.id}`,
        type: 'event',
        kind: 'Registered',
        title: r.events?.title ?? 'Event',
        date: r.registered_at,
      })),
      ...contestParticipations.map((c) => ({
        id: `c-${c.id}`,
        type: 'contest',
        kind: c.rank != null ? `Rank #${c.rank}` : 'Participated',
        title: c.contests?.title ?? 'Contest',
        date: c.registered_at,
      })),
      ...myThreads.map((t) => ({
        id: `d-${t.id}`,
        type: 'discussion',
        kind: 'Thread authored',
        title: t.title,
        date: t.created_at,
      })),
    ];
    return list
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);
  }, [registrations, contestParticipations, myThreads]);

  if (!items.length)
    return (
      <EmptyState
        icon={TrendingUp}
        title="No activity yet"
        description="Join events and contests to see your timeline."
      />
    );

  return (
    <div className="flex flex-col">
      {items.map((item, i) => {
        const cfg = TIMELINE_ICON[item.type] ?? TIMELINE_ICON.event;
        const Icon = cfg.icon;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-[14px] border-b border-white/[0.06] py-3 last:border-b-0"
          >
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border bg-${cfg.tone}-500/10 border-${cfg.tone}-500/20 text-${cfg.tone}-400`}
            >
              <Icon size={14} strokeWidth={2} />
            </div>
            <div className="flex w-full flex-col gap-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11.5px] font-medium tracking-[0.04em] text-gray-500 uppercase">
                  {item.kind}
                </span>
                <span className="shrink-0 text-[11.5px] text-gray-400 tabular-nums">
                  {fmtDate(item.date)}
                </span>
              </div>
              <div className="text-[13.5px] leading-snug font-medium text-gray-200">
                {item.title}
              </div>
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
      />
    );

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
    <div className="space-y-4">
      {tabs.length > 1 && (
        <TabBar tabs={tabs} value={filter} onChange={setFilter} />
      )}
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
              className="flex items-center gap-4 border-b border-white/[0.06] py-3 last:border-b-0"
            >
              <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-1.5 text-center">
                <span className="text-[9.5px] font-semibold tracking-[0.1em] text-violet-400 uppercase">
                  {mo}
                </span>
                <span className="text-lg leading-none font-semibold text-gray-200 tabular-nums">
                  {d}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  {reg.events?.category && (
                    <Pill tone={evtCat(reg.events.category)}>
                      {reg.events.category}
                    </Pill>
                  )}
                  {reg.attended && (
                    <Pill tone="emerald" icon={Check}>
                      Attended
                    </Pill>
                  )}
                </div>
                <div className="text-[13.5px] leading-snug font-semibold text-gray-200">
                  {reg.events?.title ?? 'Unknown Event'}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {reg.events?.start_date && (
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} />{' '}
                      {fmtDate(reg.events.start_date)}
                    </span>
                  )}
                  {reg.registered_at && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Registered{' '}
                      {timeAgo(reg.registered_at)}
                    </span>
                  )}
                  {reg.team_name && (
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {reg.team_name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Pill tone={sConf.tone} icon={SIcon}>
                  {sConf.label}
                </Pill>
                {reg.events?.slug && (
                  <a
                    href={`/events/${reg.events.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Achievements Tab ─────────────────────────────────────────────────────────

function AchievementsTab({ memberAchievements = [] }) {
  const [filter, setFilter] = useState('all');

  const earned = useMemo(
    () =>
      memberAchievements.map((item) => {
        const a = item.achievements ?? item;
        return {
          id: item.id ?? a.id,
          title: a.title,
          description: a.description || a.contest_name,
          date: a.achievement_date,
          year: a.year,
          result: a.result,
          category: a.category,
          isTeam: a.is_team,
          teamName: a.team_name,
        };
      }),
    [memberAchievements]
  );

  const categories = useMemo(
    () => [...new Set(earned.map((a) => a.category).filter(Boolean))],
    [earned]
  );
  const teamCount = earned.filter((a) => a.isTeam).length;
  const goldCount = earned.filter(
    (a) => classify(a.result) === RESULT_TONE.gold
  ).length;

  const filtered = useMemo(() => {
    if (filter === 'all') return earned;
    if (filter === 'gold')
      return earned.filter((a) => classify(a.result) === RESULT_TONE.gold);
    if (filter === 'team') return earned.filter((a) => a.isTeam);
    if (filter === 'solo') return earned.filter((a) => !a.isTeam);
    return earned.filter((a) => a.category === filter);
  }, [earned, filter]);

  const progressItems = useMemo(() => {
    const counts = categories.map((category) => ({
      category,
      count: earned.filter((a) => a.category === category).length,
    }));
    return counts.slice(0, 4).map((item, index) => {
      const target = Math.max(5, item.count + 3);
      return {
        id: item.category,
        title: `${item.category} Master`,
        subtitle: `${target - item.count} more to unlock`,
        value: item.count,
        target,
        tone: PROGRESS_TONES[index % PROGRESS_TONES.length],
      };
    });
  }, [categories, earned]);

  if (!earned.length)
    return (
      <EmptyState
        icon={Trophy}
        title="No achievements yet"
        description="Contest results added by admins will appear here."
      />
    );

  const tabs = [
    { value: 'all', label: 'All', count: earned.length },
    { value: 'gold', label: 'Gold', icon: Trophy, count: goldCount },
    { value: 'team', label: 'Team', icon: Users, count: teamCount },
    { value: 'solo', label: 'Solo', count: earned.length - teamCount },
    ...categories.map((c) => ({
      value: c,
      label: c,
      count: earned.filter((a) => a.category === c).length,
    })),
  ];

  const lockedItems = [
    {
      id: 'l1',
      title: 'World Finals Qualifier',
      subtitle: 'Reach top 4 in regionals',
      icon: '🌍',
    },
    {
      id: 'l2',
      title: '500 Problems Solved',
      subtitle: '182 to go',
      icon: '🎯',
    },
    {
      id: 'l3',
      title: 'Mentor Badge',
      subtitle: 'Help 10 juniors',
      icon: '🎓',
    },
    {
      id: 'l4',
      title: 'Open-Source Contributor',
      subtitle: '3 PRs merged',
      icon: '🌱',
    },
    {
      id: 'l5',
      title: 'Hackathon Hat-trick',
      subtitle: 'Win 3 hackathons',
      icon: '🚀',
    },
    {
      id: 'l6',
      title: 'Speedster',
      subtitle: 'Solve in under 5 min',
      icon: '⚡',
    },
    { id: 'l7', title: 'Marathon', subtitle: '24h coding stream', icon: '🏃' },
    {
      id: 'l8',
      title: 'Polyglot',
      subtitle: 'Solve in 5 languages',
      icon: '🗣️',
    },
  ];

  return (
    <div className="space-y-6">
      {tabs.length > 2 && (
        <TabBar tabs={tabs} value={filter} onChange={setFilter} />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((ach, i) => {
          const t = classify(ach.result);
          const Icon = t.Icon;
          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              className="group relative flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-4 text-center transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br ${t.gradient} shadow-lg ring-1 ring-white/10 transition-transform group-hover:scale-105`}
              >
                <Icon className="h-5 w-5 text-white drop-shadow" />
              </div>
              <p className="line-clamp-2 text-[13px] font-semibold text-gray-200">
                {ach.title}
              </p>
              {ach.result && (
                <Pill tone={t.tone === 'gray' ? 'gray' : t.tone}>
                  {ach.result}
                </Pill>
              )}
              <p className="line-clamp-2 text-[10px] text-gray-500">
                {ach.description || `${t.label} result`}
              </p>
              <div className="mt-auto flex flex-wrap items-center justify-center gap-1 pt-1">
                <span className="text-[10px] text-gray-600">
                  {ach.date ? fmtDate(ach.date) : ach.year}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {progressItems.length > 0 && (
        <>
          <div className="mt-8">
            <SectionHeader
              icon={Star}
              title="In Progress"
              subtitle="Keep pushing to unlock the next badge"
              accent="violet"
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {progressItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold text-gray-200">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {item.subtitle}
                      </p>
                    </div>
                    <Pill tone={item.tone}>
                      {item.value} / {item.target}
                    </Pill>
                  </div>
                  <GradientBar
                    value={item.value}
                    max={item.target}
                    tone={item.tone}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="mt-8">
        <SectionHeader
          icon={Lock}
          title="Locked Achievements"
          subtitle="Goals waiting to be unlocked"
          accent="gray"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {lockedItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.025 }}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-3.5 text-center opacity-70 transition-all hover:opacity-100"
            >
              <div className="relative">
                <div className="text-2xl grayscale">{item.icon}</div>
                <Lock className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full bg-gray-900 p-0.5 text-gray-400" />
              </div>
              <p className="line-clamp-2 text-[11px] font-medium text-gray-300">
                {item.title}
              </p>
              <p className="text-[9px] text-gray-500">{item.subtitle}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Certificates Tab ─────────────────────────────────────────────────────────

function CertModal({ cert, onClose }) {
  useScrollLock();
  const meta = CERT_TYPE[cert?.certificate_type] ?? CERT_TYPE.participation;
  const linkedName =
    cert?.events?.title ??
    cert?.bootcamps?.title ??
    cert?.contests?.title ??
    null;
  const linkedSlug =
    cert?.events?.slug ?? cert?.bootcamps?.slug ?? cert?.contests?.slug ?? null;
  const linkedPath = cert?.events
    ? `/events/${linkedSlug}`
    : cert?.bootcamps
      ? `/bootcamps/${linkedSlug}`
      : cert?.contests
        ? `/contests/${linkedSlug}`
        : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-lg p-2 text-gray-400 hover:bg-white/[0.08] hover:text-gray-200"
        >
          <X size={18} />
        </button>
        <div
          className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-6 sm:px-8 sm:py-8"
          style={{
            background: `radial-gradient(circle at 80% 30%, ${meta.bannerGlow}, transparent 60%), rgba(255,255,255,0.02)`,
          }}
        >
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-lg"
            style={{
              background: meta.sealGradient,
              boxShadow:
                '0 0 0 1px rgba(255,255,255,0.15) inset, 0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            <Award size={32} />
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-sm font-semibold tracking-wider text-gray-400">
              NEUPC
            </span>
            {cert?.verified && (
              <Pill tone="emerald" icon={Check}>
                Verified
              </Pill>
            )}
          </div>
        </div>
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <h2 className="mb-2 text-xl leading-snug font-bold text-white">
            {cert?.title}
          </h2>
          {cert?.description && (
            <p className="mb-6 text-[13px] leading-relaxed text-gray-400">
              {cert.description}
            </p>
          )}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-1 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                Awarded
              </p>
              <p className="text-sm font-medium text-gray-200">
                {fmtDate(cert?.issue_date, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-1 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                Certificate ID
              </p>
              <p className="font-mono text-sm font-medium break-all text-gray-200">
                {cert?.certificate_number}
              </p>
            </div>
            {cert?.verified && (
              <div className="col-span-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2.5">
                  <Shield size={18} className="text-emerald-400" />
                  <p className="text-[13px] font-medium text-emerald-300">
                    This certificate is verified and authentic
                  </p>
                </div>
              </div>
            )}
            {linkedName && (
              <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                  {cert?.events
                    ? 'Event'
                    : cert?.bootcamps
                      ? 'Bootcamp'
                      : 'Contest'}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-200">
                    {linkedName}
                  </p>
                  {linkedPath && (
                    <a
                      href={linkedPath}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-white/[0.08] hover:text-gray-200"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            {cert?.certificate_url ? (
              <a
                href={cert.certificate_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-[13px] font-semibold text-blue-300 transition hover:bg-blue-500/20"
              >
                <Download size={16} /> Download PDF
              </a>
            ) : (
              <div className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[13px] font-medium text-gray-500">
                No download available
              </div>
            )}
            <button
              onClick={onClose}
              className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-6 py-3 text-[13px] font-semibold text-gray-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CertificatesTab({ certificates }) {
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(
    () =>
      certificates.filter(
        (c) => typeFilter === 'all' || c.certificate_type === typeFilter
      ),
    [certificates, typeFilter]
  );

  if (!certificates.length)
    return (
      <EmptyState
        icon={Award}
        title="No certificates yet"
        description="Attend events and contests to earn certificates."
      />
    );

  const tabs = [
    { value: 'all', label: 'All', count: certificates.length },
    ...Object.keys(CERT_TYPE)
      .filter((t) => certificates.some((c) => c.certificate_type === t))
      .map((t) => ({
        value: t,
        label: CERT_TYPE[t].label,
        count: certificates.filter((c) => c.certificate_type === t).length,
      })),
  ];

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {selected && (
          <CertModal cert={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
      {tabs.length > 2 && (
        <TabBar tabs={tabs} value={typeFilter} onChange={setTypeFilter} />
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((cert, i) => {
          const meta =
            CERT_TYPE[cert.certificate_type] ?? CERT_TYPE.participation;
          const linkedTo =
            cert.events?.title ??
            cert.bootcamps?.title ??
            cert.contests?.title ??
            null;
          return (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              onClick={() => setSelected(cert)}
              className="group cursor-pointer overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div
                className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-4"
                style={{
                  background: `radial-gradient(circle at 80% 30%, ${meta.bannerGlow}, transparent 60%), rgba(255,255,255,0.01)`,
                }}
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-transform group-hover:scale-105"
                  style={{
                    background: meta.sealGradient,
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.10) inset, 0 4px 12px rgba(0,0,0,0.30)',
                  }}
                >
                  <Award size={22} />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[10px] font-semibold tracking-wider text-gray-500">
                    NEUPC
                  </span>
                  {cert.verified && (
                    <Pill tone="emerald" icon={Check}>
                      Verified
                    </Pill>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 px-4 py-3.5">
                <h3 className="line-clamp-2 text-[14px] leading-snug font-semibold text-gray-200">
                  {cert.title}
                </h3>
                {linkedTo && (
                  <p className="truncate text-xs text-gray-400">{linkedTo}</p>
                )}
                <div className="mt-1 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-2.5">
                  <div>
                    <p className="mb-0.5 text-[9px] font-medium tracking-wider text-gray-500 uppercase">
                      Awarded
                    </p>
                    <p className="font-mono text-[11px] text-gray-300">
                      {fmtDate(cert.issue_date)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-0.5 text-[9px] font-medium tracking-wider text-gray-500 uppercase">
                      ID
                    </p>
                    <p className="truncate font-mono text-[11px] text-gray-300">
                      {cert.certificate_number}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Discussions Tab ──────────────────────────────────────────────────────────

function DiscussionsTab({ myThreads }) {
  if (!myThreads.length)
    return (
      <EmptyState
        icon={MessageSquare}
        title="No discussion threads"
        description="Start a thread in Discussions to see it here."
      />
    );

  return (
    <div className="flex flex-col">
      {myThreads.map((thread, i) => (
        <motion.div
          key={thread.id}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-4 border-b border-white/[0.06] py-3 last:border-b-0"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
            <MessageSquare size={16} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              {thread.is_solved && (
                <Pill tone="emerald" icon={CheckCircle2}>
                  Solved
                </Pill>
              )}
              {thread.tags?.slice(0, 2).map((tag) => (
                <Pill key={tag} tone="gray">
                  #{tag}
                </Pill>
              ))}
            </div>
            <div className="text-[14px] leading-snug font-medium text-gray-200">
              {thread.title}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Eye size={12} /> {thread.views ?? 0} views
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> {timeAgo(thread.created_at)}
              </span>
            </div>
          </div>
          <a
            href={`/account/member/discussions/${thread.id}`}
            className="text-gray-500 hover:text-gray-300"
          >
            <ChevronRight size={18} />
          </a>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'timeline', label: 'Timeline', icon: TrendingUp },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
];

const STATS_CONFIG = [
  {
    id: 'events',
    title: 'Events',
    subtext: 'Attended',
    icon: CalendarDays,
    tone: 'emerald',
  },
  {
    id: 'achievements',
    title: 'Achievements',
    subtext: 'Earned',
    icon: Trophy,
    tone: 'amber',
  },
  {
    id: 'certificates',
    title: 'Certificates',
    subtext: 'Verified',
    icon: Award,
    tone: 'blue',
  },
  {
    id: 'discussions',
    title: 'Threads',
    subtext: 'Authored',
    icon: MessageSquare,
    tone: 'cyan',
  },
];

export default function MemberParticipationClient({
  registrations = [],
  contestParticipations = [],
  certificates = [],
  myThreads = [],
  memberAchievements = [],
  userId,
}) {
  // Read the initial tab from the URL without subscribing to Next.js navigation.
  // This avoids server re-renders on every tab click.
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p && TABS.some((t) => t.id === p)) return p;
    }
    return 'timeline';
  });

  // Use window.history.replaceState so the URL updates without triggering
  // any Next.js navigation or server component re-render.
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState(null, '', url.toString());
    }
  }, []);

  const stats = useMemo(() => {
    const attended = registrations.filter(
      (r) => r.attended || r.status === 'attended'
    ).length;
    const earnedAch = memberAchievements.length;
    return {
      events: attended,
      achievements: earnedAch,
      certificates: certificates.length,
      discussions: myThreads.length,
    };
  }, [registrations, memberAchievements, certificates, myThreads]);

  const tabCounts = {
    timeline:
      registrations.length + contestParticipations.length + myThreads.length,
    events: registrations.length,
    achievements: memberAchievements.length,
    certificates: certificates.length,
    discussions: myThreads.length,
  };

  const isEmpty =
    !registrations.length &&
    !memberAchievements.length &&
    !certificates.length &&
    !myThreads.length;

  const uiTabs = TABS.map((t) => ({
    value: t.id,
    label: t.label,
    icon: t.icon,
    count: tabCounts[t.id],
  }));

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
      <PageHeader
        icon={Activity}
        title="My Activity"
        subtitle="A complete record of your participation and achievements"
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
          {isEmpty ? (
            <EmptyState
              icon={TrendingUp}
              title="Start your journey!"
              description="Join events and contests to build your participation profile."
            />
          ) : (
            <>
              {activeTab === 'timeline' && (
                <TimelineTab
                  registrations={registrations}
                  contestParticipations={contestParticipations}
                  myThreads={myThreads}
                />
              )}
              {activeTab === 'events' && (
                <EventsTab registrations={registrations} />
              )}
              {activeTab === 'achievements' && (
                <AchievementsTab memberAchievements={memberAchievements} />
              )}
              {activeTab === 'certificates' && (
                <CertificatesTab certificates={certificates} />
              )}
              {activeTab === 'discussions' && (
                <DiscussionsTab myThreads={myThreads} />
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </PageShell>
  );
}
