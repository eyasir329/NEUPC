/**
 * @file Daily practice card component
 * @module DailyPracticeCard
 */

'use client';

import { Target, Star, Flame, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function DailyPracticeCard({
  problem,
  todaySolved,
  dailyGoal,
  weekActivity = [],
  streak = 0,
}) {
  const goalMet = todaySolved >= dailyGoal;
  const remaining = Math.max(0, dailyGoal - todaySolved);
  const data = [
    { name: 'Completed', value: Math.min(todaySolved, dailyGoal) },
    { name: 'Remaining', value: remaining },
  ];
  const COLORS = ['#6366f1', '#27272a'];

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const idx = (today - (6 - i) + 7) % 7;
    const value = weekActivity[i] || 0;
    return { level: Math.min(value, 5), value, dayLabel: days[idx] };
  });

  const getHeatmapColor = (level, isToday) => {
    if (isToday)
      return 'bg-indigo-500 border-indigo-400 shadow-lg shadow-black/40';
    switch (level) {
      case 0:
        return 'bg-white/10 border-white/10';
      case 1:
        return 'bg-emerald-200 border-emerald-300';
      case 2:
        return 'bg-emerald-300 border-emerald-400';
      case 3:
        return 'bg-emerald-400 border-emerald-500';
      case 4:
        return 'bg-emerald-500 border-emerald-600';
      case 5:
        return 'bg-emerald-600 border-emerald-700';
      default:
        return 'bg-white/10 border-white/10';
    }
  };

  const totalWeek = weekData.reduce((acc, curr) => acc + curr.value, 0);
  const avgWeek = (totalWeek / 7).toFixed(1);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_1fr]">
        {/* Daily Practice */}
        <div className="flex h-full flex-col lg:border-r lg:border-white/10 lg:pr-8">
          <div className="mb-1 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-bold tracking-tight text-zinc-100">
              Daily Practice
            </h3>
          </div>
          <p className="mb-6 text-xs font-medium text-zinc-500">
            {goalMet
              ? "Today's goal smashed!"
              : `${remaining} more to hit today's goal`}
          </p>

          <div className="relative flex min-h-[220px] flex-1 flex-col items-center justify-center">
            <div className="absolute inset-0 h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={85}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={0}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="pointer-events-none relative z-10 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                {goalMet ? 'Done' : 'Goal'}
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-4xl font-light text-zinc-100">
                  {todaySolved}
                </span>
                <span className="text-sm font-medium text-zinc-500">
                  / {dailyGoal}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                <Flame className="h-3 w-3 text-amber-500" />
                Streak
              </p>
              <span className="text-lg font-bold text-zinc-100">
                {streak}{' '}
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  days
                </span>
              </span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="text-right">
              <p className="mb-1 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                {goalMet ? 'Status' : 'Remaining'}
              </p>
              <span
                className={`${goalMet ? 'text-emerald-400' : 'text-indigo-400'} text-lg font-bold`}
              >
                {goalMet ? 'Done' : remaining}{' '}
                {!goalMet && (
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                    to go
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Today's Pick */}
          {problem && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 fill-blue-500 text-blue-500" />
                  <h3 className="text-xs font-bold tracking-widest text-zinc-100 uppercase">
                    Today's Pick
                  </h3>
                  <span
                    className={`rounded-lg border px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase ${
                      problem.difficulty === 'Medium'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                        : problem.difficulty === 'Easy'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/10 px-2 py-0.5 text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                    {problem.platform}
                  </span>
                </div>
              </div>

              <div className="group flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <a
                    href={problem.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-2 block cursor-pointer text-base font-bold text-zinc-100 transition-colors group-hover:text-indigo-400"
                  >
                    {problem.title}
                  </a>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-500">
                    {problem.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-lg bg-zinc-600"></span>{' '}
                        {tag}
                      </span>
                    ))}
                    <span className="mx-1 text-zinc-600">|</span>
                    <span className="text-zinc-400">
                      ✓ {problem.solvedBy.toLocaleString()} solved
                    </span>
                    <span className="mx-1 text-zinc-600">|</span>
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Clock className="h-3.5 w-3.5" /> ~{problem.estTime} min
                    </span>
                  </div>
                </div>

                <a
                  href={problem.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/50 px-5 py-2.5 text-center text-xs font-bold tracking-widest text-zinc-100 uppercase shadow-lg shadow-black/40 backdrop-blur-xl transition-colors hover:bg-white/5"
                >
                  <span className="font-mono text-sm leading-none text-indigo-400">
                    {'</>'}
                  </span>{' '}
                  Solve
                </a>
              </div>
            </div>
          )}

          {/* Heatmap */}
          <div className="mt-2 border-t border-white/10 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                Last 7 Days
              </h4>
              <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                <span className="text-xs text-zinc-100">{totalWeek}</span>{' '}
                solved <span className="mx-1 text-zinc-500">&bull;</span> avg{' '}
                <span className="text-xs text-zinc-100">{avgWeek}</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-3">
              {weekData.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className={`h-8 w-full rounded-2xl border ${getHeatmapColor(day.level, i === 6)} cursor-pointer transition-all hover:scale-105`}
                    title={`${day.value} solved`}
                  ></div>
                  <span
                    className={`text-[10px] font-bold tracking-widest uppercase ${i === 6 ? 'text-indigo-400' : 'text-zinc-500'}`}
                  >
                    {day.dayLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
