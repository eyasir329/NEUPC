/**
 * @file Topics analysis tab.
 * @module TopicsTab
 */

'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { cn } from './ps-shared';

function TopicsTab({ submissions }) {
  // Build topic mastery from submission tags
  const topics = useMemo(() => {
    const tally = new Map();
    (submissions || []).forEach((s) => {
      const v = String(s.verdict || '').toUpperCase();
      const ac = v === 'OK' || v === 'AC' || v === 'ACCEPTED';
      (s.tags || []).forEach((t) => {
        if (!tally.has(t)) tally.set(t, { solves: 0, attempts: 0 });
        const e = tally.get(t);
        e.attempts += 1;
        if (ac) e.solves += 1;
      });
    });
    return Array.from(tally.entries())
      .map(([name, e]) => {
        const total = Math.max(50, e.solves * 1.4);
        const pct = (e.solves / total) * 100;
        const level = pct >= 70 ? 'g' : pct >= 35 ? 'w' : 'b';
        return { n: name, s: e.solves, t: Math.round(total), l: level };
      })
      .sort((a, b) => b.s - a.s)
      .slice(0, 18);
  }, [submissions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Topic Mastery
            </h3>
            <p className="mt-1 text-sm font-medium text-zinc-400">
              Performance by individual algorithm and data structure
            </p>
          </div>
          <div className="flex gap-4 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />{' '}
              Mastered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />{' '}
              Learning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />{' '}
              Needs Review
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 pt-2 md:grid-cols-2 xl:grid-cols-3">
          {topics.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm font-medium text-zinc-500">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                <Sparkles className="h-5 w-5 text-zinc-600" />
              </div>
              No topic data — solve some problems to populate this section.
            </div>
          )}
          {topics.map((e, i) => {
            const n = Math.round((e.s / e.t) * 100);
            const r =
              e.l === 'g'
                ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                : e.l === 'w'
                  ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                  : 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.3)]';
            return (
              <div key={i} className="flex flex-col gap-3">
                <div className="flex items-end justify-between">
                  <span className="text-[13px] font-bold text-zinc-200 capitalize">
                    {e.n}
                  </span>
                  <div className="text-xs font-medium text-zinc-500">
                    <span className="font-bold text-white">{e.s}</span> / {e.t}{' '}
                    solves
                  </div>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/40 shadow-inner ring-1 ring-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${n}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={cn(
                      'absolute top-0 left-0 h-full rounded-full',
                      r
                    )}
                  />
                  <div className="absolute top-1/2 right-2 -translate-y-1/2 text-[9px] font-black text-black/60 mix-blend-overlay drop-shadow-md">
                    {n}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


export { TopicsTab };
