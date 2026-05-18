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
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-full -translate-y-1/2 translate-x-1/2 border-l border-b border-white/10" />

      <div className="flex items-center gap-5 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 rounded-2xl shrink-0"
        >
          <Shield className="w-7 h-7" />
        </motion.div>
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
            Control center
          </p>
          <h1 className="text-3xl font-light text-zinc-100 mb-2">
            Admin Console
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-tight rounded-2xl cursor-default"
            >
              <Shield className="w-3.5 h-3.5" />
              Full access
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-tight rounded-2xl cursor-default"
            >
              <Activity className="w-3.5 h-3.5" />
              All systems healthy
            </motion.div>
            {pending > 0 && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-tight rounded-2xl cursor-default"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {pending} pending
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full md:w-80 relative z-10 bg-white/5 p-4 border border-white/10 rounded-2xl">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <Server className="w-3.5 h-3.5" /> System health
          </span>
          <span className="text-zinc-100 font-mono text-xs font-medium">
            {health}
            <span className="text-zinc-500">%</span>
          </span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-lg overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${health}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full bg-emerald-500 rounded-lg"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
          <span>Uptime nominal</span>
          <span>Live</span>
        </div>
      </div>
    </div>
  );
}
