/**
 * @file Points and stats panel with radial progress.
 * @module PointsStatsPanel
 */

'use client';

import { Trophy } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from './bootcamps-shared';

function RadialProgress({ pct, size = 80, stroke = 7, color = '#8b5cf6' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct / 100, 1);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  );
}

function PointsStatsPanel({
  chartData,
  totalEarned,
  totalMax,
  label = 'Points',
}) {
  const score =
    totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : null;
  const hasAnyPoints = chartData.some((d) => d.earned > 0 || d.max > 0);
  if (!hasAnyPoints) return null;

  const CustomTooltip = ({ active, payload, label: l }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="min-w-44 rounded-2xl border border-white/10 bg-zinc-900 p-3 shadow-xl backdrop-blur-md">
        <p className="mb-2 text-[9.5px] font-bold tracking-wider text-gray-500 uppercase">
          {l}
        </p>
        {payload.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between gap-4 py-0.5"
          >
            <span className="text-xs text-gray-400">{p.name}</span>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: p.name === 'Earned' ? '#f59e0b' : '#6b7280' }}
            >
              {p.value} pts
            </span>
          </div>
        ))}
        {payload.length === 2 && payload[1].value > 0 && (
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
            <span className="text-[10px] text-gray-500">Score</span>
            <span className="text-[11px] font-bold text-emerald-400">
              {Math.round((payload[0].value / payload[1].value) * 100)}%
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 rounded-2xl border border-white/5 bg-zinc-950/30 p-5.5 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[10.5px] font-bold tracking-widest text-gray-500 uppercase">
          <Trophy className="text-amber-550 h-4 w-4" />
          {label} Analytics
        </h3>
        {score !== null && (
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ring-1',
              score >= 70
                ? 'bg-emerald-500/5 text-emerald-400 ring-emerald-500/20'
                : score >= 40
                  ? 'bg-amber-500/5 text-amber-400 ring-amber-500/20'
                  : 'bg-rose-500/5 text-rose-400 ring-rose-500/20'
            )}
          >
            {score >= 70
              ? 'Elite Performance'
              : score >= 40
                ? 'Passing Rank'
                : 'Needs Focus'}
          </span>
        )}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-4">
        <div className="col-span-1 flex items-center justify-center gap-4 border-b border-white/5 pb-4 sm:justify-start sm:border-r sm:border-b-0 sm:pr-4 sm:pb-0">
          <div className="relative shrink-0">
            <RadialProgress
              pct={score ?? 0}
              size={76}
              stroke={6}
              color={
                score !== null && score >= 70
                  ? '#10b981'
                  : score !== null && score >= 40
                    ? '#f59e0b'
                    : '#8b5cf6'
              }
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[14px] leading-none font-extrabold text-white tabular-nums">
                {score !== null ? `${score}%` : '—'}
              </span>
              <span className="mt-0.5 text-[8px] font-bold tracking-widest text-gray-500 uppercase">
                score
              </span>
            </div>
          </div>
          <div className="text-left">
            <div className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
              Progress
            </div>
            <div className="mt-0.5 text-sm font-bold text-white">
              {score !== null ? `${score}% Complete` : 'No points graded'}
            </div>
          </div>
        </div>

        <div className="col-span-3 grid grid-cols-3 gap-2.5 pl-0 sm:pl-2">
          {[
            {
              label: 'Earned Points',
              value: totalEarned,
              color: 'text-amber-400',
            },
            {
              label: 'Max Points',
              value: totalMax || '—',
              color: 'text-gray-400',
            },
            {
              label: 'Overall Score',
              value: score !== null ? `${score}%` : '—',
              color:
                score >= 70
                  ? 'text-emerald-400'
                  : score >= 40
                    ? 'text-amber-400'
                    : 'text-rose-400',
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-white/5 bg-white/2 p-3 text-left"
            >
              <div className="text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                {label}
              </div>
              <div
                className={cn(
                  'mt-0.5 font-mono text-xl font-bold tracking-tight sm:text-2xl',
                  color
                )}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-bootcamp bar chart */}
      {chartData.length > 0 && (
        <div className="space-y-3 border-t border-white/5 pt-2">
          <p className="text-left text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            Per Bootcamp breakdown
          </p>
          <div
            className="w-full"
            style={{ height: Math.max(120, chartData.length * 48) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                barSize={10}
                barGap={4}
              >
                <defs>
                  <linearGradient id="earnedGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.7} />
                    <stop
                      offset="100%"
                      stopColor="#d97706"
                      stopOpacity={0.95}
                    />
                  </linearGradient>
                  <linearGradient id="maxGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  horizontal={false}
                  stroke="#1e2535"
                  opacity={0.3}
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#4b5563', fontSize: 9, fontWeight: 500 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                  width={90}
                  tickFormatter={(v) =>
                    v.length > 14 ? v.slice(0, 13) + '…' : v
                  }
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.015)' }}
                />
                <Bar
                  dataKey="earned"
                  name="Earned"
                  radius={[0, 3, 3, 0]}
                  fill="url(#earnedGrad)"
                />
                {chartData.some((d) => d.max > 0) && (
                  <Bar
                    dataKey="max"
                    name="Max"
                    radius={[0, 3, 3, 0]}
                    fill="url(#maxGrad)"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sessions Tab ─────────────────────────────────────────────────────────────


export { PointsStatsPanel };
