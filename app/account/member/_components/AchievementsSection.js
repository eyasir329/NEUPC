'use client';

import { motion } from 'framer-motion';
import { Trophy, ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';

export default function AchievementsSection({ achievements }) {
  const earnedCount = achievements.filter(a => a.earned).length;
  const inProgressCount = achievements.filter(a => !a.earned).length;

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 rounded-2xl shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-light text-zinc-100 uppercase tracking-widest">Achievements</h3>
            <p className="text-xs text-zinc-500 mt-1">{earnedCount} earned &middot; {inProgressCount} in progress</p>
          </div>
        </div>
        <Link 
          href="/account/member/achievements"
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors shrink-0"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-6">
        {achievements.map((acc, i) => (
          <motion.div 
            key={acc.title} 
            whileHover={!acc.earned ? {} : { y: -5, scale: 1.02 }}
            className={`relative flex flex-col items-center text-center p-6 border rounded-2xl transition-colors ${!acc.earned ? 'bg-white/5 border-white/10 opacity-60' : 'bg-zinc-900/50 backdrop-blur-xl border-white/10 hover:border-amber-500/30 hover:bg-zinc-900 hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer'}`}
          >
            <div className={`text-4xl mb-4 ${!acc.earned ? 'grayscale opacity-75' : ''}`}>{acc.icon}</div>
            <h4 className="text-xs font-bold text-zinc-100 mb-2 leading-tight">{acc.title}</h4>
            {!acc.earned ? (
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500/50 rounded-full" style={{ width: `${acc.progress}%` }} />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono font-medium mt-1">
                  <Lock className="w-3 h-3" /> {acc.progress}%
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{acc.date}</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
