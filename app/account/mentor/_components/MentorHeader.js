'use client';

import { motion } from 'framer-motion';
import { Star, Sparkles, Users, TrendingUp } from 'lucide-react';

export default function MentorHeader({ mentorName, stats }) {
  const completionPct = stats.completionRate ?? 0;

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-bl-full -translate-y-1/2 translate-x-1/2 border-l border-b border-white/10" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-tr-full translate-y-1/2 -translate-x-1/2" />

      <div className="flex items-center gap-5 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl font-bold rounded-2xl shrink-0"
        >
          {mentorName.substring(0, 2).toUpperCase()}
        </motion.div>

        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h1 className="text-3xl font-light text-zinc-100 mb-2">{mentorName}</h1>

          <div className="flex flex-wrap items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-tight rounded-2xl cursor-default"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Technical Mentor
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-tight rounded-2xl cursor-default"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {stats.averageRating} Rating
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 text-zinc-400 text-xs font-semibold uppercase tracking-tight rounded-2xl cursor-default"
            >
              <Users className="w-3.5 h-3.5" />
              {stats.activeMentees} Mentees
            </motion.div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-72 relative z-10 bg-white/5 p-4 border border-white/10 rounded-2xl">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Completion Rate
          </span>
          <span className="text-zinc-100 font-mono text-xs font-medium">
            {completionPct}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-lg overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full bg-emerald-500 rounded-lg"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
          <span>{stats.completedSessions} sessions done</span>
          <span>{stats.upcomingSessions} upcoming</span>
        </div>
      </div>
    </div>
  );
}
