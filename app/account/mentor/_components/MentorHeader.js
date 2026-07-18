/**
 * @file Mentor header component — welcome banner with live mentorship
 *   stats and a session-completion progress bar.
 * @module MentorHeader
 */

'use client';

import { motion } from 'framer-motion';
import { Sparkles, Users, TrendingUp, GraduationCap } from 'lucide-react';

export default function MentorHeader({ mentorName, stats }) {
  const totalSessions = stats.completedSessions + stats.upcomingSessions;
  const completionPct =
    totalSessions > 0
      ? Math.round((stats.completedSessions / totalSessions) * 100)
      : 0;

  return (
    <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-xl sm:p-8 md:flex-row md:items-center">
      <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-bl-full border-b border-l border-white/10 bg-emerald-500/5" />
      <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-tr-full bg-blue-500/5" />

      <div className="relative z-10 flex items-center gap-4 sm:gap-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-xl font-bold text-emerald-400 sm:h-16 sm:w-16 sm:text-2xl"
        >
          {mentorName.substring(0, 2).toUpperCase()}
        </motion.div>

        <div>
          <p className="mb-1 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
            Welcome back
          </p>
          <h1 className="mb-2 text-2xl font-light text-zinc-100 sm:text-3xl">
            {mentorName}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex cursor-default items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold tracking-tight text-emerald-300 uppercase"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Mentor
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex cursor-default items-center gap-1.5 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold tracking-tight text-violet-300 uppercase"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              {stats.bootcamps} Bootcamp{stats.bootcamps === 1 ? '' : 's'}
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex cursor-default items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold tracking-tight text-zinc-400 uppercase"
            >
              <Users className="h-3.5 w-3.5" />
              {stats.activeMentees} Mentee{stats.activeMentees === 1 ? '' : 's'}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full rounded-2xl border border-white/10 bg-white/5 p-4 md:w-72">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            Sessions Progress
          </span>
          <span className="font-mono text-xs font-medium text-zinc-100">
            {completionPct}%
          </span>
        </div>
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-lg bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full rounded-lg bg-emerald-500"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-medium tracking-widest text-zinc-500 uppercase">
          <span>{stats.completedSessions} sessions done</span>
          <span>{stats.upcomingSessions} upcoming</span>
        </div>
      </div>
    </div>
  );
}
