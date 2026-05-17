'use client';

import { motion } from 'framer-motion';
import { Medal, Flame, Trophy } from 'lucide-react';

export default function MemberHeader({ firstName, userLevel, streakDays = 0 }) {
  const xpPct = Math.round((userLevel.xp / userLevel.nextLevelXp) * 100);
  const rankPct = Math.max(1, Math.round((userLevel.rank / userLevel.totalMembers) * 100)); // Top X%

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-full -translate-y-1/2 translate-x-1/2 border-l border-b border-white/10"></div>
      
      <div className="flex items-center gap-5 relative z-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-2xl font-bold rounded-2xl shrink-0"
        >
          {firstName.substring(0, 2).toUpperCase()}
        </motion.div>
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Welcome back</p>
          <h1 className="text-3xl font-light text-zinc-100 mb-2">{firstName}</h1>
          
          <div className="flex flex-wrap items-center gap-2">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-tight rounded-2xl cursor-default">
              <Medal className="w-3.5 h-3.5" />
              {userLevel.level}
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 text-zinc-400 text-xs font-semibold uppercase tracking-tight rounded-2xl cursor-default">
              <Trophy className="w-3.5 h-3.5" />
              #{userLevel.rank} of {userLevel.totalMembers}
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-tight rounded-2xl cursor-default">
              <Flame className="w-3.5 h-3.5" />
              {streakDays}-day streak
            </motion.div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-80 relative z-10 bg-white/5 p-4 border border-white/10 rounded-2xl">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Progress to <span className="text-indigo-400">{userLevel.title}</span></span>
          <span className="text-zinc-100 font-mono text-xs font-medium">{userLevel.xp.toLocaleString()} <span className="text-zinc-500">/ {userLevel.nextLevelXp.toLocaleString()} XP</span></span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-lg overflow-hidden mb-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-indigo-500 rounded-lg"
          ></motion.div>
        </div>
        <div className="flex items-center justify-between text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
          <span>{xpPct}% complete</span>
          <span>Top {rankPct}% of members</span>
        </div>
      </div>
    </div>
  );
}
