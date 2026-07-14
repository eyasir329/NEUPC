/**
 * @file Achievements section component
 * @module AchievementsSection
 */

'use client';

import { motion } from 'framer-motion';
import { Trophy, ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';

export default function AchievementsSection({ achievements }) {
  const earnedCount = achievements.filter((a) => a.earned).length;
  const inProgressCount = achievements.filter((a) => !a.earned).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-light tracking-widest text-zinc-100 uppercase">
              Achievements
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {earnedCount} earned &middot; {inProgressCount} in progress
            </p>
          </div>
        </div>
        <Link
          href="/account/member/participation"
          className="flex shrink-0 items-center gap-2 text-xs font-bold tracking-widest text-amber-400 uppercase transition-colors hover:text-amber-300"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
        {achievements.map((acc, i) => (
          <motion.div
            key={acc.title}
            whileHover={!acc.earned ? {} : { y: -5, scale: 1.02 }}
            className={`relative flex flex-col items-center rounded-2xl border p-6 text-center transition-colors ${!acc.earned ? 'border-white/10 bg-white/5 opacity-60' : 'cursor-pointer border-white/10 bg-zinc-900/50 backdrop-blur-xl hover:border-amber-500/30 hover:bg-zinc-900 hover:shadow-xl hover:shadow-amber-500/10'}`}
          >
            <div
              className={`mb-4 text-4xl ${!acc.earned ? 'opacity-75 grayscale' : ''}`}
            >
              {acc.icon}
            </div>
            <h4 className="mb-2 text-xs leading-tight font-bold text-zinc-100">
              {acc.title}
            </h4>
            {!acc.earned ? (
              <div className="flex w-full flex-col items-center gap-1.5">
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-amber-500/50"
                    style={{ width: `${acc.progress}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center gap-1 font-mono text-[10px] font-medium text-zinc-500">
                  <Lock className="h-3 w-3" /> {acc.progress}%
                </div>
              </div>
            ) : (
              <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                {acc.date}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
