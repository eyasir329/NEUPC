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
    if (isToday) return 'bg-indigo-500 border-indigo-400 shadow-lg shadow-black/40';
    switch (level) {
      case 0: return 'bg-white/10 border-white/10';
      case 1: return 'bg-emerald-200 border-emerald-300';
      case 2: return 'bg-emerald-300 border-emerald-400';
      case 3: return 'bg-emerald-400 border-emerald-500';
      case 4: return 'bg-emerald-500 border-emerald-600';
      case 5: return 'bg-emerald-600 border-emerald-700';
      default: return 'bg-white/10 border-white/10';
    }
  };

  const totalWeek = weekData.reduce((acc, curr) => acc + curr.value, 0);
  const avgWeek = (totalWeek / 7).toFixed(1);

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20">
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8">
        
        {/* Daily Practice */}
        <div className="flex flex-col h-full lg:border-r lg:border-white/10 lg:pr-8">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-zinc-100 tracking-tight">Daily Practice</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-6 font-medium">
            {goalMet ? "Today's goal smashed!" : `${remaining} more to hit today's goal`}
          </p>
          
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[220px]">
            <div className="w-full h-[200px] absolute inset-0">
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-col items-center justify-center relative z-10 pointer-events-none">
              <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                {goalMet ? 'Done' : 'Goal'}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-4xl font-light text-zinc-100">{todaySolved}</span>
                <span className="text-zinc-500 font-medium text-sm">/ {dailyGoal}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between w-full mt-4 bg-white/5 rounded-2xl p-3 border border-white/10">
            <div>
              <p className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-amber-500" />
                Streak
              </p>
              <span className="text-zinc-100 font-bold text-lg">{streak} <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">days</span></span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="text-right">
              <p className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase mb-1">
                {goalMet ? 'Status' : 'Remaining'}
              </p>
              <span className={`${goalMet ? 'text-emerald-400' : 'text-indigo-400'} font-bold text-lg`}>
                {goalMet ? 'Done' : remaining} {!goalMet && <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">to go</span>}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Today's Pick */}
          {problem && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-blue-500 fill-blue-500" />
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest">Today's Pick</h3>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                    problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>{problem.difficulty}</span>
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-white/10 text-zinc-400 border border-white/10">{problem.platform}</span>
                </div>
              </div>
              
              <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <a href={problem.href} target="_blank" rel="noreferrer" className="text-base font-bold text-zinc-100 mb-2 group-hover:text-indigo-400 transition-colors cursor-pointer block">
                    {problem.title}
                  </a>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-500">
                    {problem.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-lg bg-zinc-600"></span> {tag}
                      </span>
                    ))}
                    <span className="mx-1 text-zinc-600">|</span>
                    <span className="text-zinc-400">✓ {problem.solvedBy.toLocaleString()} solved</span>
                    <span className="mx-1 text-zinc-600">|</span>
                    <span className="text-zinc-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> ~{problem.estTime} min</span>
                  </div>
                </div>
                
                <a href={problem.href} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900/50 backdrop-blur-xl border border-white/10 hover:bg-white/5 text-zinc-100 text-xs font-bold uppercase tracking-widest rounded-2xl transition-colors shrink-0 shadow-lg shadow-black/40 text-center">
                  <span className="text-indigo-400 font-mono text-sm leading-none">{'</>'}</span> Solve
                </a>
              </div>
            </div>
          )}

          {/* Heatmap */}
          <div className="mt-2 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Last 7 Days</h4>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                <span className="text-zinc-100 text-xs">{totalWeek}</span> solved <span className="mx-1 text-zinc-500">&bull;</span> avg <span className="text-zinc-100 text-xs">{avgWeek}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-3">
              {weekData.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`w-full h-8 rounded-2xl border ${getHeatmapColor(day.level, i === 6)} transition-all hover:scale-105 cursor-pointer`} title={`${day.value} solved`}></div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${i === 6 ? 'text-indigo-400' : 'text-zinc-500'}`}>{day.dayLabel}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
