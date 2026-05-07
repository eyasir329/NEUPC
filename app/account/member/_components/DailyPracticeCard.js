/**
 * @file Daily practice — recommended problem of the day with one-click jump.
 *   Hero: circular goal ring + streak/remaining stats.
 *   Body: featured recommended problem (primary CTA).
 *   Footer: compact 7-day activity strip with goal line.
 * @module DailyPracticeCard
 */

'use client';

import {
  Target,
  Code2,
  Tag,
  TrendingUp,
  Clock,
  Flame,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard, SectionHeader, Pill, ActionButton } from './_ui';

const DIFFICULTY_TONE = {
  Easy: 'emerald',
  Medium: 'amber',
  Hard: 'rose',
  Expert: 'violet',
};

function GoalRing({ value, max, met }) {
  const size = 92;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  const dash = c * pct;
  const ringColor = met ? '#34d399' : '#22d3ee';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - dash }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 6px ${ringColor}66)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {met ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : (
          <span className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            Goal
          </span>
        )}
        <span className="font-mono text-base font-bold tabular-nums text-white">
          {value}
          <span className="text-gray-500">/{max}</span>
        </span>
      </div>
    </div>
  );
}

function ActivityStrip({ data, goal }) {
  const max = Math.max(...data, goal, 1);
  const today = new Date().getDay();
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const labels = Array.from({ length: data.length }, (_, i) => {
    const idx = (today - (data.length - 1 - i) + 7) % 7;
    return dayLabels[idx];
  });
  const total = data.reduce((a, b) => a + b, 0);
  const avg = (total / data.length).toFixed(1);
  const goalPct = (goal / max) * 100;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
      <div className="mb-2 flex items-center justify-between text-[10px]">
        <span className="font-medium tracking-wider text-gray-500 uppercase">
          Last 7 days
        </span>
        <div className="flex items-center gap-2.5 font-mono tabular-nums text-gray-400">
          <span>
            <span className="text-white">{total}</span> solved
          </span>
          <span className="text-gray-600">·</span>
          <span>
            avg <span className="text-white">{avg}</span>
          </span>
        </div>
      </div>
      <div className="relative">
        <div
          className="pointer-events-none absolute right-0 left-0 z-10 border-t border-dashed border-emerald-400/25"
          style={{ bottom: `calc(${goalPct}% + 14px)` }}
          aria-hidden
        />
        <div className="flex h-16 items-end gap-1">
          {data.map((v, i) => {
            const isToday = i === data.length - 1;
            const hit = v >= goal;
            const tone = isToday
              ? hit
                ? 'bg-gradient-to-t from-emerald-500/80 to-emerald-300/90'
                : 'bg-gradient-to-t from-cyan-500/80 to-cyan-300/90'
              : hit
                ? 'bg-emerald-500/40'
                : 'bg-white/[0.08]';
            return (
              <div
                key={i}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(v / max) * 100}%` }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: 'easeOut' }}
                  className={`w-full rounded-sm ${tone} ${
                    isToday ? 'ring-1 ring-white/40' : ''
                  }`}
                  style={{ minHeight: v > 0 ? '4px' : '2px' }}
                  title={`${v} problems`}
                />
                <span
                  className={`text-[9px] ${
                    isToday ? 'font-bold text-white' : 'text-gray-600'
                  }`}
                >
                  {labels[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DailyPracticeCard({
  problem,
  todaySolved,
  dailyGoal,
  weekActivity = [],
  streak = 0,
}) {
  const goalMet = todaySolved >= dailyGoal;
  const remaining = Math.max(0, dailyGoal - todaySolved);
  const tone = DIFFICULTY_TONE[problem?.difficulty] ?? 'blue';

  return (
    <GlassCard padding="p-5" className="flex h-full flex-col">
      <SectionHeader
        icon={Target}
        title="Daily Practice"
        subtitle={
          goalMet
            ? "Today's goal smashed — bonus XP unlocked"
            : `${remaining} more ${remaining === 1 ? 'problem' : 'problems'} to hit today's goal`
        }
        accent={goalMet ? 'emerald' : 'cyan'}
        action={
          goalMet ? (
            <Pill tone="emerald" icon={Sparkles}>
              +50 XP
            </Pill>
          ) : null
        }
      />

      {/* Hero: ring + stats */}
      <div className="mb-4 flex items-center gap-4 rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-4">
        <GoalRing value={todaySolved} max={dailyGoal} met={goalMet} />
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-gray-500 uppercase">
              <Flame className="h-3 w-3 text-orange-400" />
              Streak
            </div>
            <div className="mt-0.5 font-mono text-lg font-bold tabular-nums text-white">
              {streak}
              <span className="ml-0.5 text-[10px] font-medium text-gray-500">
                days
              </span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium tracking-wider text-gray-500 uppercase">
              {goalMet ? 'Status' : 'Remaining'}
            </div>
            <div
              className={`mt-0.5 font-mono text-lg font-bold tabular-nums ${
                goalMet ? 'text-emerald-400' : 'text-cyan-400'
              }`}
            >
              {goalMet ? 'Done' : remaining}
              {!goalMet && (
                <span className="ml-0.5 text-[10px] font-medium text-gray-500">
                  to go
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended problem — primary action */}
      {problem && (
        <motion.a
          href={problem.href}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="group relative mb-4 block overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-cyan-500/[0.06] via-white/[0.02] to-transparent p-4 transition-all hover:border-cyan-400/30 hover:from-cyan-500/[0.1]"
        >
          <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl transition-opacity group-hover:bg-cyan-400/20" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider text-cyan-400 uppercase">
                  <Sparkles className="h-3 w-3" />
                  Today's Pick
                </span>
                <Pill tone={tone}>{problem.difficulty}</Pill>
                <Pill tone="gray">{problem.platform}</Pill>
              </div>
              <h4 className="line-clamp-2 text-sm font-semibold text-white group-hover:text-cyan-50">
                {problem.title}
              </h4>
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {problem.tags.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-gray-400"
                  >
                    <Tag className="h-2.5 w-2.5 opacity-50" />
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-2.5 flex items-center gap-3 text-[10.5px] text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {problem.solvedBy.toLocaleString()} solved
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~{problem.estTime} min
                </span>
              </div>
            </div>
            <ActionButton
              tone="primary"
              icon={Code2}
              className="shrink-0 self-start group-hover:border-cyan-400/50 group-hover:bg-cyan-500/20"
            >
              Solve
            </ActionButton>
          </div>
        </motion.a>
      )}

      {/* Activity strip */}
      {weekActivity.length > 0 && (
        <div className="mt-auto">
          <ActivityStrip data={weekActivity} goal={dailyGoal} />
        </div>
      )}
    </GlassCard>
  );
}
