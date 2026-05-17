'use client';

import { motion } from 'framer-motion';
import { Crown, Shield, Flame } from 'lucide-react';

export default function ExecutiveHeader({ session }) {
  const firstName = session?.user?.name?.split(' ')[0] || 'Executive';
  const fullName = session?.user?.name || 'Executive';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-full -translate-y-1/2 translate-x-1/2 border-l border-b border-white/10" />

      <div className="flex items-center gap-5 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl font-bold rounded-2xl shrink-0"
        >
          {initials || <Crown className="w-7 h-7" />}
        </motion.div>
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h1 className="text-3xl font-light text-zinc-100 mb-2">{firstName}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-tight rounded-2xl cursor-default"
            >
              <Crown className="w-3.5 h-3.5" />
              Executive Committee
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 text-zinc-400 text-xs font-semibold uppercase tracking-tight rounded-2xl cursor-default"
            >
              <Shield className="w-3.5 h-3.5" />
              Term 2025–2026
            </motion.div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full md:w-80 bg-white/5 p-4 border border-white/10 rounded-2xl">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
          Committee overview
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Manage events', color: 'text-blue-400' },
            { label: 'Review content', color: 'text-violet-400' },
            { label: 'Member ops', color: 'text-emerald-400' },
          ].map((item) => (
            <span
              key={item.label}
              className={`text-[11px] font-medium ${item.color} bg-white/4 border border-white/10 px-2.5 py-1 rounded-full`}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
