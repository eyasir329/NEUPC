/**
 * @file Admin header banner — clarity-first dark glass surface with
 *   greeting, role pills, and a system-health progress meter. Matches
 *   the member panel header pattern.
 * @module AdminHeader
 */

'use client';

import { motion } from 'framer-motion';
import { Shield, Activity, AlertCircle, Server } from 'lucide-react';

export default function AdminHeader({ stats }) {
  const health = Math.max(0, Math.min(100, stats?.systemHealth ?? 0));
  const pending = stats?.pendingApprovals ?? 0;

  return (
    <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-xl md:flex-row md:items-center">
      <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-bl-full border-b border-l border-white/10 bg-white/5" />

      <div className="relative z-10 flex items-center gap-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
        >
          <Shield className="h-7 w-7" />
        </motion.div>
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
            Control center
          </p>
          <h1 className="mb-2 text-3xl font-light text-zinc-100">
            Admin Console
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex cursor-default items-center gap-1.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold tracking-tight text-indigo-300 uppercase"
            >
              <Shield className="h-3.5 w-3.5" />
              Full access
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex cursor-default items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold tracking-tight text-emerald-300 uppercase"
            >
              <Activity className="h-3.5 w-3.5" />
              All systems healthy
            </motion.div>
            {pending > 0 && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex cursor-default items-center gap-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold tracking-tight text-amber-300 uppercase"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {pending} pending
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full rounded-2xl border border-white/10 bg-white/5 p-4 md:w-80">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
            <Server className="h-3.5 w-3.5" /> System health
          </span>
          <span className="font-mono text-xs font-medium text-zinc-100">
            {health}
            <span className="text-zinc-500">%</span>
          </span>
        </div>
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-lg bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${health}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full rounded-lg bg-emerald-500"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-medium tracking-widest text-zinc-500 uppercase">
          <span>Uptime nominal</span>
          <span>Live</span>
        </div>
      </div>
    </div>
  );
}
