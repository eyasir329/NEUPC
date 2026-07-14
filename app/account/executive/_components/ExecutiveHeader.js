/**
 * @file Executive header component
 * @module ExecutiveHeader
 */

'use client';

import { motion } from 'framer-motion';
import { Crown, Shield } from 'lucide-react';

export default function ExecutiveHeader({ firstName, fullName }) {
  const startYear =
    new Date().getMonth() >= 6
      ? new Date().getFullYear()
      : new Date().getFullYear() - 1;
  const initials = (fullName || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-xl md:flex-row md:items-center">
      <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-bl-full border-b border-l border-white/10 bg-white/5" />

      <div className="relative z-10 flex items-center gap-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-2xl font-bold text-amber-400"
        >
          {initials || <Crown className="h-7 w-7" />}
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
              className="flex cursor-default items-center gap-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold tracking-tight text-amber-300 uppercase"
            >
              <Crown className="h-3.5 w-3.5" />
              Executive Committee
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex cursor-default items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold tracking-tight text-zinc-400 uppercase"
            >
              <Shield className="h-3.5 w-3.5" />
              Term {startYear}–{startYear + 1}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full rounded-2xl border border-white/10 bg-white/5 p-4 md:w-80">
        <p className="mb-3 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
          Committee overview
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Manage events', color: 'text-blue-400' },
            { label: 'Review content', color: 'text-violet-400' },
            { label: 'Member ops', color: 'text-emerald-400' },
          ].map((item) => (
            <span
              key={item.label}
              className={`text-[11px] font-medium ${item.color} rounded-full border border-white/10 bg-white/4 px-2.5 py-1`}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
