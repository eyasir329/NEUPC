/**
 * @file Member participation client — unified overview of event
 *   registrations, contest history, certificates, and discussion
 *   contributions.
 * @module MemberParticipationClient
 */

'use client';

import { useState, useMemo } from 'react';
import {
  CalendarDays,
  Trophy,
  Award,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  BarChart3,
  Hash,
  Target,
  TrendingUp,
  Medal,
  BookOpen,
  Download,
  Eye,
  Tag,
  Layers,
  ChevronRight,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fmtYear(str) {
  if (!str) return '';
  return new Date(str).getFullYear().toString();
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

// ─── Status configs ───────────────────────────────────────────────────────────

const REG_STATUS = {
  attended: {
    label: 'Attended',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    icon: CheckCircle2,
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    icon: CheckCircle2,
  },
  registered: {
    label: 'Registered',
    color: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    icon: Clock,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
    icon: XCircle,
  },
};

const CERT_TYPE = {
  participation: {
    label: 'Participation',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  completion: {
    label: 'Completion',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  },
  achievement: {
    label: 'Achievement',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  },
  appreciation: {
    label: 'Appreciation',
    color: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  },
};

const EVENT_CATEGORY_COLOR = {
  Workshop: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Contest: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  Seminar: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  Bootcamp: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  Hackathon: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  Meetup: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Other: 'bg-white/8 text-white/50 border-white/10',
};

function regStatus(s) {
  return REG_STATUS[s] ?? REG_STATUS.registered;
}
function certType(t) {
  return CERT_TYPE[t] ?? CERT_TYPE.participation;
}
function evtCat(c) {
  return EVENT_CATEGORY_COLOR[c] ?? EVENT_CATEGORY_COLOR.Other;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Icon size={24} className="text-white/20" />
      </div>
      <div className="space-y-1 text-center">
        <p className="font-medium text-white/50">{title}</p>
        {subtitle && <p className="text-sm text-white/30">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Activity Timeline ────────────────────────────────────────────────────────

function Timeline({ registrations, contestParticipations, myThreads }) {
  const items = useMemo(() => {
    const list = [
      ...registrations.map((r) => ({
        id: r.id,
        type: 'event',
        title: r.events?.title ?? 'Event',
        sub: r.events?.category ?? '',
        date: r.registered_at,
        icon: CalendarDays,
        color: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
      })),
      ...contestParticipations.map((c) => ({
        id: c.id,
        type: 'contest',
        title: c.contests?.title ?? 'Contest',
        sub: c.contests?.platform ?? '',
        date: c.registered_at,
        icon: Trophy,
        color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
      })),
      ...myThreads.map((t) => ({
        id: t.id,
        type: 'discussion',
        title: t.title,
        sub: '',
        date: t.created_at,
        icon: MessageSquare,
        color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
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
        subtitle="Join events and contests to see your timeline."
      />
    );

  return (
    <div className="relative space-y-0 pl-6">
      {/* Vertical line */}
      <div className="absolute top-3 bottom-3 left-2.5 w-px bg-white/8" />

      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className={`relative flex gap-4 pb-5 ${i === items.length - 1 ? 'pb-0' : ''}`}
          >
            {/* Node */}
            <div
              className={`absolute -left-6 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${item.color} shrink-0`}
            >
              <Icon size={10} />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-white/80">
                    {item.title}
                  </p>
                  {item.sub && (
                    <p className="text-xs text-white/40 capitalize">
                      {item.sub}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs whitespace-nowrap text-white/35">
                  {timeAgo(item.date)}
                </span>
              </div>
            </div>
          </div>
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
        subtitle="Register for upcoming events to track your participation."
      />
    );

  return (
    <div className="space-y-4">
      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {['all', 'attended', 'confirmed', 'registered', 'cancelled'].map(
          (s) => {
            const conf = s === 'all' ? null : regStatus(s);
            const count =
              s === 'all'
                ? registrations.length
                : registrations.filter((r) => r.status === s).length;
            if (s !== 'all' && count === 0) return null;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-xl border px-3 py-1.5 text-xs capitalize transition-colors ${
                  filter === s
                    ? 'border-violet-500/30 bg-violet-600/20 text-violet-300'
                    : 'border-white/8 bg-white/5 text-white/50 hover:bg-white/8 hover:text-white'
                }`}
              >
                {s === 'all' ? 'All' : conf.label} ({count})
              </button>
            );
          }
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/40">
          No {filter} events.
        </p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((reg) => {
            const sConf = regStatus(reg.status);
            const SIcon = sConf.icon;
            return (
              <div
                key={reg.id}
                className="flex items-start gap-4 rounded-2xl border border-white/8 bg-white/3 p-4 sm:p-5"
              >
                {/* Cover thumbnail or category icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${evtCat(reg.events?.category)}`}
                >
                  <CalendarDays size={18} />
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="line-clamp-1 text-sm font-semibold text-white">
                      {reg.events?.title ?? 'Unknown Event'}
                    </h4>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${sConf.color}`}
                    >
                      <SIcon size={10} /> {sConf.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-white/45">
                    {reg.events?.category && (
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs ${evtCat(reg.events.category)}`}
                      >
                        {reg.events.category}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CalendarDays size={10} />{' '}
                      {fmtDate(reg.events?.start_date)}
                    </span>
                    {reg.registered_at && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> Registered{' '}
                        {timeAgo(reg.registered_at)}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap gap-2">
                    {reg.attended && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 size={10} /> Attended
                      </span>
                    )}
                    {reg.certificate_issued && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                        <Award size={10} /> Certificate issued
                      </span>
                    )}
                    {reg.team_name && (
                      <span className="text-xs text-white/40">
                        Team: {reg.team_name}
                      </span>
                    )}
                  </div>
                </div>

                {reg.events?.slug && (
                  <a
                    href={`/events/${reg.events.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg p-2 text-white/25 transition-colors hover:bg-white/5 hover:text-white/70"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Contests Tab ─────────────────────────────────────────────────────────────

function ContestsTab({ contestParticipations }) {
  if (!contestParticipations.length)
    return (
      <EmptyState
        icon={Trophy}
        title="No contest participations"
        subtitle="Participate in contests to track your performance."
      />
    );

  return (
    <div className="space-y-2.5">
      {contestParticipations.map((cp) => {
        const hasPerfData =
          cp.rank != null || cp.score != null || cp.problems_solved != null;
        return (
          <div
            key={cp.id}
            className="rounded-2xl border border-white/8 bg-white/3 p-4 sm:p-5"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400">
                <Trophy size={18} />
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="line-clamp-1 text-sm font-semibold text-white">
                    {cp.contests?.title ?? 'Unknown Contest'}
                  </h4>
                  {cp.contests?.status && (
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs capitalize ${
                        cp.contests.status === 'finished'
                          ? 'border-white/10 bg-white/8 text-white/40'
                          : cp.contests.status === 'running'
                            ? 'border-emerald-400/20 bg-emerald-400/15 text-emerald-400'
                            : 'border-blue-400/20 bg-blue-400/15 text-blue-400'
                      }`}
                    >
                      {cp.contests.status}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-white/45">
                  {cp.contests?.platform && (
                    <span className="font-medium text-white/60">
                      {cp.contests.platform}
                    </span>
                  )}
                  {cp.contests?.start_time && (
                    <span className="flex items-center gap-1">
                      <CalendarDays size={10} />{' '}
                      {fmtDate(cp.contests.start_time)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> Joined {timeAgo(cp.registered_at)}
                  </span>
                </div>

                {hasPerfData && (
                  <div className="mt-1.5 flex flex-wrap gap-3">
                    {cp.rank != null && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
                        <Medal size={11} /> Rank #{cp.rank}
                      </span>
                    )}
                    {cp.score != null && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-xs text-blue-400">
                        <BarChart3 size={11} /> Score {cp.score}
                      </span>
                    )}
                    {cp.problems_solved != null && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-400">
                        <CheckCircle2 size={11} /> {cp.problems_solved} solved
                      </span>
                    )}
                  </div>
                )}
              </div>

              {cp.contests?.slug && (
                <a
                  href={`/events/${cp.contests.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg p-2 text-white/25 transition-colors hover:bg-white/5 hover:text-white/70"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Certificates Tab ─────────────────────────────────────────────────────────

function CertificatesTab({ certificates }) {
  if (!certificates.length)
    return (
      <EmptyState
        icon={Award}
        title="No certificates yet"
        subtitle="Attend events and contests to earn certificates."
      />
    );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {certificates.map((cert) => {
        const tConf = certType(cert.certificate_type);
        const linkedTo = cert.events?.title ?? cert.contests?.title ?? null;
        return (
          <div
            key={cert.id}
            className="group space-y-3 rounded-2xl border border-white/8 bg-white/3 p-4 sm:p-5"
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400">
                <Award size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="line-clamp-2 text-sm leading-snug font-semibold text-white">
                  {cert.title}
                </h4>
                {linkedTo && (
                  <p className="mt-0.5 truncate text-xs text-white/45">
                    {linkedTo}
                  </p>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              <span
                className={`rounded-full border px-2 py-0.5 text-xs ${tConf.color}`}
              >
                {tConf.label}
              </span>
              {cert.verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-400">
                  <CheckCircle2 size={9} /> Verified
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="space-y-1 text-xs text-white/45">
              <div className="flex items-center gap-1.5">
                <Hash size={10} className="shrink-0" />
                <span className="font-mono select-all">
                  {cert.certificate_number}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDays size={10} className="shrink-0" />
                <span>Issued {fmtDate(cert.issue_date)}</span>
              </div>
            </div>

            {/* Actions */}
            {cert.certificate_url && (
              <a
                href={cert.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-600/20 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-600/30"
              >
                <Download size={12} /> Download
              </a>
            )}
          </div>
        );
      })}
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
        subtitle="Start a thread in Discussions to see it here."
      />
    );

  return (
    <div className="space-y-2.5">
      {myThreads.map((thread) => (
        <div
          key={thread.id}
          className="flex items-start gap-4 rounded-2xl border border-white/8 bg-white/3 p-4 sm:p-5"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400">
            <MessageSquare size={18} />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <h4 className="line-clamp-1 text-sm font-semibold text-white">
              {thread.title}
            </h4>
            <div className="flex flex-wrap gap-3 text-xs text-white/45">
              {thread.is_solved && (
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 size={10} /> Solved
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye size={10} /> {thread.views ?? 0} views
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} /> {timeAgo(thread.created_at)}
              </span>
            </div>
            {thread.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {thread.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-white/8 bg-white/5 px-1.5 py-0.5 text-xs text-white/35"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <a
            href="/account/member/discussions"
            className="shrink-0 rounded-lg p-2 text-white/25 transition-colors hover:bg-white/5 hover:text-white/70"
          >
            <ChevronRight size={14} />
          </a>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'timeline', label: 'Timeline', icon: TrendingUp },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'contests', label: 'Contests', icon: Trophy },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
];

export default function MemberParticipationClient({
  registrations = [],
  contestParticipations = [],
  certificates = [],
  myThreads = [],
}) {
  const [activeTab, setActiveTab] = useState('timeline');

  const stats = useMemo(() => {
    const attended = registrations.filter(
      (r) => r.attended || r.status === 'attended'
    ).length;
    const topRank =
      contestParticipations
        .filter((c) => c.rank != null)
        .sort((a, b) => a.rank - b.rank)[0]?.rank ?? null;

    return {
      events: registrations.length,
      attended,
      contests: contestParticipations.length,
      certificates: certificates.length,
      discussions: myThreads.length,
      topRank,
    };
  }, [registrations, contestParticipations, certificates, myThreads]);

  const tabCounts = {
    timeline:
      registrations.length + contestParticipations.length + myThreads.length,
    events: registrations.length,
    contests: contestParticipations.length,
    certificates: certificates.length,
    discussions: myThreads.length,
  };

  const isEmpty =
    !registrations.length &&
    !contestParticipations.length &&
    !certificates.length &&
    !myThreads.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          My Participation
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Your involvement across events, contests &amp; club activities
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {[
          {
            label: 'Events',
            value: stats.events,
            icon: CalendarDays,
            color: 'text-violet-400',
          },
          {
            label: 'Attended',
            value: stats.attended,
            icon: CheckCircle2,
            color: 'text-emerald-400',
          },
          {
            label: 'Contests',
            value: stats.contests,
            icon: Trophy,
            color: 'text-amber-400',
          },
          {
            label: 'Certificates',
            value: stats.certificates,
            icon: Award,
            color: 'text-blue-400',
          },
          {
            label: 'Threads',
            value: stats.discussions,
            icon: MessageSquare,
            color: 'text-cyan-400',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/3 p-3 backdrop-blur-sm sm:gap-3 sm:p-4"
          >
            <Icon size={18} className={`${color} shrink-0`} />
            <div>
              <div className={`text-lg font-bold ${color}`}>{value}</div>
              <div className="text-xs text-white/40">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Best rank highlight */}
      {stats.topRank != null && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/15 text-amber-400">
            <Medal size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-300">
              Best Contest Rank
            </p>
            <p className="text-2xl font-bold text-white">#{stats.topRank}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = tabCounts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border border-violet-500/30 bg-violet-600/20 text-violet-300'
                  : 'border border-white/8 bg-white/5 text-white/50 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${activeTab === tab.id ? 'bg-violet-500/30 text-violet-200' : 'bg-white/10 text-white/40'}`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border border-white/8 bg-white/2 p-4 backdrop-blur-sm sm:p-6">
        {isEmpty ? (
          <EmptyState
            icon={Target}
            title="Start Your Journey!"
            subtitle="Join events and contests to build your participation profile."
          />
        ) : (
          <>
            {activeTab === 'timeline' && (
              <Timeline
                registrations={registrations}
                contestParticipations={contestParticipations}
                myThreads={myThreads}
              />
            )}
            {activeTab === 'events' && (
              <EventsTab registrations={registrations} />
            )}
            {activeTab === 'contests' && (
              <ContestsTab contestParticipations={contestParticipations} />
            )}
            {activeTab === 'certificates' && (
              <CertificatesTab certificates={certificates} />
            )}
            {activeTab === 'discussions' && (
              <DiscussionsTab myThreads={myThreads} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
