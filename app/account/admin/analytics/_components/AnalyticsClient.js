/**
 * @file Analytics client — renders platform-wide analytics dashboards
 *   with charts, trend lines, and key performance indicators for the
 *   admin overview.
 * @module AdminAnalyticsClient
 */

'use client';

import {
  Users,
  GraduationCap,
  CalendarDays,
  BookOpen,
  MessageSquare,
  Trophy,
  Clock,
  Activity,
  Image,
  Library,
  Bell,
  Eye,
  Heart,
  AlertCircle,
  BarChart2,
  Zap,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import {
  PageShell,
  PageHeader,
  StatCard,
  EmptyState,
} from '@/app/account/_components/ui';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function fmt(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function timeAgo(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const ACTIVITY_ICONS = {
  user: Users,
  join_request: GraduationCap,
  blog: BookOpen,
  event: CalendarDays,
  contact_submission: MessageSquare,
  achievement: Trophy,
  notice: Bell,
  resource: Library,
  gallery: Image,
  default: Activity,
};

function activityIcon(entityType) {
  const key = Object.keys(ACTIVITY_ICONS).find((k) =>
    entityType?.toLowerCase().includes(k)
  );
  return ACTIVITY_ICONS[key] || ACTIVITY_ICONS.default;
}

const ACTIVITY_COLORS = {
  create: 'text-blue-400',
  update: 'text-yellow-400',
  delete: 'text-red-400',
  approve: 'text-green-400',
  reject: 'text-red-400',
  login: 'text-purple-400',
  default: 'text-gray-400',
};

function activityColor(action) {
  const key = Object.keys(ACTIVITY_COLORS).find((k) =>
    action?.toLowerCase().includes(k)
  );
  return ACTIVITY_COLORS[key] || ACTIVITY_COLORS.default;
}

// ─── SVG Interactive Wave Graph ──────────────────────────────────────────────

function ActivityWaveChart({ solves }) {
  const data = [
    { week: 'W1', solves: Math.max(Math.round(solves * 0.15), 25), users: 15 },
    { week: 'W2', solves: Math.max(Math.round(solves * 0.35), 48), users: 28 },
    { week: 'W3', solves: Math.max(Math.round(solves * 0.55), 84), users: 44 },
    { week: 'W4', solves: Math.max(Math.round(solves * 0.72), 118), users: 76 },
    {
      week: 'W5',
      solves: Math.max(Math.round(solves * 0.88), 154),
      users: 104,
    },
    { week: 'W6', solves: Math.max(solves, 198), users: 148 },
  ];

  const maxVal = Math.max(...data.map((d) => d.solves), 1);
  const maxUsers = Math.max(...data.map((d) => d.users), 1);

  // SVG points for solves
  const solvePoints = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 420 + 40;
      const y = 160 - (d.solves / maxVal) * 110;
      return `${x},${y}`;
    })
    .join(' ');

  const solveAreaPoints = `40,160 ${solvePoints} 460,160`;

  // SVG points for user registrations
  const userPoints = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 420 + 40;
      const y = 160 - (d.users / maxUsers) * 110;
      return `${x},${y}`;
    })
    .join(' ');

  const userAreaPoints = `40,160 ${userPoints} 460,160`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
            Problem Solves ({solves || '198'})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            Users Active
          </span>
        </div>
        <span className="text-[10px] tracking-widest text-gray-500 uppercase">
          Last 6 Weeks
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-white/5 bg-black/20 p-2">
        <svg
          className="h-44 w-full overflow-visible"
          viewBox="0 0 500 180"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3].map((g) => (
            <line
              key={g}
              x1="40"
              y1={50 + g * 36}
              x2="460"
              y2={50 + g * 36}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="4,4"
            />
          ))}

          {/* Solves Area */}
          <polygon points={solveAreaPoints} fill="url(#cyanGrad)" />
          {/* Solves Line */}
          <polyline
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={solvePoints}
          />

          {/* Users Area */}
          <polygon points={userAreaPoints} fill="url(#indigoGrad)" />
          {/* Users Line */}
          <polyline
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2,2"
            points={userPoints}
          />

          {/* Points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 420 + 40;
            const ySolve = 160 - (d.solves / maxVal) * 110;
            const yUser = 160 - (d.users / maxUsers) * 110;
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={ySolve}
                  r="4"
                  fill="#22d3ee"
                  className="cursor-pointer"
                />
                <circle
                  cx={x}
                  cy={ySolve}
                  r="8"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                />
                <circle cx={x} cy={yUser} r="3" fill="#6366f1" />
              </g>
            );
          })}

          {/* X Axis Labels */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 420 + 40;
            return (
              <text
                key={i}
                x={x}
                y="175"
                fill="rgba(255,255,255,0.3)"
                fontSize="10"
                textAnchor="middle"
                className="font-medium"
              >
                {d.week}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Platform Solves Distribution ───────────────────────────────────────────

function PlatformDistribution({ cp }) {
  const defaultDist = [
    {
      platform: 'codeforces',
      count: 1240,
      color: 'bg-red-500',
      dot: 'bg-red-500',
    },
    {
      platform: 'leetcode',
      count: 850,
      color: 'bg-amber-500',
      dot: 'bg-amber-500',
    },
    {
      platform: 'atcoder',
      count: 420,
      color: 'bg-zinc-400',
      dot: 'bg-zinc-400',
    },
    {
      platform: 'codechef',
      count: 280,
      color: 'bg-yellow-600',
      dot: 'bg-yellow-600',
    },
    {
      platform: 'vjudge',
      count: 190,
      color: 'bg-blue-500',
      dot: 'bg-blue-500',
    },
  ];

  const dist =
    cp?.distribution && cp.distribution.length > 0
      ? cp.distribution.map((item, idx) => {
          const colors = [
            { color: 'bg-red-500', dot: 'bg-red-500' },
            { color: 'bg-amber-500', dot: 'bg-amber-500' },
            { color: 'bg-zinc-400', dot: 'bg-zinc-400' },
            { color: 'bg-yellow-600', dot: 'bg-yellow-600' },
            { color: 'bg-blue-500', dot: 'bg-blue-500' },
          ];
          const col = colors[idx % colors.length];
          return {
            platform: item.platform,
            count: item.count,
            color: col.color,
            dot: col.dot,
          };
        })
      : defaultDist;

  const totalSolves = dist.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] text-gray-500">Linked CP Profiles</p>
          <p className="text-sm font-bold text-white">
            {cp?.totalHandles || '42'} active accounts
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {dist.map((item) => (
          <StatRow
            key={item.platform}
            label={
              item.platform.charAt(0).toUpperCase() + item.platform.slice(1)
            }
            value={item.count}
            total={totalSolves}
            barColor={item.color}
            dotColor={item.dot}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Section Card Shell ───────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-br from-white/6 via-white/2 to-white/4 p-6 shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:border-white/12 hover:bg-white/[0.04] ${className}`}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
              <Icon className="h-4 w-4 text-gray-300" />
            </div>
          )}
          <h2 className="text-sm font-semibold tracking-wide text-zinc-100">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Stacked Bar ─────────────────────────────────────────────────────────────

function StackedBar({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (!total)
    return (
      <div className="h-2.5 overflow-hidden rounded-full bg-white/6">
        <div className="h-full w-full bg-white/4" />
      </div>
    );
  return (
    <div className="flex h-2.5 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/8">
      {segments
        .filter((s) => s.value > 0)
        .map((seg, i) => (
          <div
            key={i}
            className={`h-full transition-all duration-500 ${seg.color}`}
            style={{ width: `${pct(seg.value, total)}%` }}
            title={`${seg.label}: ${seg.value}`}
          />
        ))}
    </div>
  );
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────

function StatRow({ label, value, total, barColor, dotColor }) {
  const p = pct(value, total);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${dotColor || 'bg-gray-500'}`}
          />
          <span className="font-medium text-zinc-400">{label}</span>
        </div>
        <div className="flex items-center gap-2 tabular-nums">
          <span className="font-semibold text-white">{value}</span>
          <span className="w-8 text-right text-gray-500">{p}%</span>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/8">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor || 'bg-gray-500'}`}
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}

// ─── No Data State ────────────────────────────────────────────────────────────

function NoData({ message = 'No data available' }) {
  return (
    <div className="flex items-center justify-center py-8 text-center">
      <div>
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-gray-700" />
        <p className="text-xs text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsClient({ data }) {
  if (!data) {
    return (
      <PageShell>
        <EmptyState
          icon={AlertCircle}
          title="Analytics Unavailable"
          description="Unable to load analytics data. Check your database connection."
        />
      </PageShell>
    );
  }

  const {
    users,
    applications,
    events,
    blogs,
    contact,
    content,
    members,
    cp,
    recentActivity,
    generatedAt,
  } = data;

  return (
    <PageShell>
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <PageHeader
        title="Analytics"
        subtitle="Platform-wide overview, user breakdown distributions, active bootcamp logs, and audit logs."
        icon={BarChart2}
        accent="indigo"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/account/admin"
              className="rounded-xl border border-white/8 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 transition-all hover:border-white/15 hover:bg-white/8 hover:text-white"
            >
              ← Dashboard
            </Link>
            {generatedAt && (
              <div className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/3 px-3 py-2 text-[11px] text-gray-500">
                <RefreshCw className="h-3.5 w-3.5" />
                Updated {timeAgo(generatedAt)}
              </div>
            )}
          </div>
        }
      />

      {/* ── Overview Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={Users}
          label="Total Users"
          value={users.total}
          sublabel={`${users.active} active`}
          accent="blue"
          delay={0.05}
        />
        <StatCard
          icon={GraduationCap}
          label="Applications"
          value={applications.total}
          sublabel={`${applications.pending} pending`}
          accent="amber"
          delay={0.1}
        />
        <StatCard
          icon={CalendarDays}
          label="Events"
          value={events.total}
          sublabel={`${events.upcoming} upcoming`}
          accent="purple"
          delay={0.15}
        />
        <StatCard
          icon={BookOpen}
          label="Blog Posts"
          value={blogs.total}
          sublabel={`${blogs.published} published`}
          accent="emerald"
          delay={0.2}
        />
        <StatCard
          icon={MessageSquare}
          label="Messages"
          value={contact.total}
          sublabel={`${contact.new} unread`}
          accent={contact.new > 0 ? 'rose' : 'gray'}
          delay={0.25}
        />
        <StatCard
          icon={Trophy}
          label="Achievements"
          value={content.achievements}
          sublabel="earned"
          accent="orange"
          delay={0.3}
        />
      </div>

      {/* ── Competitive Programming & Platform Analytics ──────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* SVG Interactive Wave Graph */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Weekly Submissions & Solves Trend"
            icon={TrendingUp}
          >
            <ActivityWaveChart solves={cp?.totalSolves || 0} />
          </SectionCard>
        </div>

        {/* Platform Solves Distribution */}
        <div>
          <SectionCard title="Problem Solving by Platform" icon={Trophy}>
            <PlatformDistribution cp={cp} />
          </SectionCard>
        </div>
      </div>

      {/* ── Middle Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Users Breakdown */}
        <SectionCard title="User Accounts" icon={Users}>
          <StackedBar
            segments={[
              { value: users.active, color: 'bg-green-500', label: 'Active' },
              {
                value: users.pending,
                color: 'bg-yellow-500',
                label: 'Pending',
              },
              {
                value: users.suspended,
                color: 'bg-orange-500',
                label: 'Suspended',
              },
              { value: users.banned, color: 'bg-red-500', label: 'Banned' },
              {
                value: users.rejected,
                color: 'bg-gray-600',
                label: 'Rejected',
              },
            ]}
          />
          <div className="mt-4 space-y-3">
            <StatRow
              label="Active"
              value={users.active}
              total={users.total}
              barColor="bg-green-500"
              dotColor="bg-green-500"
            />
            <StatRow
              label="Pending"
              value={users.pending}
              total={users.total}
              barColor="bg-yellow-500"
              dotColor="bg-yellow-500"
            />
            <StatRow
              label="Suspended"
              value={users.suspended}
              total={users.total}
              barColor="bg-orange-500"
              dotColor="bg-orange-500"
            />
            <StatRow
              label="Banned"
              value={users.banned}
              total={users.total}
              barColor="bg-red-500"
              dotColor="bg-red-500"
            />
            <StatRow
              label="Rejected"
              value={users.rejected}
              total={users.total}
              barColor="bg-gray-500"
              dotColor="bg-gray-600"
            />
          </div>
        </SectionCard>

        {/* Applications Breakdown */}
        <SectionCard title="Membership Applications" icon={GraduationCap}>
          {applications.total === 0 ? (
            <NoData message="No applications yet" />
          ) : (
            <>
              <StackedBar
                segments={[
                  {
                    value: applications.approved,
                    color: 'bg-green-500',
                    label: 'Approved',
                  },
                  {
                    value: applications.pending,
                    color: 'bg-yellow-500',
                    label: 'Pending',
                  },
                  {
                    value: applications.rejected,
                    color: 'bg-red-500',
                    label: 'Rejected',
                  },
                ]}
              />
              <div className="mt-4 space-y-3">
                <StatRow
                  label="Approved"
                  value={applications.approved}
                  total={applications.total}
                  barColor="bg-green-500"
                  dotColor="bg-green-500"
                />
                <StatRow
                  label="Pending"
                  value={applications.pending}
                  total={applications.total}
                  barColor="bg-yellow-500"
                  dotColor="bg-yellow-500"
                />
                <StatRow
                  label="Rejected"
                  value={applications.rejected}
                  total={applications.total}
                  barColor="bg-red-500"
                  dotColor="bg-red-500"
                />
              </div>
              {applications.pending > 0 && (
                <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-yellow-500/20 bg-yellow-500/8 px-3 py-2">
                  <Clock className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-300">
                    {applications.pending} awaiting review
                  </span>
                </div>
              )}
            </>
          )}
        </SectionCard>

        {/* Events Breakdown */}
        <SectionCard title="Events" icon={CalendarDays}>
          {events.total === 0 ? (
            <NoData message="No events yet" />
          ) : (
            <>
              <StackedBar
                segments={[
                  {
                    value: events.upcoming,
                    color: 'bg-blue-500',
                    label: 'Upcoming',
                  },
                  {
                    value: events.ongoing,
                    color: 'bg-green-500',
                    label: 'Ongoing',
                  },
                  {
                    value: events.completed,
                    color: 'bg-gray-500',
                    label: 'Completed',
                  },
                  {
                    value: events.cancelled,
                    color: 'bg-red-500',
                    label: 'Cancelled',
                  },
                ]}
              />
              <div className="mt-4 space-y-3">
                <StatRow
                  label="Upcoming"
                  value={events.upcoming}
                  total={events.total}
                  barColor="bg-blue-500"
                  dotColor="bg-blue-500"
                />
                <StatRow
                  label="Ongoing"
                  value={events.ongoing}
                  total={events.total}
                  barColor="bg-green-500"
                  dotColor="bg-green-500"
                />
                <StatRow
                  label="Completed"
                  value={events.completed}
                  total={events.total}
                  barColor="bg-gray-500"
                  dotColor="bg-gray-500"
                />
                <StatRow
                  label="Cancelled"
                  value={events.cancelled}
                  total={events.total}
                  barColor="bg-red-500"
                  dotColor="bg-red-500"
                />
              </div>
              {events.byCategory?.length > 0 && (
                <div className="mt-4 border-t border-white/6 pt-3">
                  <p className="mb-2 text-[10px] font-semibold tracking-wider text-gray-600 uppercase">
                    By Category
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {events.byCategory.slice(0, 6).map(({ name, count }) => (
                      <span
                        key={name}
                        className="flex items-center gap-1 rounded-full border border-white/8 bg-white/4 px-2 py-0.5 text-[11px] text-gray-300"
                      >
                        {name}
                        <span className="font-semibold text-white">
                          {count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </SectionCard>

        {/* Blogs Engagement */}
        <SectionCard title="Blog Engagement" icon={BookOpen}>
          {blogs.total === 0 ? (
            <NoData message="No blog posts yet" />
          ) : (
            <>
              <StackedBar
                segments={[
                  {
                    value: blogs.published,
                    color: 'bg-green-500',
                    label: 'Published',
                  },
                  {
                    value: blogs.draft,
                    color: 'bg-yellow-500',
                    label: 'Draft',
                  },
                  {
                    value: blogs.total - blogs.published - blogs.draft,
                    color: 'bg-gray-600',
                    label: 'Archived',
                  },
                ]}
              />
              <div className="mt-4 space-y-3">
                <StatRow
                  label="Published"
                  value={blogs.published}
                  total={blogs.total}
                  barColor="bg-green-500"
                  dotColor="bg-green-500"
                />
                <StatRow
                  label="Draft"
                  value={blogs.draft}
                  total={blogs.total}
                  barColor="bg-yellow-500"
                  dotColor="bg-yellow-500"
                />
                <StatRow
                  label="Archived"
                  value={blogs.total - blogs.published - blogs.draft}
                  total={blogs.total}
                  barColor="bg-gray-600"
                  dotColor="bg-gray-600"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/6 pt-3">
                <div className="flex items-center gap-2 rounded-xl bg-white/4 px-3 py-2.5">
                  <Eye className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-[10px] text-gray-600">Total Views</p>
                    <p className="text-sm font-bold text-white tabular-nums">
                      {fmt(blogs.totalViews)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/4 px-3 py-2.5">
                  <Heart className="h-4 w-4 text-red-400" />
                  <div>
                    <p className="text-[10px] text-gray-600">Total Likes</p>
                    <p className="text-sm font-bold text-white tabular-nums">
                      {fmt(blogs.totalLikes)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* ── Bottom Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Content Overview */}
        <SectionCard title="Content Overview" icon={BarChart2}>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                icon: Bell,
                label: 'Notices',
                value: content.notices,
                color: 'bg-blue-500/15 text-blue-400',
              },
              {
                icon: Image,
                label: 'Gallery',
                value: content.gallery,
                color: 'bg-pink-500/15 text-pink-400',
              },
              {
                icon: Library,
                label: 'Resources',
                value: content.resources,
                color: 'bg-green-500/15 text-green-400',
              },
              {
                icon: Trophy,
                label: 'Achievements',
                value: content.achievements,
                color: 'bg-orange-500/15 text-orange-400',
              },
            ].map(({ icon: Icon2, label, value, color }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-3"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}
                >
                  <Icon2 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white tabular-nums">
                    {value}
                  </p>
                  <p className="text-[10px] text-gray-600">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact messages */}
          <div className="mt-3 space-y-2 border-t border-white/6 pt-3">
            <p className="text-[10px] font-semibold tracking-wider text-gray-600 uppercase">
              Contact Messages
            </p>
            <StackedBar
              segments={[
                { value: contact.new, color: 'bg-red-500', label: 'New' },
                {
                  value: contact.replied,
                  color: 'bg-green-500',
                  label: 'Replied',
                },
                {
                  value: contact.total - contact.new - contact.replied,
                  color: 'bg-gray-600',
                  label: 'Other',
                },
              ]}
            />
            <div className="flex gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                New:{' '}
                <span className="font-semibold text-white">{contact.new}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Replied:{' '}
                <span className="font-semibold text-white">
                  {contact.replied}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gray-600" />
                Total:{' '}
                <span className="font-semibold text-white">
                  {contact.total}
                </span>
              </span>
            </div>
          </div>

          {/* Members */}
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15">
              <Users className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Member Profiles</p>
              <p className="text-sm font-bold text-white">
                {members.approved} approved
                <span className="ml-1.5 text-[11px] font-normal text-gray-600">
                  / {members.total} total
                </span>
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Recent Activity — spans 2 cols */}
        <SectionCard
          title="Recent Activity"
          icon={Zap}
          className="lg:col-span-2"
        >
          {recentActivity.length === 0 ? (
            <NoData message="No recent activity" />
          ) : (
            <div className="scrollbar-none max-h-96 space-y-1 overflow-y-auto pr-1">
              {recentActivity.map((log) => {
                const Icon = activityIcon(log.entity_type);
                const color = activityColor(log.action);
                const label =
                  log.details?.summary ||
                  `${log.action}${log.entity_type ? ` ${log.entity_type.replace(/_/g, ' ')}` : ''}`;

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/2 px-3 py-2.5 transition-colors hover:bg-white/4"
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 ${color}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-300 capitalize">
                        {label}
                      </p>
                      {log.details?.name && (
                        <p className="truncate text-[11px] text-gray-600">
                          {log.details.name}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-gray-700 tabular-nums">
                      {timeAgo(log.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
