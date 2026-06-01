/**
 * @file Ported verbatim from the Todoist reference app. Types stripped.
 * @module daily-activity/_todoist/ProductivityModal
 */

'use client';

import { motion } from 'framer-motion';
import { X, Award, Flame, CheckCircle2, Target, Sparkles } from 'lucide-react';
import { getTodayDateString, addDays, formatDateString } from './utils';

export default function ProductivityModal({ karma, tasks, onClose, onUpdateKarmaGoals }) {
  const totalCompletedCount = tasks.filter((t) => t.completed && !t.isArchived).length;
  const todayStr = getTodayDateString();
  const completedTodayCount = tasks.filter((t) => t.completed && t.completedAt && t.completedAt.startsWith(todayStr)).length;

  const lastFiveDays = Array.from({ length: 5 }, (_, i) => {
    const dVal = addDays(new Date(), -i);
    const dateStr = formatDateString(dVal);
    const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : dVal.toLocaleDateString('en-US', { weekday: 'short' });
    const count = tasks.filter((t) => t.completed && t.completedAt && t.completedAt.startsWith(dateStr)).length;
    return { dateStr, label, count };
  }).reverse();

  const maxCompleted = Math.max(1, ...lastFiveDays.map((d) => d.count), karma.dailyGoal);

  const getNextLevelScore = (score) => {
    if (score < 500) return { next: 500, label: 'Amateur' };
    if (score < 1000) return { next: 1000, label: 'Intermediate' };
    if (score < 1500) return { next: 1500, label: 'Professional' };
    if (score < 2500) return { next: 2500, label: 'Expert' };
    if (score < 4000) return { next: 4000, label: 'Master' };
    return { next: 8000, label: 'Grandmaster' };
  };

  const nextLevel = getNextLevelScore(karma.score);
  const karmaRatio = Math.min(1, karma.score / nextLevel.next);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-[#141414] rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-850 bg-[#181818]">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            <span className="font-bold text-white">Productivity & Karma Status</span>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg text-slate-500 hover:text-white transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] text-zinc-200">
          <div className="bg-gradient-to-tr from-amber-950/10 to-rose-950/10 p-5 rounded-xl border border-amber-900/10 text-center space-y-3.5 relative overflow-hidden">
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500/10 text-amber-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 fill-current animate-pulse" />
              <span>Karma Active</span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block">Your Level</span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">{karma.level}</h2>
              <span className="font-mono text-xs font-bold text-zinc-400">{karma.score} pts</span>
            </div>

            <div className="space-y-1 max-w-xs mx-auto">
              <div className="w-full h-1.5 bg-zinc-850 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300" style={{ width: `${karmaRatio * 100}%` }} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-medium">
                <span>Next Rank: {nextLevel.label}</span>
                <span>{karma.score} / {nextLevel.next}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-zinc-800 text-center space-y-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total Done</span>
              <strong className="text-xl font-extrabold text-white font-mono">{totalCompletedCount}</strong>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 text-center space-y-1">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20 mx-auto animate-bounce" />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Day Streak</span>
              <strong className="text-xl font-extrabold text-white font-mono">{karma.dailyStreak} days</strong>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 text-center space-y-1">
              <Target className="w-5 h-5 text-[#cc4b3e] mx-auto" />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Today Check</span>
              <strong className="text-xl font-extrabold text-white font-mono">{completedTodayCount}/{karma.dailyGoal}</strong>
            </div>
          </div>

          <div className="space-y-3.5 p-4 border border-zinc-850 rounded-xl bg-zinc-950/40">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Adjust Daily Goals</span>
            <div className="flex items-center justify-between text-xs gap-4">
              <div className="flex-1 flex flex-col gap-1 text-zinc-400">
                <span className="font-semibold text-zinc-300">Daily Task Goal Target</span>
                <p className="text-[10.5px] text-zinc-500">How many tasks you target to complete today</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button type="button" onClick={() => onUpdateKarmaGoals(Math.max(1, karma.dailyGoal - 1), karma.weeklyGoal)} className="w-7 h-7 rounded border border-zinc-800 hover:bg-zinc-900 flex items-center justify-center font-bold font-mono text-xs cursor-pointer text-white">
                  -
                </button>
                <span className="w-6 text-center font-bold font-mono text-sm text-white">{karma.dailyGoal}</span>
                <button type="button" onClick={() => onUpdateKarmaGoals(karma.dailyGoal + 1, karma.weeklyGoal)} className="w-7 h-7 rounded border border-zinc-800 hover:bg-zinc-900 flex items-center justify-center font-bold font-mono text-xs cursor-pointer text-white">
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Weekly Velocity Profile</span>

            <div className="flex items-end justify-between h-32 px-4 pt-4 pb-2 border border-zinc-850 p-3 rounded-2xl bg-[#1a1a1a]">
              {lastFiveDays.map((item) => {
                const heightRatio = item.count / maxCompleted;
                const isTargetPassed = item.count >= karma.dailyGoal;
                return (
                  <div key={item.dateStr} className="flex flex-col items-center gap-2 flex-1 group/bar relative">
                    <div className="absolute bottom-full mb-1.5 opacity-0 group-hover/bar:opacity-100 bg-slate-800 text-white rounded text-[10px] px-1.5 py-0.5 pointer-events-none transition-opacity font-mono z-10 text-center">
                      {item.count} tasks done
                    </div>

                    <div className="w-7 bg-zinc-800 rounded-t-lg h-24 flex items-end overflow-hidden justify-center relative">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightRatio * 100}%` }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className={`w-full rounded-t-md ${isTargetPassed ? 'bg-gradient-to-t from-emerald-500 to-teal-500' : 'bg-gradient-to-t from-orange-400 to-amber-400'}`}
                      />
                    </div>

                    <span className="text-[10px] text-zinc-500 font-semibold font-mono uppercase truncate max-w-full">{item.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[10.5px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Daily Target Met</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400" /> Goal Not Met</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#181818] border-t border-zinc-850 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-[#cc4b3e] hover:bg-[#b03d32] text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer">
            Acknowledge & Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
}
