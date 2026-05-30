/**
 * @file System metrics panel — four secondary KPIs (user growth, event
 *   participation, mentor response, uptime) shown as dark-glass cards
 *   with trend indicators. Matches the member panel visual language.
 * @module SystemMetrics
 */

'use client';

import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const COLOR_MAP = {
  green: 'text-emerald-400',
  blue: 'text-blue-400',
  purple: 'text-violet-400',
  cyan: 'text-cyan-400',
  amber: 'text-amber-400',
  red: 'text-rose-400',
};

const BADGE_MAP = {
  up: 'bg-emerald-500/10 text-emerald-300',
  down: 'bg-rose-500/10 text-rose-300',
  stable: 'bg-white/10 text-zinc-400',
};

function TrendBadge({ trend }) {
  const Icon =
    trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const label = trend === 'up' ? 'Up' : trend === 'down' ? 'Down' : 'Stable';
  return (
    <div
      className={`flex items-center gap-1 rounded-2xl px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${BADGE_MAP[trend] ?? BADGE_MAP.stable}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </div>
  );
}

export default function SystemMetrics({ systemStats }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-8">
      {systemStats.map((stat, idx) => (
        <div
          key={idx}
          className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl transition-all hover:border-white/20"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              {stat.label}
            </p>
            <TrendBadge trend={stat.trend} />
          </div>
          <p
            className={`text-3xl font-light ${COLOR_MAP[stat.color] ?? 'text-zinc-100'}`}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
