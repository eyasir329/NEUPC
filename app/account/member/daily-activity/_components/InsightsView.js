/**
 * @file Insights tab for Daily Activity — the productivity dashboard.
 *   Renders four panels: the rank/XP standing card (driven by the shared
 *   {@link getKarmaLevel} ladder), today's focus tasks (overdue + due-today
 *   + undated), a 53-week completion heatmap, and a daily/weekly velocity
 *   chart. All figures derive from the `tasks` and `karma` props; this view
 *   is read-only apart from toggling a focus task complete.
 *
 * @module daily-activity/InsightsView
 */

'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, ChevronRight, Award, Trophy, Flag, Clock, Tag, RefreshCw, Check, Flame, Zap } from 'lucide-react';
import { Priority, getKarmaLevel, subtasksForDate, fmt24 } from './utils';
import { getTodayDateString, formatDateString, addDays } from './utils';

export default function InsightsView({ tasks, karma, labels, onSelectTask, onToggleComplete }) {
  const [velocityMode, setVelocityMode] = useState('daily');
  const todayStr = getTodayDateString();

  const levelInfo = getKarmaLevel(karma.score);

  const completedTodayCount = tasks.filter(
    (t) => t.completed && t.completedAt && t.completedAt.startsWith(todayStr)
  ).length;

  const pastWeekDates = Array.from({ length: 7 }, (_, i) => formatDateString(addDays(new Date(), -i)));

  const completedThisWeekCount = tasks.filter(
    (t) => t.completed && t.completedAt && pastWeekDates.some((d) => t.completedAt.startsWith(d))
  ).length;

  const dailyGoalProgress = Math.min(100, (completedTodayCount / karma.dailyGoal) * 100);
  const weeklyGoalProgress = Math.min(100, (completedThisWeekCount / karma.weeklyGoal) * 100);

  const focusTasks = tasks
    .filter((t) => !t.isArchived && !t.completed && (t.dueDate === todayStr || !t.dueDate))
    .slice(0, 5);

  const getHeatmapGrid = () => {
    const currentDayOfWeek = new Date().getDay();
    const totalDaysToRender = 371;
    const grid = [];

    const dateCounts = {};

    karma.history?.forEach((h) => {
      dateCounts[h.date] = (dateCounts[h.date] || 0) + h.completedCount;
    });

    tasks.forEach((t) => {
      if (t.completed && t.completedAt) {
        const dStr = t.completedAt.substring(0, 10);
        dateCounts[dStr] = (dateCounts[dStr] || 0) + 1;
      }
    });

    const baseDate = addDays(new Date(), -totalDaysToRender + currentDayOfWeek + 1);

    for (let i = 0; i < totalDaysToRender; i++) {
      const cellDateValue = addDays(baseDate, i);
      const cellDateStr = formatDateString(cellDateValue);
      const completionCount = dateCounts[cellDateStr] || 0;
      grid.push({
        date: cellDateStr,
        count: completionCount,
        dayOfWeek: cellDateValue.getDay(),
      });
    }

    return grid;
  };

  const heatmapGrid = getHeatmapGrid();
  const totalCompletedCompletions = tasks.filter((t) => t.completed).length;

  const heatmapWeeks = [];
  for (let i = 0; i < heatmapGrid.length; i += 7) {
    heatmapWeeks.push(heatmapGrid.slice(i, i + 7));
  }

  const getHeatmapColor = (count) => {
    if (count === 0) return 'bg-white/[0.04] border border-white/5';
    if (count === 1) return 'bg-emerald-500/20';
    if (count === 2) return 'bg-emerald-500/40';
    if (count === 3) return 'bg-emerald-500/70';
    return 'bg-emerald-500';
  };

  const getVelocityChartData = () => {
    if (velocityMode === 'daily') {
      const past10Days = Array.from({ length: 10 }, (_, i) => {
        const d = addDays(new Date(), -9 + i);
        return formatDateString(d);
      });

      const counts = {};
      karma.history?.forEach((h) => {
        counts[h.date] = (counts[h.date] || 0) + h.completedCount;
      });
      tasks.forEach((t) => {
        if (t.completed && t.completedAt) {
          const dStr = t.completedAt.substring(0, 10);
          counts[dStr] = (counts[dStr] || 0) + 1;
        }
      });

      return past10Days.map((dateStr) => {
        const d = new Date(dateStr + 'T12:00:00');
        const shortLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        return {
          name: shortLabel,
          completions: counts[dateStr] || 0,
          dateStr,
        };
      });
    } else {
      const data = [];
      const counts = {};
      karma.history?.forEach((h) => {
        counts[h.date] = (counts[h.date] || 0) + h.completedCount;
      });
      tasks.forEach((t) => {
        if (t.completed && t.completedAt) {
          const dStr = t.completedAt.substring(0, 10);
          counts[dStr] = (counts[dStr] || 0) + 1;
        }
      });

      for (let w = 4; w >= 0; w--) {
        let total = 0;
        for (let d = 0; d < 7; d++) {
          const pastDate = addDays(new Date(), -(w * 7) - d);
          const pastStr = formatDateString(pastDate);
          total += counts[pastStr] || 0;
        }
        data.push({
          name: `Wk -${w}`,
          completions: total,
        });
      }
      return data;
    }
  };

  const chartData = getVelocityChartData();

  return (
    <div className="space-y-6" id="insights-view">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="bg-gray-900 rounded-xl border border-white/5 p-6 flex flex-col justify-between col-span-1 lg:col-span-5" id="prod-standing">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300 font-mono tracking-wider uppercase block font-black">Productivity Status</span>
                <h3 className="text-xl font-extrabold font-display text-white mt-1 tracking-tight">Productivity Standing</h3>
              </div>
              <div className="p-2.5 bg-gradient-to-br from-violet-500/15 to-purple-500/10 rounded-xl border border-violet-500/20 text-violet-400">
                <Trophy className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-6">
              <span className="text-[10px] text-slate-500 block font-mono font-black tracking-widest">RANK CLASS</span>
              <span className="text-3xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300 block tracking-tight mt-1">
                {levelInfo.level}
              </span>
            </div>

            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400 font-bold">XP Progress</span>
                <span className="text-white font-black">{karma.score} / {levelInfo.maxXP} XP</span>
              </div>
              <div className="w-full bg-white/[0.04] rounded-full h-3 overflow-hidden border border-white/5">
                <div className="bg-gradient-to-r from-violet-600 to-violet-400 h-full rounded-full transition-all duration-500" style={{ width: `${levelInfo.progress}%` }} />
              </div>
              <span className="text-[10px] text-violet-400 block text-right font-bold">
                ✨ {levelInfo.nextGoal} XP to {levelInfo.level === 'Grandmaster' ? 'Ascension' : levelInfo.nextLevel}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-white/5 pt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span className="font-black">DAILY</span>
                  <span className="text-emerald-400 font-black">{completedTodayCount}/{karma.dailyGoal}</span>
                </div>
                <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-300" style={{ width: `${dailyGoalProgress}%` }} />
                </div>
              </div>

              <div className="space-y-1.5 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span className="font-black">WEEKLY</span>
                  <span className="text-sky-400 font-black">{completedThisWeekCount}/{karma.weeklyGoal}</span>
                </div>
                <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-sky-500 to-sky-400 h-full rounded-full transition-all duration-300" style={{ width: `${weeklyGoalProgress}%` }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-[11px] text-slate-400 bg-gradient-to-r from-white/[0.03] to-white/[0.01] p-3 rounded-xl border border-white/5 font-medium leading-relaxed">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Complete tasks daily to compound your streak and earn rank achievements!</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-white/5 p-6 flex flex-col col-span-1 lg:col-span-7" id="today-focus">
          <div className="flex justify-between items-start pb-4 border-b border-white/5">
            <div>
              <span className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400 font-mono tracking-wider uppercase block font-black">Critical & Overdue Actions</span>
              <h3 className="text-lg font-extrabold text-white mt-1 tracking-tight">Today&apos;s Focus Tasks</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {focusTasks.filter((t) => t.dueDate && t.dueDate < todayStr).length > 0 && (
                <span className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black font-mono rounded-lg flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {focusTasks.filter((t) => t.dueDate && t.dueDate < todayStr).length} overdue
                </span>
              )}
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black font-mono rounded-lg flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {focusTasks.length} pending
              </span>
            </div>
          </div>

          <div className="flex-1 mt-3 space-y-2 overflow-y-auto max-h-[300px] pr-1 no-scrollbar">
            {focusTasks.length === 0 ? (
              <div className="h-full min-h-[140px] flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-3">
                  <div className="p-3.5 bg-gradient-to-br from-emerald-500/10 to-slate-900 border border-emerald-500/10 rounded-2xl text-emerald-500/50">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                </div>
                <span className="text-xs font-bold text-slate-200">All clear — no pending focus tasks!</span>
                <span className="text-[9px] font-mono text-slate-500 mt-1">Your productivity slate is clean for today.</span>
              </div>
            ) : (
              focusTasks.map((task) => {
                const isOverdue = task.dueDate && task.dueDate < todayStr;
                const priColor = task.priority === Priority.P1 ? '#ef4444' : task.priority === Priority.P2 ? '#f59e0b' : task.priority === Priority.P3 ? '#3b82f6' : '#64748b';
                const subs = subtasksForDate(task, todayStr);
                const hasSubs = subs.length > 1;
                const subsDone = subs.filter((s) => s.completed).length;
                const subsPercent = subs.length > 0 ? Math.round((subsDone / subs.length) * 100) : 0;

                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                    style={{ borderColor: isOverdue ? '#ef444440' : priColor + '25', backgroundColor: isOverdue ? '#ef44440a' : priColor + '08' }}
                    className="relative flex items-start gap-3 pl-4 pr-3 py-3 border rounded-2xl group select-none cursor-pointer transition-all duration-150 hover:translate-x-0.5 hover:brightness-110"
                  >
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full" style={{ backgroundColor: isOverdue ? '#ef4444' : priColor }} />

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id); }}
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all hover:scale-110 mt-0.5 text-transparent hover:text-white/30"
                      style={{ borderColor: priColor + '80' }}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {task.priority <= Priority.P2 && (
                          <Flag className="w-3 h-3 shrink-0 fill-current" style={{ color: priColor }} />
                        )}
                        <span className="text-[11.5px] font-bold text-slate-100 truncate flex-1 min-w-0 leading-snug tracking-tight" title={task.title}>
                          {task.title}
                        </span>
                        {isOverdue && (
                          <span className="text-[7.5px] font-black font-mono tracking-widest uppercase px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/25 shrink-0">OVERDUE</span>
                        )}
                        {hasSubs && (
                          <span className="text-[8px] font-mono font-black px-1.5 py-0.5 rounded-full border shrink-0" style={{ color: priColor, borderColor: priColor + '40', backgroundColor: priColor + '15' }}>
                            {subsDone}/{subs.length}
                          </span>
                        )}
                      </div>

                      {hasSubs && (
                        <div className="mt-1.5 w-full h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${subsPercent}%`, backgroundColor: priColor }} />
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {task.time && (
                          <span className="inline-flex items-center gap-1 text-[8.5px] font-mono font-black rounded-md px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.06]" style={{ color: priColor }}>
                            <Clock className="w-2.5 h-2.5" />
                            {fmt24(task.time)}{task.endTime ? ` – ${fmt24(task.endTime)}` : ''}
                          </span>
                        )}
                        {task.recurrence?.freq && (
                          <span className="inline-flex items-center gap-0.5 text-[8px] font-black font-mono text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-md leading-none">
                            <RefreshCw className="w-2 h-2" />
                            {task.recurrence.freq === 'daily' ? 'Daily' : task.recurrence.freq === 'weekly' ? 'Weekly' : task.recurrence.freq === 'monthly' ? 'Monthly' : 'Repeat'}
                          </span>
                        )}
                        {task.labels && task.labels.length > 0 && task.labels.slice(0, 2).map((lbl) => (
                          <span key={`focus-lbl-${task.id}-${lbl}`} className="inline-flex items-center gap-0.5 text-[8px] font-semibold text-slate-400 bg-white/[0.03] border border-white/[0.05] px-1.5 py-0.5 rounded-md leading-none">
                            <Tag className="w-2 h-2 shrink-0 text-slate-500" />
                            {lbl}
                          </span>
                        ))}
                      </div>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition shrink-0 mt-1" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-white/5 p-6" id="heatmap-panel">
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div>
            <span className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-mono tracking-wider uppercase block font-black">365 Days Contributions</span>
            <h3 className="text-lg font-extrabold text-white mt-1 tracking-tight">Solves & Completions Heatmap</h3>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 block">{totalCompletedCompletions}</span>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider block font-black">TOTAL COMPLETIONS</span>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto pb-2 scrollbar-thin">
          <div className="flex flex-col gap-[3px] min-w-[720px]">
            <div className="flex gap-[3px]" style={{ width: 'fit-content' }}>
              {heatmapWeeks.map((week, wIdx) => (
                <div key={`week-col-${wIdx}`} className="flex flex-col gap-[3px]">
                  {week.map((cell, cIdx) => (
                    <div
                      key={`cell-${wIdx}-${cIdx}`}
                      className={`w-[9px] h-[9px] rounded-[1.5px] transition ${getHeatmapColor(cell.count)}`}
                      title={`${cell.count} task solves on ${cell.date}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-3 text-[10px] font-mono text-slate-500">
          <span className="font-bold">{heatmapGrid[0]?.date} → Present</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">Less</span>
            <div className="w-[9px] h-[9px] rounded-[2px] bg-white/[0.04] border border-white/5" />
            <div className="w-[9px] h-[9px] rounded-[2px] bg-emerald-500/20" />
            <div className="w-[9px] h-[9px] rounded-[2px] bg-emerald-500/40" />
            <div className="w-[9px] h-[9px] rounded-[2px] bg-emerald-500/70" />
            <div className="w-[9px] h-[9px] rounded-[2px] bg-emerald-500" />
            <span className="font-bold">More</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-white/5 p-6" id="velocity-analysis">
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div>
            <span className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 font-mono tracking-wider uppercase block font-black">Activity Flow & Momentum</span>
            <h3 className="text-lg font-extrabold text-white mt-1 tracking-tight">Velocity Analysis</h3>
          </div>
          <div className="flex bg-white/[0.04] p-0.5 border border-white/5 rounded-xl text-xs">
            <button
              onClick={() => setVelocityMode('daily')}
              className={`px-3 py-1.5 font-mono rounded-lg font-black text-[10px] tracking-wider transition ${velocityMode === 'daily' ? 'bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              DAILY FLOW
            </button>
            <button
              onClick={() => setVelocityMode('weekly')}
              className={`px-3 py-1.5 font-mono rounded-lg font-black text-[10px] tracking-wider transition ${velocityMode === 'weekly' ? 'bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              WEEKLY MOMENTUM
            </button>
          </div>
        </div>

        <div className="mt-6 h-64" id="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#182032',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '11px',
                }}
              />
              <Area type="monotone" dataKey="completions" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#velocityGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
