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
import { CheckCircle2, ChevronRight, Award, Trophy } from 'lucide-react';
import { Priority, getKarmaLevel } from './utils';
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
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">PRODUCTIVITY STATUS</span>
                <h3 className="text-xl font-bold font-display text-white mt-1">Productivity Standing</h3>
              </div>
              <div className="p-2.5 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
                <Trophy className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-6">
              <span className="text-[11px] text-slate-400 block font-mono">RANK CLASS</span>
              <span className="text-3xl font-black font-display text-violet-400 block tracking-tight mt-1">
                {levelInfo.level}
              </span>
            </div>

            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">XP Progress</span>
                <span className="text-white font-bold">{karma.score} / {levelInfo.maxXP} XP</span>
              </div>
              <div className="w-full bg-white/[0.04] rounded-full h-3 overflow-hidden border border-white/5">
                <div className="bg-violet-500 h-full rounded-full transition-all duration-500" style={{ width: `${levelInfo.progress}%` }} />
              </div>
              <span className="text-[10px] text-violet-400 block text-right">
                ✨ {levelInfo.nextGoal} XP to {levelInfo.level === 'Grandmaster' ? 'Ascension' : levelInfo.nextLevel}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-white/5 pt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>DAILY GOAL</span>
                  <span className="text-emerald-400 font-semibold">{completedTodayCount} / {karma.dailyGoal}</span>
                </div>
                <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${dailyGoalProgress}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>WEEKLY GOAL</span>
                  <span className="text-sky-400 font-semibold">{completedThisWeekCount} / {karma.weeklyGoal}</span>
                </div>
                <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                  <div className="bg-sky-400 h-full rounded-full" style={{ width: `${weeklyGoalProgress}%` }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/5 p-3 rounded-lg border border-white/5 font-medium leading-relaxed">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Complete tasks daily to compound your streak and earn huge rank achievements!</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-white/5 p-6 flex flex-col col-span-1 lg:col-span-7" id="today-focus">
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <div>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">CRITICAL & OVERDUE ACTIONS</span>
              <h3 className="text-lg font-bold text-white mt-1">Today&apos;s Focus Tasks</h3>
            </div>
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-full font-mono font-bold">
              {focusTasks.length} pending
            </span>
          </div>

          <div className="flex-1 mt-4 space-y-2.5 overflow-y-auto max-h-[280px] pr-1">
            {focusTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
                <span className="text-xs">No pending focus actions! All clear.</span>
              </div>
            ) : (
              focusTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/[0.06] transition duration-150 cursor-pointer"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(task.id);
                    }}
                    className="w-4 h-4 rounded-full border-2 border-violet-400/40 hover:border-violet-400 transition shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-white truncate block">{task.title}</span>
                    {task.description && <p className="text-[10px] text-slate-400 truncate mt-0.5">{task.description}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {task.priority === Priority.P1 && (
                      <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold rounded">HIGH</span>
                    )}
                    {task.labels[0] && (
                      <span className="px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[9px] font-bold rounded truncate max-w-[70px]">
                        {task.labels[0]}
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-white/5 p-6" id="heatmap-panel">
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">365 DAYS CONTRIBUTIONS</span>
            <h3 className="text-lg font-bold text-white mt-1">Solves & Completions Heatmap</h3>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-display text-emerald-400 block">{totalCompletedCompletions}</span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider block">TOTAL COMPLETIONS</span>
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

        <div className="flex justify-between items-center mt-3 text-[10px] font-mono text-slate-400">
          <span>{heatmapGrid[0]?.date} to Present</span>
          <div className="flex items-center gap-1.5">
            <span>Velocity Index: Less</span>
            <div className="w-[9px] h-[9px] rounded-[1.5px] bg-white/[0.04] border border-white/5" />
            <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald-500/20" />
            <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald-500/40" />
            <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald-500/70" />
            <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald-500" />
            <span>More</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-white/5 p-6" id="velocity-analysis">
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">ACTIVITY FLOW & MOMENTUM</span>
            <h3 className="text-lg font-bold text-white mt-1">Velocity Analysis</h3>
          </div>
          <div className="flex bg-white/[0.04] p-0.5 border border-white/5 rounded-lg text-xs">
            <button
              onClick={() => setVelocityMode('daily')}
              className={`px-3 py-1 font-mono rounded-md font-bold transition ${velocityMode === 'daily' ? 'bg-gray-900 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              DAILY FLOW
            </button>
            <button
              onClick={() => setVelocityMode('weekly')}
              className={`px-3 py-1 font-mono rounded-md font-bold transition ${velocityMode === 'weekly' ? 'bg-gray-900 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
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
