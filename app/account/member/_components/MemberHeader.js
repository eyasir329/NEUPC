/**
 * @file Member header banner — greeting, level pill, XP progress, and
 *   activity streak in the redesigned dashboard aesthetic.
 * @module MemberHeader
 */

'use client';

import { Flame, Trophy, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Pill, GradientBar, Avatar } from './_ui';

export default function MemberHeader({ firstName, userLevel, streakDays = 0 }) {
  const xpPct = Math.round((userLevel.xp / userLevel.nextLevelXp) * 100);
  const rankPct = Math.round(
    (1 - (userLevel.rank - 1) / userLevel.totalMembers) * 100
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={firstName} size="lg" />
          <div className="min-w-0">
            <div className="text-[11px] font-medium tracking-wide text-gray-400 uppercase">
              Welcome back
            </div>
            <h1 className="mt-0.5 text-2xl font-bold text-white sm:text-3xl">
              {firstName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Pill tone="violet" icon={Trophy}>
                {userLevel.level}
              </Pill>
              <Pill tone="blue" icon={TrendingUp}>
                #{userLevel.rank} of {userLevel.totalMembers}
              </Pill>
              <Pill tone="orange" icon={Flame}>
                {streakDays}-day streak
              </Pill>
            </div>
          </div>
        </div>

        <div className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 lg:w-[340px]">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">
              Progress to{' '}
              <span className="text-amber-300">{userLevel.title}</span>
            </span>
            <span className="font-mono tabular-nums text-white/80">
              {userLevel.xp.toLocaleString()} /{' '}
              {userLevel.nextLevelXp.toLocaleString()} XP
            </span>
          </div>
          <GradientBar value={xpPct} tone="amber" />
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-500">
            <span>{xpPct}% complete</span>
            <span className="text-orange-300/80">
              Top {100 - rankPct}% of members
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
