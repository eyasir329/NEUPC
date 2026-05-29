/**
 * @file Member header component
 * @module MemberHeader
 */

'use client';

import { motion } from 'framer-motion';
import { Medal, Flame, Trophy } from 'lucide-react';

export default function MemberHeader({ firstName, userLevel, streakDays = 0 }) {
  const xpPct = Math.round((userLevel.xp / userLevel.nextLevelXp) * 100);
  const rankPct = Math.max(
    1,
    Math.round((userLevel.rank / userLevel.totalMembers) * 100)
  ); // Top X%

  return (
    <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-xl md:flex-row md:items-center">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-bl-full border-b border-l border-white/10 bg-white/5"></div>

      <div className="relative z-10 flex items-center gap-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-2xl font-bold text-indigo-400"
        >
          {firstName.substring(0, 2).toUpperCase()}
        </motion.div>
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
            Welcome back
          </p>
          <h1 className="mb-2 text-3xl font-light text-zinc-100">
            {firstName}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex cursor-default items-center gap-1.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold tracking-tight text-indigo-300 uppercase"
            >
              <Medal className="h-3.5 w-3.5" />
              {userLevel.level}
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex cursor-default items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold tracking-tight text-zinc-400 uppercase"
            >
              <Trophy className="h-3.5 w-3.5" />#{userLevel.rank} of{' '}
              {userLevel.totalMembers}
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex cursor-default items-center gap-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold tracking-tight text-amber-400 uppercase"
            >
              <Flame className="h-3.5 w-3.5" />
              {streakDays}-day streak
            </motion.div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full rounded-2xl border border-white/10 bg-white/5 p-4 md:w-80">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
            Progress to{' '}
            <span className="text-indigo-400">{userLevel.title}</span>
          </span>
          <span className="font-mono text-xs font-medium text-zinc-100">
            {userLevel.xp.toLocaleString()}{' '}
            <span className="text-zinc-500">
              / {userLevel.nextLevelXp.toLocaleString()} XP
            </span>
          </span>
        </div>
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-lg bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full rounded-lg bg-indigo-500"
          ></motion.div>
        </div>
        <div className="flex items-center justify-between text-[10px] font-medium tracking-widest text-zinc-500 uppercase">
          <span>{xpPct}% complete</span>
          <span>Top {rankPct}% of members</span>
        </div>
      </div>
    </div>
  );
}
