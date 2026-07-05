/**
 * @file PostHog dashboard client — renders every saved PostHog insight in a
 *   native admin dashboard. Handles trends, funnels, single-number, empty,
 *   and unknown insight shapes, plus graceful setup/error states.
 * @module AdminPostHogDashboardClient
 */

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  ExternalLink,
  KeyRound,
  AlertCircle,
  Star,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  PageShell,
  PageHeader,
  GlassCard,
  StatCard,
  EmptyState,
  ActionButton,
} from '@/app/account/_components/ui';

// Palette reused across series so the dashboard reads as one system.
const SERIES_COLORS = [
  '#60a5fa',
  '#34d399',
  '#f472b6',
  '#fbbf24',
  '#a78bfa',
  '#22d3ee',
];

function fmtNumber(n) {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

const chartTooltip = {
  contentStyle: {
    background: '#0b1120',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    fontSize: 12,
  },
  labelStyle: { color: '#9ca3af' },
};

// ─── Per-kind renderers ───────────────────────────────────────────────────────

function TrendChart({ points, seriesKeys }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip {...chartTooltip} />
        {seriesKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function FunnelChart({ steps }) {
  const top = steps[0]?.count || 0;
  const data = steps.map((s) => ({
    name: s.name,
    count: s.count,
    pct: top ? Math.round((s.count / top) * 100) : 0,
  }));
  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            horizontal={false}
          />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={110}
          />
          <Tooltip {...chartTooltip} />
          <Bar dataKey="count" fill="#60a5fa" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
        {data.map((s) => (
          <span key={s.name}>
            {s.name}: <span className="text-gray-300">{fmtNumber(s.count)}</span> (
            {s.pct}%)
          </span>
        ))}
      </div>
    </div>
  );
}

function InsightBody({ normalized }) {
  switch (normalized.kind) {
    case 'trend':
      return <TrendChart points={normalized.points} seriesKeys={normalized.seriesKeys} />;
    case 'funnel':
      return <FunnelChart steps={normalized.steps} />;
    case 'number':
      return (
        <div className="flex h-[120px] items-center justify-center">
          <span className="text-4xl font-bold text-white">
            {fmtNumber(normalized.value)}
          </span>
        </div>
      );
    case 'empty':
      return (
        <div className="flex h-[120px] items-center justify-center text-xs text-gray-500">
          No data in the selected range yet.
        </div>
      );
    default:
      return (
        <div className="flex h-[120px] items-center justify-center text-xs text-gray-500">
          This insight type isn&apos;t charted here — open it in PostHog.
        </div>
      );
  }
}

const KIND_LABEL = {
  trend: 'Trend',
  funnel: 'Funnel',
  number: 'Number',
  empty: 'No data',
  unknown: 'Other',
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PostHogDashboardClient({
  insights = [],
  configured,
  error,
  projectUrl,
}) {
  const [kindFilter, setKindFilter] = useState('all');

  const kinds = useMemo(() => {
    const set = new Set(insights.map((i) => i.normalized.kind));
    return ['all', ...Array.from(set)];
  }, [insights]);

  const visible = useMemo(
    () =>
      kindFilter === 'all'
        ? insights
        : insights.filter((i) => i.normalized.kind === kindFilter),
    [insights, kindFilter]
  );

  const header = (
    <PageHeader
      icon={BarChart3}
      title="PostHog Analytics"
      subtitle="Every saved insight from PostHog, rendered natively in the admin panel."
      accent="violet"
      actions={
        <ActionButton
          href={projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          tone="ghost"
          icon={ExternalLink}
        >
          Open in PostHog
        </ActionButton>
      }
    />
  );

  // --- Not configured: guide the admin to add the key ---
  if (!configured) {
    return (
      <PageShell>
        {header}
        <div className="mt-8">
          <GlassCard>
            <EmptyState
              icon={KeyRound}
              accent="amber"
              title="PostHog read access not configured"
              description="Add a personal API key to fetch insights. Create one in PostHog → Settings → Personal API keys (read scope), then set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID in your environment."
            />
          </GlassCard>
        </div>
      </PageShell>
    );
  }

  // --- Error fetching ---
  if (error) {
    return (
      <PageShell>
        {header}
        <div className="mt-8">
          <GlassCard>
            <EmptyState
              icon={AlertCircle}
              accent="rose"
              title="Couldn't load insights"
              description={error}
            />
          </GlassCard>
        </div>
      </PageShell>
    );
  }

  // --- No insights in the project ---
  if (insights.length === 0) {
    return (
      <PageShell>
        {header}
        <div className="mt-8">
          <GlassCard>
            <EmptyState
              icon={Activity}
              title="No saved insights yet"
              description="Create insights in PostHog and they'll appear here automatically."
              action={
                <ActionButton
                  as="a"
                  href={`${projectUrl}/insights`}
                  target="_blank"
                  rel="noopener noreferrer"
                  tone="primary"
                >
                  Create an insight
                </ActionButton>
              }
            />
          </GlassCard>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {header}

      {/* Kind filter */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-gray-500" />
        {kinds.map((k) => (
          <button
            key={k}
            onClick={() => setKindFilter(k)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              kindFilter === k
                ? 'border-violet-500/40 bg-violet-500/15 text-violet-200'
                : 'border-white/[0.08] bg-white/[0.02] text-gray-400 hover:text-white'
            }`}
          >
            {k === 'all' ? `All (${insights.length})` : KIND_LABEL[k] || k}
          </button>
        ))}
      </div>

      {/* Insights grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visible.map((insight) => (
          <GlassCard key={insight.id} className="flex flex-col">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {insight.favorited && (
                    <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                  )}
                  <h3 className="truncate text-sm font-semibold text-white">
                    {insight.name}
                  </h3>
                </div>
                {insight.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {insight.description}
                  </p>
                )}
              </div>
              <Link
                href={insight.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-white/[0.08] p-1.5 text-gray-400 transition-colors hover:text-white"
                aria-label="Open insight in PostHog"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="flex-1">
              <InsightBody normalized={insight.normalized} />
            </div>
            <div className="mt-3 border-t border-white/[0.06] pt-2 text-[10px] text-gray-600">
              {KIND_LABEL[insight.normalized.kind] || insight.normalized.kind}
              {insight.lastRefresh &&
                ` · updated ${new Date(insight.lastRefresh).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}`}
            </div>
          </GlassCard>
        ))}
      </div>
    </PageShell>
  );
}
