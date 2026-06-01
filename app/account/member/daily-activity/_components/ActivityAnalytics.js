'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Award,
  Sparkles,
  Calendar,
  TrendingUp,
  CheckCircle2,
  CircleDot,
  Check,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { GlassCard } from '@/app/account/_components/ui';

// Helper: YYYY-MM-DD
function dateKey(d) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

export default function ActivityAnalytics({
  todos = [],
  completions = {},
  karma = { score: 0, level: 'Beginner', dailyGoal: 5, weeklyGoal: 25 },
  setKarma,
  onToggleTodo,
  groupById,
}) {
  const [chartRange, setChartRange] = useState('weekly'); // weekly | monthly

  // 1. Calculate stats & completions by date
  const completionsByDate = useMemo(() => {
    const counts = {};
    Object.entries(completions || {}).forEach(([todoId, byDate]) => {
      Object.keys(byDate || {}).forEach((dKey) => {
        counts[dKey] = (counts[dKey] || 0) + 1;
      });
    });
    return counts;
  }, [completions]);

  // Today's completion count
  const todayKey = useMemo(() => dateKey(new Date()), []);
  const todayCompletionsCount = useMemo(() => {
    return completionsByDate[todayKey] || 0;
  }, [completionsByDate, todayKey]);

  // 2. Heatmap: 365 Days Grid (53 weeks * 7 days)
  const heatmapData = useMemo(() => {
    const cols = [];
    const end = new Date();
    // Sunday of 52 weeks ago
    const start = new Date();
    start.setDate(start.getDate() - 364);
    const startDay = start.getDay();
    start.setDate(start.getDate() - startDay); // Shift to Sunday

    let current = new Date(start);
    let totalCompletions = 0;

    for (let w = 0; w < 53; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const key = dateKey(current);
        const count = completionsByDate[key] || 0;
        totalCompletions += count;

        let level = 0;
        if (count > 0) {
          if (count <= 1) level = 1;
          else if (count <= 2) level = 2;
          else if (count <= 4) level = 3;
          else level = 4;
        }

        col.push({
          date: new Date(current),
          dateStr: key,
          count,
          level,
        });

        current = new Date(current);
        current.setDate(current.getDate() + 1);
      }
      cols.push(col);
    }
    return { cols, totalCompletions };
  }, [completionsByDate]);

  // 3. Progress Chart Data (Velocity of past 10 days/weeks)
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    if (chartRange === 'weekly') {
      // Past 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = dateKey(d);
        data.push({
          label: d.toLocaleDateString(undefined, { weekday: 'short' }),
          completions: completionsByDate[key] || 0,
        });
      }
    } else {
      // Past 8 weeks
      for (let i = 7; i >= 0; i--) {
        const start = new Date();
        start.setDate(today.getDate() - (i * 7 + today.getDay())); // start of week
        let weekCompletions = 0;
        
        for (let d = 0; d < 7; d++) {
          const cur = new Date(start);
          cur.setDate(start.getDate() + d);
          weekCompletions += completionsByDate[dateKey(cur)] || 0;
        }

        data.push({
          label: `W-${i}`,
          completions: weekCompletions,
        });
      }
    }
    return data;
  }, [completionsByDate, chartRange]);

  // 4. Focus List: Overdue or High-Priority Tasks due Today
  const focusTasks = useMemo(() => {
    const list = [];
    todos.forEach((t) => {
      const isDone = completions[t.id]?.[todayKey];
      
      // High priority or due today/overdue
      const isHigh = t.priority === 'high';
      const isDueToday = t.startKey === todayKey;
      const isOverdue = t.startKey < todayKey && !isDone;

      if (!isDone && (isHigh || isDueToday || isOverdue)) {
        list.push({
          todo: t,
          isOverdue,
          isDueToday,
        });
      }
    });
    // Limit to 5 tasks
    return list.slice(0, 5);
  }, [todos, completions, todayKey]);

  // XP to next level (mockup progress calculation)
  const xpInfo = useMemo(() => {
    const score = karma.score || 0;
    let rank = 'Beginner';
    let base = 0;
    let next = 100;
    
    if (score >= 5000) {
      rank = 'Grandmaster';
      base = 5000;
      next = 10000;
    } else if (score >= 2500) {
      rank = 'Expert';
      base = 2500;
      next = 5000;
    } else if (score >= 1000) {
      rank = 'Professional';
      base = 1000;
      next = 2500;
    } else if (score >= 500) {
      rank = 'Intermediate';
      base = 500;
      next = 1000;
    }

    const pct = Math.min(100, Math.round(((score - base) / (next - base)) * 100));
    return { rank, pct, next, score, base };
  }, [karma.score]);

  // Streak estimation: count consecutive active completion days backwards from today
  const streaks = useMemo(() => {
    let dayCount = 0;
    const cur = new Date();
    
    // Check if at least active today or yesterday to continue streak
    const todayDone = (completionsByDate[dateKey(cur)] || 0) > 0;
    cur.setDate(cur.getDate() - 1);
    const yesterdayDone = (completionsByDate[dateKey(cur)] || 0) > 0;

    if (todayDone || yesterdayDone) {
      dayCount = todayDone ? 1 : 0;
      let check = new Date();
      if (!todayDone) check.setDate(check.getDate() - 1); // Start from yesterday

      while (true) {
        check.setDate(check.getDate() - 1);
        const done = (completionsByDate[dateKey(check)] || 0) > 0;
        if (done) {
          dayCount++;
        } else {
          break;
        }
      }
    }
    return dayCount;
  }, [completionsByDate]);

  return (
    <div className="space-y-6">
      {/* Upper Grid: Gamification Card + Focus Board */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Card: Premium Streak & Gamification */}
        <div className="lg:col-span-5 flex flex-col">
          <GlassCard className="flex-1 flex flex-col justify-between overflow-hidden relative border-white/5 bg-[#111625] p-6">
            {/* Glowing background gradient */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-violet-600/10 blur-[100px] pointer-events-none rounded-full" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-600/10 blur-[100px] pointer-events-none rounded-full" />

            <div className="relative z-10 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-2 text-violet-400">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">Productivity Standing</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Gamified Milestones</p>
                  </div>
                </div>
                {streaks > 0 && (
                  <div className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.15)] animate-bounce">
                    <Flame className="h-3.5 w-3.5 fill-current" />
                    <span>{streaks} Day Streak</span>
                  </div>
                )}
              </div>

              {/* Progress & Score */}
              <div className="space-y-3 py-1">
                <div className="flex items-end justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Rank Class</span>
                    <span className="text-xl font-bold bg-linear-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent block">
                      {xpInfo.rank}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase block">XP Score</span>
                    <span className="text-2xl font-black text-white font-mono">{xpInfo.score} <span className="text-xs font-normal text-gray-400">XP</span></span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full border border-white/[0.04] bg-white/[0.02] overflow-hidden p-[1px]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${xpInfo.pct}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="h-full rounded-full bg-linear-to-r from-violet-500 to-indigo-400 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>{xpInfo.base} XP</span>
                    <span>{xpInfo.pct}% to Level-Up</span>
                    <span>{xpInfo.next} XP</span>
                  </div>
                </div>
              </div>

              {/* Goals Achievements */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 text-center transition-all hover:bg-white/[0.03]">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase block">Daily Goal</span>
                  <span className="text-xl font-bold text-white font-mono mt-1 block">
                    {todayCompletionsCount} <span className="text-xs font-normal text-gray-500">/ {karma.dailyGoal}</span>
                  </span>
                  <div className="mt-2 w-full bg-white/[0.04] h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, (todayCompletionsCount / karma.dailyGoal) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 text-center transition-all hover:bg-white/[0.03]">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase block">Weekly Goal</span>
                  <span className="text-xl font-bold text-white font-mono mt-1 block">
                    {Object.values(completionsByDate).slice(0, 7).reduce((acc, c) => acc + c, 0)} <span className="text-xs font-normal text-gray-500">/ {karma.weeklyGoal}</span>
                  </span>
                  <div className="mt-2 w-full bg-white/[0.04] h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (Object.values(completionsByDate).slice(0, 7).reduce((acc, c) => acc + c, 0) / karma.weeklyGoal) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Subtext info */}
            <div className="relative z-10 flex items-center gap-1.5 rounded-lg border border-violet-500/10 bg-violet-500/[0.02] p-2.5 text-[11px] text-gray-400 mt-4">
              <Sparkles className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              <span>Complete tasks daily to compound your streak and earn huge rank achievements!</span>
            </div>
          </GlassCard>
        </div>

        {/* Right Card: Focus Board (Today's Key Actions) */}
        <div className="lg:col-span-7 flex flex-col">
          <GlassCard className="flex-1 flex flex-col justify-between border-white/5 bg-[#111625] p-6">
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
                    <CircleDot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">Today&apos;s Focus Tasks</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Critical & Overdue Actions</p>
                  </div>
                </div>
                <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-xs text-gray-400">
                  {focusTasks.length} pending
                </span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto space-y-2 min-h-[160px] max-h-[220px] scrollbar-thin">
                <AnimatePresence initial={false}>
                  {focusTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500 h-full">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500/30 mb-2" />
                      <p className="text-xs">Amazing work! All focus objectives are complete.</p>
                    </div>
                  ) : (
                    focusTasks.map(({ todo, isOverdue }) => {
                      const group = groupById[todo.groupId];
                      return (
                        <motion.div
                          key={todo.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`flex items-center justify-between rounded-xl border p-3 transition duration-150 ${
                            isOverdue
                              ? 'border-rose-500/10 bg-rose-500/[0.02] hover:bg-rose-500/[0.04]'
                              : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => onToggleTodo(todo.id, todayKey)}
                              className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border border-white/20 transition hover:border-emerald-400 hover:bg-emerald-500/10"
                            >
                              <Check className="h-3 w-3 text-transparent hover:text-emerald-400" />
                            </button>
                            <div className="min-w-0">
                              <h4 className="text-xs font-semibold text-gray-200 truncate pr-2">
                                {todo.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                                {isOverdue && (
                                  <span className="rounded bg-rose-500/10 border border-rose-500/20 px-1 py-0.2 text-[9px] font-bold text-rose-400 uppercase">
                                    Overdue
                                  </span>
                                )}
                                {todo.time && <span className="text-gray-500">{todo.time}</span>}
                                {group && (
                                  <span className="flex items-center gap-1 text-gray-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                                    {group.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-600 shrink-0" />
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Middle Block: Heatmap Contribution Grid */}
      <GlassCard className="border-white/5 bg-[#111625] p-6">
        <div className="space-y-4">
          {/* Heatmap Header */}
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-200">Solves & Completions Heatmap</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">365 Days Contributions</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-gray-400">
                Total Solves: <span className="text-white font-bold">{heatmapData.totalCompletions}</span>
              </span>
            </div>
          </div>

          {/* Grid visual container */}
          <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 overflow-x-auto w-full pb-2">
            <div className="flex flex-col gap-2.5 min-w-[720px]">
              {/* Months Headers */}
              <div className="flex pt-1 pl-8 text-[9px] font-bold tracking-widest text-gray-500 uppercase font-mono">
                {[
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                ].map((m) => (
                  <div key={m} style={{ flex: 1 }}>
                    {m}
                  </div>
                ))}
              </div>

              {/* Rows: Weekdays & Grid block cells */}
              <div className="flex gap-3">
                {/* Weekdays Labels */}
                <div className="flex flex-col justify-between py-1 text-[9px] font-bold tracking-widest text-gray-500 uppercase font-mono">
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                </div>

                {/* Heatmap cells */}
                <div className="flex flex-1 gap-[3px]">
                  {heatmapData.cols.map((col, cIdx) => (
                    <div key={cIdx} className="flex flex-col gap-[3px]">
                      {col.map((cell, rIdx) => {
                        const cellColors = [
                          'bg-white/[0.01] hover:bg-white/[0.05]', // level 0
                          'bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/10', // level 1
                          'bg-emerald-500/30 hover:bg-emerald-500/45 border border-emerald-500/10', // level 2
                          'bg-emerald-500/60 hover:bg-emerald-500/75 shadow-[0_0_8px_rgba(16,185,129,0.2)]', // level 3
                          'bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]', // level 4
                        ];

                        return (
                          <div
                            key={rIdx}
                            title={cell.count > 0 ? `${cell.count} task completed on ${cell.date.toLocaleDateString()}` : `No completions on ${cell.date.toLocaleDateString()}`}
                            className={`h-2.5 w-2.5 rounded-[2px] transition-all duration-150 cursor-pointer ${
                              cellColors[cell.level]
                            }`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Legend and scale footer */}
          <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 text-[9px] font-bold tracking-widest text-gray-500 uppercase font-mono">
            <span>Velocity Index</span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className="flex gap-[3px]">
                <div className="h-2 w-2 rounded-[1px] bg-white/[0.02]" />
                <div className="h-2 w-2 rounded-[1px] bg-emerald-500/15" />
                <div className="h-2 w-2 rounded-[1px] bg-emerald-500/30" />
                <div className="h-2 w-2 rounded-[1px] bg-emerald-500/60" />
                <div className="h-2 w-2 rounded-[1px] bg-emerald-400" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Lower Block: Active Productivity Chart */}
      <GlassCard className="border-white/5 bg-[#111625] p-6">
        <div className="space-y-6">
          {/* Header Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.04] pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-200">Velocity Analysis</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Activity Flow & Momentum</p>
              </div>
            </div>

            {/* Chart toggle buttons */}
            <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5 self-start">
              {[
                { v: 'weekly', l: 'Daily Flow' },
                { v: 'monthly', l: 'Weekly momentum' },
              ].map((b) => (
                <button
                  key={b.v}
                  type="button"
                  onClick={() => setChartRange(b.v)}
                  className={`rounded-md px-3 py-1 text-[10px] font-bold tracking-wide uppercase transition ${
                    chartRange === b.v
                      ? 'bg-white/[0.08] text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {b.l}
                </button>
              ))}
            </div>
          </div>

          {/* Area Chart visualization */}
          <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: '#71717a', fontFamily: 'monospace' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: '#71717a', fontFamily: 'monospace' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    borderColor: 'rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                  itemStyle={{ color: '#34d399' }}
                  labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                />
                <Area
                  type="monotone"
                  dataKey="completions"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompletions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
